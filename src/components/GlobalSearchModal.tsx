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
import { localizeCode } from "../industry/localizedData";
import type { MerchItem, NewsItem, OfflineEvent } from "../industry/types";
import { useI18n } from "../lib/i18n";
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
  const { lang, t } = useI18n();
  const [query, setQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<{
    query: string;
    lang: string;
    answer: string;
    model?: string;
    fromCache?: boolean;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setAiError(null);
  }, [query, lang]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 40);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const localizedCodes = useMemo(
    () => REDEEM_CODES.map((c) => localizeCode(c, lang)),
    [lang]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        news: [] as NewsItem[],
        events: [] as OfflineEvent[],
        merch: [] as MerchItem[],
        codes: [] as typeof localizedCodes,
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
        .slice(0, 6),
      codes: localizedCodes.filter((c) =>
        matches(`兑换码 交換コード 리딤코드 code codes polychrome 菲林 ${c.code} ${c.rewards} ${c.note} ${c.regionLabel}`)
      ),
    };
  }, [query, news, events, merch, localizedCodes]);

  if (!open) return null;

  const totalHits =
    results.news.length +
    results.events.length +
    results.merch.length +
    results.codes.length;

  const handleAskAiSummary = async () => {
    const q = query.trim();
    if (!q || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const items = [
        ...results.events.map((e) => ({
          kind: t.groupEvents,
          title: e.title,
          meta: `${e.city} · ${e.dateRange} · ${e.venue}`,
          excerpt: e.subtitle,
        })),
        ...results.merch.map((m) => ({
          kind: t.groupMerch,
          title: m.name,
          meta: `${m.priceText} · ${m.releaseDate}`,
          excerpt: m.summary,
        })),
        ...results.news.map((n) => ({
          kind: t.groupNews,
          title: n.title,
          meta: `${n.source} · ${formatSlashMD(n.publishedAt)}`,
          excerpt: n.summary,
        })),
      ];
      const res = await fetch("/api/ai/search-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, lang, items }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "AI summary failed");
      }
      setAiSummary({
        query: q,
        lang,
        answer: json.answer,
        model: json.model,
        fromCache: json.fromCache,
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "LLM unavailable");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={t.searchAria}
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
            placeholder={t.searchPlaceholder}
            className="search-modal-input"
          />
          {query && (
            <button
              type="button"
              className="icon-btn"
              style={{ width: 28, height: 28 }}
              aria-label="Clear"
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
            aria-label="Close"
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
                  {t.hotKeywordsTitle}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {t.hotKeywords.map((kw) => (
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
                <span>{t.searchTip}</span>
                <span className="mono">⌘K / Ctrl+K / /</span>
              </div>
            </div>
          )}

          {query.trim() && totalHits === 0 && (
            <div style={{ textAlign: "center", padding: "36px 12px", color: "var(--text-3)" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-2)" }}>
                {t.noSearchHits(query)}
              </div>
              <div style={{ fontSize: 12.5, marginTop: 6 }}>{t.searchTryHint}</div>
            </div>
          )}

          {query.trim() && totalHits > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--brand-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 800, color: "var(--brand-text)" }}>
                    <Sparkles size={13} />
                    {t.aiBriefTitle}
                  </span>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ height: 30, padding: "0 12px", fontSize: 12 }}
                    disabled={aiLoading}
                    onClick={handleAskAiSummary}
                  >
                    {aiLoading ? t.aiBriefLoading : t.aiBriefBtn}
                  </button>
                </div>
                {aiError && <div style={{ fontSize: 12, color: "var(--rose)" }}>{aiError}</div>}
                {aiSummary && aiSummary.query === query.trim() && aiSummary.lang === lang && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ fontSize: 13.5, color: "var(--text-1)", lineHeight: 1.65 }}>
                      {aiSummary.answer}
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                      {t.aiModelPrefix}
                      {aiSummary.model || "cn:deepseek-v4.1-flash"}
                      {aiSummary.fromCache ? t.aiCacheHitTag : t.aiLiveTag}
                    </div>
                  </div>
                )}
              </div>

              {results.events.length > 0 && (
                <div>
                  <div className="search-group-title">
                    <CalendarHeart size={13} color="var(--violet)" />
                    {t.groupEvents} ({results.events.length})
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
                        <span className="search-row-action">{t.actionPhotos}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.merch.length > 0 && (
                <div>
                  <div className="search-group-title">
                    <ShoppingBag size={13} color="var(--brand-text)" />
                    {t.groupMerch} ({results.merch.length})
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
                            {m.merchLine === "collab"
                              ? lang === "zh"
                                ? "品牌联动"
                                : lang === "ja"
                                ? "コラボ"
                                : lang === "ko"
                                ? "콜라보"
                                : "Collab"
                              : lang === "zh"
                              ? "游戏周边"
                              : lang === "ja"
                              ? "公式グッズ"
                              : lang === "ko"
                              ? "공식 굿즈"
                              : "Game Merch"}
                            {" · "}
                            {m.series} · {m.priceText}
                            {m.gallery.length > 1 ? ` · ${t.photosCount(m.gallery.length)}` : ""}
                          </span>
                        </div>
                        <span className="search-row-action">{t.actionDetail}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.news.length > 0 && (
                <div>
                  <div className="search-group-title">
                    <Newspaper size={13} color="var(--sky)" />
                    {t.groupNews} ({results.news.length})
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
                        <span className="search-row-action">{t.actionRead}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.codes.length > 0 && (
                <div>
                  <div className="search-group-title">
                    <Ticket size={13} color="var(--brand-text)" />
                    {t.groupCodes} ({results.codes.length})
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
                            {c.rewards} · {c.regionLabel}
                          </span>
                        </div>
                        <span className="search-row-action">
                          <Copy size={12} /> {t.actionCopy}
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
