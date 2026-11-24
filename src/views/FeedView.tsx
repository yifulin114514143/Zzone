import React, { useMemo, useRef, useState } from "react";
import { ArrowDownWideNarrow, Flame, RefreshCw, Search, X } from "lucide-react";
import { CATEGORY_META } from "../industry/site";
import type { NewsCategory, NewsItem, SourcePlatformKey } from "../industry/types";
import { NewsCard } from "../components/NewsCard";

interface FeedViewProps {
  news: NewsItem[];
  bookmarks: Set<string>;
  readIds: Set<string>;
  isSyncing: boolean;
  onSync: () => void;
  onOpenItem: (item: NewsItem) => void;
  onToggleBookmark: (id: string) => void;
}

const CATS: Array<NewsCategory | "all"> = [
  "all",
  "collab",
  "banner",
  "event",
  "agent",
  "patch",
  "guide",
  "code",
  "media",
];

const SOURCE_OPTIONS: Array<{ id: SourcePlatformKey | "all"; label: string }> = [
  { id: "all", label: "全部来源平台" },
  { id: "zzz-cn", label: "绝区零国服官网" },
  { id: "hoyoverse", label: "HoYoverse 国际官网" },
  { id: "x", label: "X / Twitter 官方" },
  { id: "bilibili", label: "Bilibili" },
  { id: "miyoushe", label: "米游社" },
];

export const FeedView: React.FC<FeedViewProps> = ({
  news,
  bookmarks,
  readIds,
  isSyncing,
  onSync,
  onOpenItem,
  onToggleBookmark,
}) => {
  const [cat, setCat] = useState<NewsCategory | "all">("all");
  const [platform, setPlatform] = useState<SourcePlatformKey | "all">("all");
  const [onlyOfficial, setOnlyOfficial] = useState(false);
  const [sortBy, setSortBy] = useState<"latest" | "heat">("latest");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = news.filter((item) => {
      if (cat !== "all" && item.category !== cat) return false;
      if (platform !== "all" && item.sourcePlatform !== platform) return false;
      if (onlyOfficial && item.sourceTier !== "official") return false;
      if (q) {
        const hay = `${item.title} ${item.summary} ${item.tags.join(" ")} ${item.source}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === "heat") {
      return [...list].sort((a, b) => b.heat - a.heat);
    }
    return [...list].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }, [news, cat, platform, onlyOfficial, query, sortBy]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="section-head" style={{ marginBottom: 0 }}>
        <div className="section-title-group">
          <span className="section-kicker">MULTI-SOURCE LIVE FEED</span>
          <h1 className="section-title">全网实时资讯聚合</h1>
        </div>
        <button type="button" className="btn-primary" onClick={onSync} disabled={isSyncing}>
          <RefreshCw size={14} className={isSyncing ? "spin" : ""} />
          {isSyncing ? "正在拉取官网..." : "刷新最新官网资讯"}
        </button>
      </div>

      <div className="panel" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="toolbar-row">
          <div className="search-input-wrap" style={{ flex: 1, maxWidth: 420 }}>
            <Search size={15} color="var(--text-3)" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="过滤版本、活动、代理人或关键词..."
            />
            {query && (
              <button
                type="button"
                aria-label="清空资讯过滤词"
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
              aria-label="按来源平台筛选"
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
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={`chip ${onlyOfficial ? "active" : ""}`}
              onClick={() => setOnlyOfficial((v) => !v)}
            >
              仅看官方直连
            </button>

            <div className="sort-pill-group" role="group" aria-label="排序方式">
              <button
                type="button"
                className={`sort-pill-btn ${sortBy === "latest" ? "active" : ""}`}
                onClick={() => setSortBy("latest")}
              >
                <ArrowDownWideNarrow size={12} /> 最新
              </button>
              <button
                type="button"
                className={`sort-pill-btn ${sortBy === "heat" ? "active" : ""}`}
                onClick={() => setSortBy("heat")}
              >
                <Flame size={12} /> 热度
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
              {c === "all" ? "全部频道" : CATEGORY_META[c].label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: 48, color: "var(--text-3)" }}>
          没有找到匹配当前条件的资讯，试试清空关键词或切换来源平台。
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
