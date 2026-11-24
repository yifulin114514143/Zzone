import React, { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Copy,
  Cpu,
  Database,
  RefreshCw,
  Rss,
  Smartphone,
} from "lucide-react";
import { localizeSource } from "../industry/localizedData";
import { buildUnifiedNewsList, type RawOfficialArticle } from "../industry/news";
import {
  COLLECTOR_SOURCES,
  type CollectorSourceGroup,
  type CollectorSourceRegion,
} from "../industry/site";
import type { NewsItem } from "../industry/types";
import { useI18n, type AppLang } from "../lib/i18n";
import { NewsCard } from "../components/NewsCard";
import { SourceBadge } from "../components/SourceIcon";

interface HubViewProps {
  news: NewsItem[];
  bookmarks: Set<string>;
  readIds: Set<string>;
  syncedAt: string;
  isSyncing: boolean;
  onSync: () => void;
  onApplyNews: (items: NewsItem[]) => void;
  onOpenItem: (item: NewsItem) => void;
  onToggleBookmark: (id: string) => void;
  onNotify: (msg: string) => void;
}

interface StatusResp {
  ok: boolean;
  syncRuns: number;
  liveEventsCount?: number;
  liveMerchCount?: number;
  pool?: {
    totalAccounts: number;
    activeAccounts: number;
  };
  llm?: {
    enabled: boolean;
    healthy: boolean;
    model: string | null;
    cachedSummaries: number;
    callsToday: number;
    dailyLimit: number;
    cacheHits: number;
    lastError: string | null;
  };
}

const GROUP_COPY: Record<
  AppLang,
  {
    all: string;
    official: string;
    events_fan: string;
    merch_goods: string;
    regions: Record<CollectorSourceRegion, string>;
    liveMatrixDesc: string;
  }
> = {
  zh: {
    all: "全部信源",
    official: "国内外官方",
    events_fan: "漫展与同人",
    merch_goods: "国内外周边与谷子",
    regions: { cn: "国服/国内", global: "全球", jp: "日本", kr: "韩国", tw: "港澳台" },
    liveMatrixDesc: "免号池直连中/英/日/韩/繁中全官方、米游社、HoYoLAB、YouTube RSS、B站会员购漫展、CPP 同人展与新品周边自动发现。",
  },
  ja: {
    all: "全ソース",
    official: "国内外公式",
    events_fan: "展示会・同人",
    merch_goods: "国内外グッズ",
    regions: { cn: "中国", global: "グローバル", jp: "日本", kr: "韓国", tw: "台湾・香港" },
    liveMatrixDesc: "中/英/日/韓/繁中公式・米遊社・HoYoLAB・YouTube RSS・展示会/同人即売会・新作グッズ自動取得に直接接続。",
  },
  ko: {
    all: "전체 소스",
    official: "국내외 공식",
    events_fan: "행사 · 동인전",
    merch_goods: "국내외 굿즈",
    regions: { cn: "중국", global: "글로벌", jp: "일본", kr: "한국", tw: "대만·홍콩" },
    liveMatrixDesc: "중/영/일/한/번체 공식·미유사·HoYoLAB·YouTube RSS·행사 티켓·CPP 동인전 및 굿즈 신상 자동 수집에 직접 연결.",
  },
  en: {
    all: "All Sources",
    official: "Global Official",
    events_fan: "Expos & Fan Only",
    merch_goods: "Merch & Figures",
    regions: { cn: "China", global: "Global", jp: "Japan", kr: "Korea", tw: "TW/HK" },
    liveMatrixDesc: "Direct zero-pool feeds across CN/EN/JP/KR/TW official sites, Miyoushe, HoYoLAB, YouTube RSS, ticketing expos, CPP fan events & merch auto-discovery.",
  },
};

export const HubView: React.FC<HubViewProps> = ({
  news,
  bookmarks,
  readIds,
  syncedAt,
  isSyncing,
  onSync,
  onApplyNews,
  onOpenItem,
  onToggleBookmark,
  onNotify,
}) => {
  const { lang, t } = useI18n();
  const groupCopy = GROUP_COPY[lang];
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [groupFilter, setGroupFilter] = useState<"all" | CollectorSourceGroup>("all");

  const loadStatus = () => {
    fetch("/api/v1/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok) setStatus(d);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadStatus();
  }, [syncedAt]);

  const handleBatchEnrich = async () => {
    setIsEnriching(true);
    try {
      const res = await fetch("/api/ai/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 12 }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Batch enrich failed");
      }
      if (Array.isArray(json.officialItems) && json.officialItems.length > 0 && lang === "zh") {
        onApplyNews(buildUnifiedNewsList(json.officialItems as RawOfficialArticle[]));
      }
      loadStatus();
      onNotify(`AI +${json.enrichedCount} (cache hit: ${json.cacheHitCount})`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "LLM pool unavailable");
    } finally {
      setIsEnriching(false);
    }
  };

  const savedNews = news.filter((n) => bookmarks.has(n.id));
  const localizedSources = useMemo(
    () => COLLECTOR_SOURCES.map((s) => localizeSource(s, lang)),
    [lang]
  );
  const liveCount = useMemo(
    () => COLLECTOR_SOURCES.filter((s) => s.mode === "live").length,
    []
  );
  const filteredSources = useMemo(
    () =>
      groupFilter === "all"
        ? localizedSources
        : localizedSources.filter((s) => s.group === groupFilter),
    [localizedSources, groupFilter]
  );

  const copyText = async (txt: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      onNotify(msg);
    } catch {
      onNotify("Copy failed");
    }
  };

  const poolSnippet = `# 1. Configure server-only LLM / platform pool (ignored by git)
cp server/pool.example.json server/pool.json

# 2. Lightweight systemd service (~50MB RAM, ideal for Hangzhou ECS)
pnpm run build
sudo cp deploy/zzone.service.example /etc/systemd/system/zzone.service
sudo systemctl enable --now zzone

# 3. Auto HTTPS with Caddy
cp Caddyfile.example Caddyfile && caddy start`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <section>
        <div className="section-head">
          <div className="section-title-group">
            <h1 className="section-title">{t.hubTitle}</h1>
          </div>
          <button type="button" className="btn-primary" onClick={onSync} disabled={isSyncing}>
            <RefreshCw size={14} className={isSyncing ? "spin" : ""} />
            {isSyncing ? t.refreshingBtn : t.refresh5SourcesBtn}
          </button>
        </div>

        <div className="grid-3" style={{ marginBottom: 16 }}>
          <div className="panel">
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--text-3)" }}>
              <Database size={15} color="var(--sky)" /> {t.liveSourcesCardTitle}
            </div>
            <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: "var(--sky)", margin: "6px 0" }}>
              {liveCount} LIVE · {COLLECTOR_SOURCES.length} SOURCES
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{groupCopy.liveMatrixDesc}</div>
          </div>

          <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--text-3)" }}>
                <Cpu size={15} color="var(--gold-text)" /> {t.llmCardTitle}
              </span>
              {status?.llm?.enabled && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ height: 26, padding: "0 9px", fontSize: 11.5 }}
                  disabled={isEnriching}
                  onClick={handleBatchEnrich}
                >
                  {isEnriching ? t.llmEnrichingBtn : t.llmEnrichBtn}
                </button>
              )}
            </div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: status?.llm?.healthy ? "var(--gold-text)" : "var(--text-1)", margin: "4px 0" }}>
              {status?.llm?.enabled
                ? `${status.pool?.activeAccounts ?? 1} · ${status.llm.model || "LLM"}`
                : `${status?.pool?.activeAccounts ?? 0} Active`}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-2)" }}>
              {status?.llm?.enabled
                ? t.llmStatusDesc(
                    status.llm.cachedSummaries,
                    status.llm.callsToday,
                    status.llm.dailyLimit
                  )
                : t.llmNotConfigured}
            </div>
          </div>

          <div className="panel">
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--text-3)" }}>
              <Smartphone size={15} color="var(--brand-text)" /> {t.apiCardTitle}
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--brand-text)", margin: "8px 0" }}>
              REST · RSS · PWA
            </div>
            <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", flexWrap: "wrap", gap: "4px 6px", lineHeight: 1.55 }}>
              {["/api/v1/news", "/api/v1/events", "/api/v1/merch", "/api/v1/ingest", "/feed.xml"].map((ep) => (
                <code
                  key={ep}
                  style={{
                    padding: "1px 6px",
                    borderRadius: 6,
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {ep}
                </code>
              ))}
            </div>
          </div>
        </div>

        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 800 }}>
              <Rss size={16} color="var(--brand-text)" /> {t.sourceMatrixTitle} ({filteredSources.length})
            </div>
            <div className="chip-scroll">
              {(
                [
                  ["all", `${groupCopy.all} (${COLLECTOR_SOURCES.length})`],
                  ["official", `${groupCopy.official} (${COLLECTOR_SOURCES.filter((x) => x.group === "official").length})`],
                  ["events_fan", `${groupCopy.events_fan} (${COLLECTOR_SOURCES.filter((x) => x.group === "events_fan").length})`],
                  ["merch_goods", `${groupCopy.merch_goods} (${COLLECTOR_SOURCES.filter((x) => x.group === "merch_goods").length})`],
                ] as Array<["all" | CollectorSourceGroup, string]>
              ).map(([gk, label]) => (
                <button
                  key={gk}
                  type="button"
                  className={`chip ${groupFilter === gk ? "brand-active" : ""}`}
                  onClick={() => setGroupFilter(gk)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredSources.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: 11,
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 240, flex: 1 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 7 }}>
                    <SourceBadge platform={s.platform} />
                    <a href={s.url} target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 700 }}>
                      {s.name}
                    </a>
                    <span
                      className="mono"
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 5,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text-3)",
                      }}
                    >
                      {groupCopy.regions[s.region]}
                    </span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                      {s.handle}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>{s.desc}</div>
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 9px",
                    borderRadius: 6,
                    background:
                      s.mode === "live"
                        ? "var(--sky-soft)"
                        : s.mode === "pool-ready"
                        ? "var(--brand-soft)"
                        : "var(--surface)",
                    color:
                      s.mode === "live"
                        ? "var(--sky)"
                        : s.mode === "pool-ready"
                        ? "var(--brand-text)"
                        : "var(--text-2)",
                  }}
                >
                  {s.mode === "live" ? t.modeLive : s.mode === "pool-ready" ? t.modePool : t.modeRss}
                </span>
              </div>
            ))}
          </div>

          <div style={{ position: "relative" }}>
            <pre className="code-pre">{poolSnippet}</pre>
            <button
              type="button"
              className="btn-secondary"
              style={{ position: "absolute", top: 10, right: 10, height: 30, fontSize: 12 }}
              onClick={() => copyText(poolSnippet, t.actionCopy)}
            >
              <Copy size={12} /> {t.actionCopy}
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="section-head">
          <div className="section-title-group">
            <h2 className="section-title">{t.bookmarksTitle(savedNews.length)}</h2>
          </div>
        </div>

        {savedNews.length === 0 ? (
          <div className="panel" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-3)" }}>
            <Bookmark size={18} />
            <span>{t.noBookmarks}</span>
          </div>
        ) : (
          <div className="news-grid">
            {savedNews.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                isBookmarked={true}
                isRead={readIds.has(item.id)}
                onOpen={onOpenItem}
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
