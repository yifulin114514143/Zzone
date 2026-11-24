import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Server-side LLM Client backed by AccountPoolManager (platform: "llm")
 * - Never exposes API keys to the frontend
 * - Batches 10-15 news items per request to save ~80% tokens
 * - Persists SHA-256 content-hashed results to `server/data/ai-cache.json`
 * - Enforces daily call cap & cooldown retries to protect account balance
 */
export class LLMClient {
  constructor(pool, cacheFilePath) {
    this.pool = pool;
    this.cacheFilePath = cacheFilePath;
    this.cache = {}; // hash -> { category, summary, tags, takeaways, isRoutine, cachedAt }
    this.queryCache = new Map(); // normalizedQuery -> { answer, at, model }
    this.dailyLimit = Number(process.env.LLM_DAILY_LIMIT || 120);
    this.dayKey = new Date().toISOString().slice(0, 10);
    this.stats = {
      callsToday: 0,
      totalCalls: 0,
      cacheHits: 0,
      totalTokens: 0,
      lastModel: null,
      lastCalledAt: null,
      lastError: null,
    };
    this.loadCache();
  }

  loadCache() {
    if (!this.cacheFilePath || !fs.existsSync(this.cacheFilePath)) return;
    try {
      const parsed = JSON.parse(fs.readFileSync(this.cacheFilePath, "utf-8"));
      if (parsed && typeof parsed === "object") {
        this.cache = parsed.items || parsed;
      }
      console.log(`[Zzone LLM] Restored ${Object.keys(this.cache).length} cached AI summaries`);
    } catch (err) {
      console.warn("[Zzone LLM] Failed to load ai-cache.json:", err.message);
    }
  }

  persistCache() {
    if (!this.cacheFilePath) return;
    try {
      fs.mkdirSync(path.dirname(this.cacheFilePath), { recursive: true });
      const tmp = `${this.cacheFilePath}.tmp`;
      fs.writeFileSync(
        tmp,
        JSON.stringify(
          {
            savedAt: new Date().toISOString(),
            count: Object.keys(this.cache).length,
            items: this.cache,
          },
          null,
          2
        ),
        "utf-8"
      );
      fs.renameSync(tmp, this.cacheFilePath);
    } catch (err) {
      console.warn("[Zzone LLM] Failed to persist ai-cache.json:", err.message);
    }
  }

  hashItem(item) {
    const raw = `${item.title || ""}|${String(item.bodyText || item.excerpt || "").slice(0, 600)}`;
    return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 20);
  }

  getCachedEnrichment(item) {
    const h = this.hashItem(item);
    return this.cache[h] || null;
  }

  applyCachedToItems(items) {
    return items.map((item) => {
      const hit = this.getCachedEnrichment(item);
      if (!hit) return item;
      return {
        ...item,
        aiSummary: hit.summary || undefined,
        aiCategory: hit.category || undefined,
        aiTags: Array.isArray(hit.tags) && hit.tags.length > 0 ? hit.tags : undefined,
        aiTakeaways:
          Array.isArray(hit.takeaways) && hit.takeaways.length > 0 ? hit.takeaways : undefined,
      };
    });
  }

  checkDailyCap() {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.dayKey) {
      this.dayKey = today;
      this.stats.callsToday = 0;
    }
    if (this.stats.callsToday >= this.dailyLimit) {
      throw new Error(`已达到今日 LLM 调用安全上限 (${this.dailyLimit} 次/日)，防止余额过快消耗`);
    }
  }

  parseJsonLoose(text = "") {
    const trimmed = String(text).trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (fenced) return JSON.parse(fenced[1].trim());
      const start = trimmed.indexOf("{");
      const end = trimmed.lastIndexOf("}");
      if (start >= 0 && end > start) {
        return JSON.parse(trimmed.slice(start, end + 1));
      }
      throw new Error("LLM 返回内容不是有效 JSON");
    }
  }

  async chat(
    messages,
    { json = false, maxTokens = 900, timeoutMs = 60000, modelOverride = "", reasoningEffort } = {}
  ) {
    this.checkDailyCap();

    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const acc = this.pool.acquire("llm");
      if (!acc) throw new Error("LLM 号池暂无可用账号（未配置或冷却中）");

      const baseUrl = String(
        process.env.LLM_BASE_URL || acc.credentials?.baseUrl || ""
      ).replace(/\/+$/, "");
      const apiKey = String(process.env.LLM_API_KEY || acc.credentials?.apiKey || "");
      const model = String(
        modelOverride || process.env.LLM_MODEL || acc.credentials?.model || "cn:deepseek-v4.1-flash"
      );

      if (!baseUrl || !apiKey) {
        throw new Error("LLM 号池缺少 baseUrl 或 apiKey");
      }

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const body = {
          model,
          messages,
          max_tokens: maxTokens,
          ...(json ? { response_format: { type: "json_object" } } : {}),
          ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
        };

        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });

        if (res.status === 429 || res.status >= 500) {
          this.pool.markCooldown(acc.id, 60_000, `http-${res.status}`);
          lastErr = new Error(`LLM HTTP ${res.status}`);
          continue;
        }

        if (!res.ok) {
          const errText = (await res.text()).slice(0, 300);
          throw new Error(`LLM ${res.status}: ${errText}`);
        }

        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content !== "string" || !content.trim()) {
          throw new Error("LLM 返回内容为空");
        }

        this.stats.callsToday += 1;
        this.stats.totalCalls += 1;
        this.stats.lastModel = data?.model || model;
        this.stats.lastCalledAt = new Date().toISOString();
        this.stats.lastError = null;
        if (data?.usage?.total_tokens) {
          this.stats.totalTokens += Number(data.usage.total_tokens) || 0;
        }
        return {
          content: content.trim(),
          model: data?.model || model,
          usage: data?.usage || null,
        };
      } catch (err) {
        lastErr = err;
        this.stats.lastError = err.message;
        if (err.name === "AbortError") {
          this.pool.markCooldown(acc.id, 30_000, "timeout");
          continue;
        }
        // Network failure (e.g. Tailscale not connected or host unreachable)
        if (attempt === 2) throw err;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastErr || new Error("LLM 调用失败（已重试 3 次）");
  }

  /**
   * Batch enrich uncached news items (10-15 items per LLM call) and persist to disk cache
   */
  async enrichBatch(items, { maxPerBatch = 12 } = {}) {
    const uncached = [];
    const results = {};

    for (const item of items) {
      const h = this.hashItem(item);
      if (this.cache[h]) {
        this.stats.cacheHits += 1;
        results[item.infoId] = { ...this.cache[h], fromCache: true };
      } else {
        uncached.push({ item, hash: h });
      }
    }

    const batch = uncached.slice(0, maxPerBatch);
    if (batch.length === 0) {
      return {
        enrichedCount: 0,
        cacheHitCount: Object.keys(results).length,
        remainingUncached: 0,
        results,
      };
    }

    const payload = batch.map(({ item }) => ({
      id: item.infoId,
      source: item.sourceName || item.sourcePlatform || "official",
      title: item.title,
      excerpt: String(item.bodyText || item.excerpt || "").slice(0, 260),
    }));

    const systemPrompt =
      '你是《绝区零》Zzone 资讯站的智能归类与摘要器。请根据输入的多条资讯，只输出合法 JSON：{"items":[{"id":"原id","category":"collab|banner|event|agent|patch|media|code","summary":"50字内精炼中文摘要，突出时间与福利","tags":["标签1","标签2"],"takeaways":["核心要点1","核心要点2"]}] }。严禁输出任何多余解释文字。';

    const { content, model, usage } = await this.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(payload) },
      ],
      { json: true, maxTokens: 2800, timeoutMs: 90000 }
    );

    const parsed = this.parseJsonLoose(content);
    const outList = Array.isArray(parsed?.items) ? parsed.items : [];
    const byId = new Map(outList.map((x) => [String(x.id), x]));

    let newlyCached = 0;
    const allowedCats = new Set(["collab", "banner", "event", "agent", "patch", "media", "code"]);

    for (const { item, hash } of batch) {
      const ai = byId.get(String(item.infoId));
      if (!ai) continue;
      const clean = {
        category: allowedCats.has(ai.category) ? ai.category : undefined,
        summary: typeof ai.summary === "string" ? ai.summary.trim().slice(0, 140) : "",
        tags: Array.isArray(ai.tags)
          ? ai.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 4)
          : [],
        takeaways: Array.isArray(ai.takeaways)
          ? ai.takeaways.map((t) => String(t).trim()).filter(Boolean).slice(0, 3)
          : [],
        cachedAt: new Date().toISOString(),
        model,
      };
      this.cache[hash] = clean;
      results[item.infoId] = { ...clean, fromCache: false };
      newlyCached += 1;
    }

    if (newlyCached > 0) this.persistCache();

    return {
      enrichedCount: newlyCached,
      cacheHitCount: Object.keys(results).length - newlyCached,
      remainingUncached: Math.max(0, uncached.length - batch.length),
      model,
      usage,
      results,
    };
  }

  /**
   * Concise AI summary for a search query over matched news/events/merch (with 30-min cache)
   */
  async summarizeSearch(query, contextItems, lang = "zh") {
    const safeLang = ["zh", "ja", "ko", "en"].includes(lang) ? lang : "zh";
    const norm = `${safeLang}:${String(query || "").trim().toLowerCase()}`;
    if (!String(query || "").trim()) throw new Error("Missing search query");

    const cached = this.queryCache.get(norm);
    if (cached && Date.now() - cached.at < 30 * 60 * 1000) {
      this.stats.cacheHits += 1;
      return { answer: cached.answer, model: cached.model, fromCache: true };
    }

    const compact = (contextItems || []).slice(0, 10).map((it) => ({
      kind: it.kind,
      title: it.title,
      meta: it.meta,
      excerpt: String(it.excerpt || "").slice(0, 160),
    }));

    const langSystemPrompts = {
      zh: "你是《绝区零》Zzone 信息聚合站的智能速报助手。仅基于提供的站内实时聚合情报，用简洁简体中文（3~4句，总计150字内）直接回答用户检索词的核心动态、时间节点或周边价格，严格使用官方中文游戏名称，不编造未出现的信息。",
      ja: "あなたは『ゼンレスゾーンゼロ』情報サイト Zzone の要約アシスタントです。提供された最新情報のみに基づき、簡潔な日本語（3〜4文、180文字以内）で重要な最新動向・開催日程・グッズ価格を回答してください。キャラクター名・バージョン名・用語は必ず公式日本語表記（サンブリンガー、ロビン、ポリクローム、ボンプ等）を使用してください。",
      ko: "당신은 〈젠레스 존 제로〉 정보 허브 Zzone의 요약 어시스턴트입니다. 제공된 정보만을 바탕으로 간결한 한국어(3~4문장, 180자 이내)로 핵심 소식, 일정, 굿즈 가격을 요약하세요. 캐릭터·버전·용어는 반드시 공식 한국어 표기(태양을 가져온 자, 로빈, 폴리크롬, Bangboo 등)를 사용하세요.",
      en: "You are the concise briefing assistant for Zzone, a Zenless Zone Zero news hub. Based ONLY on the provided items, summarize key updates, dates, or merch prices in 3–4 crisp English sentences (under 80 words). Strictly use official in-game English names (Sunbringer, Robin, Polychrome, Bangboo, Void Hunter, etc.) and never fabricate facts.",
    };

    const { content, model, usage } = await this.chat(
      [
        {
          role: "system",
          content: langSystemPrompts[safeLang],
        },
        {
          role: "user",
          content: `Query: ${query}\n\nMatched Items:\n${JSON.stringify(compact)}`,
        },
      ],
      { json: false, maxTokens: 1200, timeoutMs: 60000 }
    );

    this.queryCache.set(norm, { answer: content, model, at: Date.now() });
    if (this.queryCache.size > 120) {
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }

    return { answer: content, model, usage, fromCache: false };
  }

  getStatus() {
    const llmPool = this.pool.getSummary().byPlatform?.llm || { total: 0, healthy: 0, cooling: 0 };
    const acc = this.pool.accounts.find((a) => a.platform === "llm" && a.enabled);
    return {
      enabled: llmPool.total > 0,
      healthy: llmPool.healthy > 0,
      model: process.env.LLM_MODEL || acc?.credentials?.model || null,
      cachedSummaries: Object.keys(this.cache).length,
      callsToday: this.stats.callsToday,
      dailyLimit: this.dailyLimit,
      totalCalls: this.stats.totalCalls,
      cacheHits: this.stats.cacheHits,
      totalTokens: this.stats.totalTokens,
      lastCalledAt: this.stats.lastCalledAt,
      lastError: this.stats.lastError,
    };
  }
}
