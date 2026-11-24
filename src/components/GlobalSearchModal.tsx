import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarHeart,
  Copy,
  Flame,
  Newspaper,
  Search,
  ShoppingBag,
  Sparkles,
  Ticket,
  X,
} from "lucide-react";
import { REDEEM_CODES } from "../industry/codes";
import type { MerchItem, NewsItem, OfflineEvent } from "../industry/types";
import { formatSlashMD } from "../lib/time";

interface GlobalSearchModalProps {
  open: boolean;
  news: NewsItem[];
  events: OfflineEvent[];
  merch: MerchItem[];
  onClose: () => void;
  onSelectNews: (item: NewsItem) => void;
  onSelectEvent: (ev: OfflineEvent) => void;
  onSelectMerch: (item: MerchItem) => void;
  onCopyCode: (code: string) => void;
}

const HOT_KEYWORDS = [
  "3.4",
  "挽昼",
  "知更鸟",
  "杭州 FES",
  "ZLIVE",
  "雅迪联动",
  "浮波柚叶",
  "兑换码",
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  open,
  news,
  events,
  merch,
  onClose,
  onSelectNews,
  onSelectEvent,
  onSelectMerch,
  onCopyCode,
}) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 40);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        news: [] as NewsItem[],
        events: [] as OfflineEvent[],
        merch: [] as MerchItem[],
        codes: [] as typeof REDEEM_CODES,
      };
    }

    const tokens = q.split(/\s+/).filter(Boolean);
    const matches = (hay: string) => {
      const lower = hay.toLowerCase();
      return tokens.every((tk) => lower.includes(tk));
    };

    return {
      news: news
        .filter((n) =>
          matches(`${n.title} ${n.summary} ${n.tags.join(" ")} ${n.source}`)
        )
        .slice(0, 6),
      events: events
        .filter((e) =>
          matches(
            `${e.title} ${e.subtitle} ${e.city} ${e.venue} ${e.organizer} ${e.highlights.join(" ")}`
          )
        )
        .slice(0, 4),
      merch: merch
        .filter((m) =>
          matches(
            `${m.name} ${m.series} ${m.characterOrFaction} ${m.summary} ${m.channels.join(" ")}`
          )
        )
        .slice(0, 4),
      codes: REDEEM_CODES.filter((c) =>
        matches(`兑换码 菲林 ${c.code} ${c.rewards} ${c.note} ${c.region}`)
      ),
    };
  }, [query, news, events, merch]);

  if (!open) return null;

  const totalHits =
    results.news.length +
    results.events.length +
    results.merch.length +
    results.codes.length;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Zzone 全站聚合搜索"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-sheet search-modal-sheet">
        <div className="search-modal-head">
          <Search size={18} color="var(--brand-text)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索官方资讯、线下 FES/联动活动、米游铺周边、兑换码..."
            className="search-modal-input"
          />
          {query && (
            <button
              type="button"
              className="icon-btn"
              style={{ width: 28, height: 28 }}
              aria-label="清空搜索词"
              onClick={() => setQuery("")}
            >
              <X size={14} />
            </button>
          )}
          <span className="kbd-hint hide-sm">ESC</span>
          <button
            type="button"
            className="icon-btn"
            style={{ width: 32, height: 32 }}
            aria-label="关闭搜索弹窗"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: "18px 22px 24px", gap: 18 }}>
          {!query.trim() && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div className="search-group-title">
                  <Flame size={13} color="var(--brand-text)" />
                  近期热门关键词
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {HOT_KEYWORDS.map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      className="chip"
                      onClick={() => setQuery(kw)}
                    >
                      <Sparkles size={12} color="var(--brand-text)" />
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-3)",
                  paddingTop: 8,
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <span>支持多词空格组合检索（例如：杭州 FES、雅迪 周边）</span>
                <span className="mono">快捷键 ⌘K / Ctrl+K / /</span>
              </div>
            </div>
          )}

          {query.trim() && totalHits === 0 && (
            <div style={{ textAlign: "center", padding: "36px 12px", color: "var(--text-3)" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-2)" }}>
                没有找到与「{query}」直接相关的内容
              </div>
              <div style={{ fontSize: 12.5, marginTop: 6 }}>
                试试搜索：3.4、杭州 FES、ZLIVE、雅迪联动、浮波柚叶、兑换码
              </div>
            </div>
          )}

          {query.trim() && totalHits > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {results.events.length > 0 && (
                <div>
                  <div className="search-group-title">
                    <CalendarHeart size={13} color="var(--violet)" />
                    线下与联动活动 ({results.events.length})
                  </div>
                  <div className="search-result-list">
                    {results.events.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        className="search-result-row"
                        onClick={() => {
                          onClose();
                          onSelectEvent(ev);
                        }}
                      >
                        <img src={ev.coverUrl} alt={ev.title} className="search-row-thumb" />
                        <div className="search-row-main">
                          <strong>{ev.title}</strong>
                          <span className="search-row-sub">
                            {ev.city} · {ev.dateRange} · {ev.venue}
                          </span>
                        </div>
                        <span className="search-row-action">看多图 →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.merch.length > 0 && (
                <div>
                  <div className="search-group-title">
                    <ShoppingBag size={13} color="var(--brand-text)" />
                    官方周边与联名商品 ({results.merch.length})
                  </div>
                  <div className="search-result-list">
                    {results.merch.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="search-result-row"
                        onClick={() => {
                          onClose();
                          onSelectMerch(m);
                        }}
                      >
                        <img src={m.coverUrl} alt={m.name} className="search-row-thumb" />
                        <div className="search-row-main">
                          <strong>{m.name}</strong>
                          <span className="search-row-sub">
                            {m.series} · {m.priceText} · 共 {m.gallery.length} 张展示图
                          </span>
                        </div>
                        <span className="search-row-action">商品详情 →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.news.length > 0 && (
                <div>
                  <div className="search-group-title">
                    <Newspaper size={13} color="var(--sky)" />
                    官方与社区资讯 ({results.news.length})
                  </div>
                  <div className="search-result-list">
                    {results.news.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        className="search-result-row"
                        onClick={() => {
                          onClose();
                          onSelectNews(n);
                        }}
                      >
                        {n.coverUrl && (
                          <img src={n.coverUrl} alt={n.title} className="search-row-thumb" />
                        )}
                        <div className="search-row-main">
                          <strong>{n.title}</strong>
                          <span className="search-row-sub">
                            {n.source} · {formatSlashMD(n.publishedAt)}
                          </span>
                        </div>
                        <span className="search-row-action">阅读 →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.codes.length > 0 && (
                <div>
                  <div className="search-group-title">
                    <Ticket size={13} color="var(--brand-text)" />
                    可用兑换码 ({results.codes.length})
                  </div>
                  <div className="search-result-list">
                    {results.codes.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        className="search-result-row"
                        onClick={() => {
                          onCopyCode(c.code);
                          onClose();
                        }}
                      >
                        <div className="search-row-main">
                          <strong className="mono" style={{ color: "var(--brand-text)" }}>
                            {c.code}
                          </strong>
                          <span className="search-row-sub">
                            {c.rewards} · {c.region}
                          </span>
                        </div>
                        <span className="search-row-action">
                          <Copy size={12} /> 复制
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
