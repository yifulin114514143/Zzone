import React from "react";
import { Bookmark, Images } from "lucide-react";
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
  const galleryCount = item.gallery?.length ?? 0;
  const hasRealFooterMeta = (cd && !cd.expired) || galleryCount > 1;

  return (
    <article className={`news-card ${isRead ? "read" : ""}`}>
      <div className="news-media" onClick={() => onOpen(item)}>
        {item.coverUrl ? (
          <img src={item.coverUrl} alt={item.title} loading="lazy" />
        ) : (
          <div
            className="news-media-fallback"
            style={{ "--fc-glow": hexAlpha(cat.color, 0.24) } as React.CSSProperties}
          >
            <div style={{ marginTop: "auto" }}>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>
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
            <Bookmark size={13.5} fill={isBookmarked ? "currentColor" : "none"} />
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

        {hasRealFooterMeta && (
          <div className="news-foot">
            {galleryCount > 1 ? (
              <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Images size={12} /> {t.photosCount(galleryCount)}
              </span>
            ) : (
              <span />
            )}

            {cd && !cd.expired && (
              <span className="deadline-tag">
                {item.deadlineLabel ? `${item.deadlineLabel} · ` : ""}
                {t.daysLeft(cd.days)}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
