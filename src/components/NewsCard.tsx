import React from "react";
import { Bookmark, Flame } from "lucide-react";
import { CATEGORY_META } from "../industry/site";
import type { NewsItem } from "../industry/types";
import { hexAlpha } from "../lib/color";
import { CAT_LABELS, useI18n } from "../lib/i18n";
import { formatSlashMD, getCountdown } from "../lib/time";
import { SourceBadge } from "./SourceIcon";

interface NewsCardProps {
  item: NewsItem;
  isBookmarked: boolean;
  isRead: boolean;
  onOpen: (item: NewsItem) => void;
  onToggleBookmark: (id: string) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  item,
  isBookmarked,
  isRead,
  onOpen,
  onToggleBookmark,
}) => {
  const { lang, t } = useI18n();
  const cat = CATEGORY_META[item.category];
  const catLabel = CAT_LABELS[lang][item.category] || cat.label;
  const cd = item.deadlineAt ? getCountdown(item.deadlineAt) : null;

  return (
    <article className={`news-card ${isRead ? "read" : ""}`}>
      <div className="news-media" onClick={() => onOpen(item)}>
        {item.coverUrl ? (
          <img src={item.coverUrl} alt={item.title} loading="lazy" />
        ) : (
          <div
            className="news-media-fallback"
            style={{ "--fc-glow": hexAlpha(cat.color, 0.34) } as React.CSSProperties}
          >
            <div style={{ marginTop: "auto" }}>
              <div className="mono" style={{ fontSize: 10.5, opacity: 0.62, marginBottom: 4 }}>
                ZZONE · {cat.stamp}
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>
                {catLabel}
              </div>
              <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>{item.source}</div>
            </div>
          </div>
        )}

        <div className="media-overlay-top">
          <span className="cat-pill">
            <span className="cat-dot" style={{ "--cc": cat.color } as React.CSSProperties} />
            {catLabel}
          </span>
          <button
            type="button"
            className={`card-bookmark ${isBookmarked ? "saved" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(item.id);
            }}
            aria-label={isBookmarked ? t.toastUnbookmarked : t.toastBookmarked}
          >
            <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <div className="news-body">
        <div className="news-meta">
          <SourceBadge platform={item.sourcePlatform} />
          <span className="mono" style={{ marginLeft: "auto", flexShrink: 0 }}>
            {formatSlashMD(item.publishedAt)}
          </span>
        </div>

        <h3 style={{ margin: 0 }}>
          <button type="button" className="news-title" onClick={() => onOpen(item)}>
            {item.title}
          </button>
        </h3>

        <p className="news-excerpt">{item.summary}</p>

        <div className="news-foot">
          <span className="heat-pill">
            <Flame size={13} />
            {item.heat} {t.heatLabel}
          </span>

          {cd && !cd.expired ? (
            <span className="deadline-tag">{t.daysLeft(cd.days)}</span>
          ) : (
            <span className="mono">{t.sourcesMentioned(item.sourceCount)}</span>
          )}
        </div>
      </div>
    </article>
  );
};
