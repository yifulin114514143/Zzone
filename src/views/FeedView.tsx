import React, { useMemo, useRef, useState } from "react";
import { ArrowDownWideNarrow, RefreshCw, Search, X } from "lucide-react";
import type { NewsCategory, NewsItem, SourcePlatformKey } from "../industry/types";
import { CAT_LABELS, PLATFORM_LABELS, useI18n } from "../lib/i18n";
import { sortNewsByPriority } from "../lib/ranking";
import { NewsCard } from "../components/NewsCard";
import { RedeemCodesStrip } from "../components/RedeemCodesBar";
import { SOURCE_PLATFORM_META } from "../components/SourceIcon";

interface FeedViewProps {
  news: NewsItem[];
  bookmarks: Set<string>;
  readIds: Set<string>;
  isSyncing: boolean;
  onSync: () => void;
  onOpenItem: (item: NewsItem) => void;
  onCopyCode: (code: string) => void;
  onOpenCodes: () => void;
  onToggleBookmark: (id: string) => void;
}

const CATS: Array<NewsCategory | "all"> = [
  "all",
  "collab",
  "patch",
  "event",
  "banner",
  "agent",
  "media",
];

const SOURCE_KEYS: Array<SourcePlatformKey | "all"> = [
  "all",
  "zzz-cn",
  "hoyoverse",
  "miyoushe",
  "hoyolab",
  "zzz-jp",
  "x",
  "bilibili",
];

export const FeedView: React.FC<FeedViewProps> = ({
  news,
  bookmarks,
  readIds,
  isSyncing,
  onSync,
  onOpenItem,
  onCopyCode,
  onOpenCodes,
  onToggleBookmark,
}) => {
  const { lang, t } = useI18n();
  const [cat, setCat] = useState<NewsCategory | "all">("all");
  const [platform, setPlatform] = useState<SourcePlatformKey | "all">("all");
  const [sortBy, setSortBy] = useState<"priority" | "latest">("priority");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = news.filter((item) => {
      if (cat !== "all" && item.category !== cat) return false;
      if (platform !== "all" && item.sourcePlatform !== platform) return false;
      if (q) {
        const hay = `${item.title} ${item.summary} ${item.tags.join(" ")} ${item.source}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === "priority") {
      return sortNewsByPriority(list);
    }
    return [...list].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }, [news, cat, platform, query, sortBy]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="section-head" style={{ marginBottom: 0 }}>
        <div className="section-title-group">
          <h1 className="section-title">{t.feedTitle}</h1>
        </div>
        <button type="button" className="btn-primary" onClick={onSync} disabled={isSyncing}>
          <RefreshCw size={14} className={isSyncing ? "spin" : ""} />
          {isSyncing ? t.refreshingBtn : t.refreshOfficialBtn}
        </button>
      </div>

      <RedeemCodesStrip onCopyCode={onCopyCode} onOpenModal={onOpenCodes} />

      <div className="panel" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="toolbar-row">
          <div className="search-input-wrap" style={{ flex: 1, maxWidth: 420 }}>
            <Search size={15} color="var(--text-3)" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.feedPlaceholder}
            />
            {query && (
              <button
                type="button"
                aria-label="Clear"
                onClick={() => setQuery("")}
                style={{ background: "none", border: "none", padding: 2 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as SourcePlatformKey | "all")}
              aria-label={t.allSourcesOpt}
              style={{
                height: 36,
                padding: "0 12px",
                borderRadius: 99,
                border: "1px solid var(--border)",
                background: "var(--bg-subtle)",
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              {SOURCE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key === "all"
                    ? t.allSourcesOpt
                    : PLATFORM_LABELS[lang]?.[key] || SOURCE_PLATFORM_META[key]?.name || key}
                </option>
              ))}
            </select>

            <div className="sort-pill-group" role="group">
              <button
                type="button"
                className={`sort-pill-btn ${sortBy === "priority" ? "active" : ""}`}
                onClick={() => setSortBy("priority")}
              >
                {t.sortPriority}
              </button>
              <button
                type="button"
                className={`sort-pill-btn ${sortBy === "latest" ? "active" : ""}`}
                onClick={() => setSortBy("latest")}
              >
                <ArrowDownWideNarrow size={12} /> {t.sortLatest}
              </button>
            </div>

            <span className="mono" style={{ fontSize: 12, color: "var(--text-3)", paddingLeft: 4 }}>
              {filtered.length} / {news.length}
            </span>
          </div>
        </div>

        <div className="chip-scroll">
          {CATS.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${cat === c ? "active" : ""}`}
              onClick={() => setCat(c)}
            >
              {c === "all" ? t.allChannels : CAT_LABELS[lang][c]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: 48, color: "var(--text-3)" }}>
          {t.noMatchingNews}
        </div>
      ) : (
        <div className="news-grid">
          {filtered.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              isBookmarked={bookmarks.has(item.id)}
              isRead={readIds.has(item.id)}
              onOpen={onOpenItem}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
};
