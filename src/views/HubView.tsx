import React, { useEffect, useState } from "react";
import {
  Bookmark,
  Copy,
  Cpu,
  Database,
  RefreshCw,
  Rss,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { localizeSource } from "../industry/localizedData";
import { buildUnifiedNewsList, type RawOfficialArticle } from "../industry/news";
import { COLLECTOR_SOURCES } from "../industry/site";
import type { NewsItem } from "../industry/types";
import { useI18n } from "../lib/i18n";
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
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);

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
      onNotify(
        `AI +${json.enrichedCount} (cache hit: ${json.cacheHitCount})`
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "LLM pool unavailable");
    } finally {
      setIsEnriching(false);
    }
  };

  const savedNews = news.filter((n) => bookmarks.has(n.id));
  const localizedSources = COLLECTOR_SOURCES.map((s) => localizeSource(s, lang));

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

# 2. Lightweight systemd service (~45MB RAM, ideal for 1.7G VPS)
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
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: "var(--sky)", margin: "6px 0" }}>
              5 LIVE · 4 LANG
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{t.liveSourcesCardDesc}</div>
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
                  <Sparkles size={11} color="var(--brand-text)" />
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 800 }}>
            <Rss size={16} color="var(--brand-text)" /> {t.sourceMatrixTitle}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {localizedSources.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
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
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <SourceBadge platform={s.platform} />
                    <a href={s.url} target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 700 }}>
                      {s.name}
                    </a>
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
                    padding: "4px 10px",
                    borderRadius: 99,
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
