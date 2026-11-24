import React, { useEffect, useRef, useState } from "react";
import { Bookmark, ExternalLink, Share2, Sparkles, Type, X } from "lucide-react";
import { CATEGORY_META } from "../industry/site";
import type { NewsItem } from "../industry/types";
import { formatHM, formatSlashMD } from "../lib/time";
import { ImageGallery } from "./ImageGallery";
import { SourceBadge } from "./SourceIcon";

interface ArticleModalProps {
  item: NewsItem | null;
  isBookmarked: boolean;
  onClose: () => void;
  onToggleBookmark: (id: string) => void;
  onNotify: (msg: string) => void;
}

function highlightKeyTerms(text: string): React.ReactNode {
  const rx =
    /(202\d\/\d{1,2}\/\d{1,2}(?:\s+\d{2}:\d{2})?|\d+月\d+日|\d+菲林底片|菲林[×x*]\d+|\d+菲林|加密母带[×x*]\d+|邦布券[×x*]\d+|知更鸟|挽昼|卡芙卡|赛维里安|杭州 FES|ZLIVE)/g;
  return text.split(rx).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="hl-chip">
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  item,
  isBookmarked,
  onClose,
  onToggleBookmark,
  onNotify,
}) => {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [largeFont, setLargeFont] = useState(false);

  useEffect(() => {
    if (!item) return;
    setProgress(0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  const cat = CATEGORY_META[item.category];
  const galleryImages =
    item.gallery && item.gallery.length > 0
      ? item.gallery
      : item.coverUrl
      ? [item.coverUrl]
      : [];

  const handleScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 100);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`【Zzone 绝区零资讯】${item.title} ${item.originalUrl}`);
      onNotify("已复制标题与原文链接");
    } catch {
      onNotify("复制失败，请手动复制");
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-sheet">
        <div className="modal-progress">
          <div className="modal-progress-bar" style={{ width: `${Math.max(5, progress)}%` }} />
        </div>

        <div className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span className="faction-pill">
              <span className="faction-dot" style={{ "--fc": cat.color } as React.CSSProperties} />
              {cat.label}
            </span>
            <span
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--text-3)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.source} · {formatSlashMD(item.publishedAt)} {formatHM(item.publishedAt)}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              className={`icon-btn ${largeFont ? "active-icon-btn" : ""}`}
              onClick={() => setLargeFont((v) => !v)}
              aria-label="切换阅读字号"
              title={largeFont ? "切换回标准字号" : "切换大字号阅读"}
            >
              <Type size={15} />
            </button>
            <button
              type="button"
              className={`icon-btn ${isBookmarked ? "active-icon-btn" : ""}`}
              onClick={() => onToggleBookmark(item.id)}
              aria-label={isBookmarked ? "取消收藏" : "收藏"}
              title={isBookmarked ? "取消收藏" : "收藏"}
            >
              <Bookmark size={15} fill={isBookmarked ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={handleShare}
              aria-label="分享"
              title="复制分享链接"
            >
              <Share2 size={15} />
            </button>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭文章详情">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body" ref={bodyRef} onScroll={handleScroll}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <SourceBadge platform={item.sourcePlatform} />
            {item.tags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 11.5,
                  color: "var(--text-2)",
                  background: "var(--bg-subtle)",
                  padding: "3px 9px",
                  borderRadius: 99,
                }}
              >
                #{t}
              </span>
            ))}
          </div>

          <h2 style={{ margin: 0, fontSize: largeFont ? 28 : 25, fontWeight: 900, lineHeight: 1.32 }}>
            {item.title}
          </h2>

          {galleryImages.length > 1 ? (
            <ImageGallery images={galleryImages} alt={item.title} />
          ) : (
            item.coverUrl && <img src={item.coverUrl} alt={item.title} className="modal-cover" />
          )}

          {item.takeaways.length > 0 && (
            <div className="takeaway-box">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                <Sparkles size={14} color="var(--brand-text)" />
                核心要点速览
              </div>
              <ul>
                {item.takeaways.map((t, i) => (
                  <li key={i} style={{ fontSize: largeFont ? 15 : 13.5, color: "var(--text-2)" }}>
                    {highlightKeyTerms(t)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            style={{
              fontSize: largeFont ? 17 : 15,
              lineHeight: largeFont ? 1.95 : 1.85,
              color: "var(--text-2)",
              whiteSpace: "pre-line",
            }}
          >
            {highlightKeyTerms(item.body)}
          </div>

          <div
            style={{
              marginTop: 8,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>
              来源：{item.source} · 全网关联 {item.sourceCount} 处信源
            </span>
            <a
              href={item.originalUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              查看官方原文 <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
