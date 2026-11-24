import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Images, X, ZoomIn } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, alt }) => {
  const list = images.filter(Boolean);
  const [idx, setIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  if (list.length === 0) return null;
  const active = list[idx % list.length];

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIdx((i) => (i - 1 + list.length) % list.length);
  };
  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIdx((i) => (i + 1) % list.length);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid var(--border)",
          background: "#0d0f16",
          aspectRatio: "16 / 9",
          cursor: "zoom-in",
        }}
        onClick={() => setZoomed(true)}
      >
        <img
          key={active}
          src={active}
          alt={`${alt} - 展示图 ${idx + 1}`}
          style={{ width: "100%", height: "100%", objectFit: "contain", background: "#0d0f16" }}
        />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoomed(true);
          }}
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            padding: "4px 10px",
            borderRadius: 99,
            background: "rgba(11, 12, 17, 0.78)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "#ffffff",
            fontSize: 11.5,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <ZoomIn size={12} /> 放大看长图 / 原图
        </button>

        <span
          className="mono"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            padding: "4px 10px",
            borderRadius: 99,
            background: "rgba(11, 12, 17, 0.78)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "#ffffff",
            fontSize: 11.5,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Images size={12} /> {idx + 1} / {list.length}
        </span>

        {list.length > 1 && (
          <>
            <button
              type="button"
              className="hero-arrow-btn"
              onClick={prev}
              aria-label="上一张展示图"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="hero-arrow-btn"
              onClick={next}
              aria-label="下一张展示图"
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {list.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`切换到第 ${i + 1} 张图`}
              style={{
                width: 96,
                height: 60,
                flexShrink: 0,
                padding: 0,
                borderRadius: 10,
                overflow: "hidden",
                border:
                  i === idx % list.length
                    ? "2px solid var(--brand)"
                    : "1px solid var(--border)",
                opacity: i === idx % list.length ? 1 : 0.62,
                background: "#0d0f16",
                transition: "opacity 150ms, border-color 150ms",
              }}
            >
              <img
                src={src}
                alt={`${alt} 缩略图 ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Full-width Scrollable Lightbox for Official Long Infographics */}
      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="原图高清预览"
          onClick={() => setZoomed(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 240,
            background: "rgba(6, 7, 12, 0.92)",
            backdropFilter: "blur(10px)",
            overflowY: "auto",
            padding: "56px 20px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "fixed",
              top: 14,
              right: 18,
              display: "flex",
              alignItems: "center",
              gap: 8,
              zIndex: 250,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {list.length > 1 && (
              <>
                <button type="button" className="hero-arrow-btn" onClick={prev} aria-label="上一张原图">
                  <ChevronLeft size={18} />
                </button>
                <span className="photo-count-pill">
                  {idx + 1} / {list.length}
                </span>
                <button type="button" className="hero-arrow-btn" onClick={next} aria-label="下一张原图">
                  <ChevronRight size={18} />
                </button>
              </>
            )}
            <button
              type="button"
              className="hero-arrow-btn"
              onClick={() => setZoomed(false)}
              aria-label="关闭原图预览"
            >
              <X size={18} />
            </button>
          </div>

          <img
            src={active}
            alt={`${alt} 高清原图 ${idx + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(900px, 94vw)",
              height: "auto",
              borderRadius: 12,
              boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
            }}
          />
        </div>
      )}
    </div>
  );
};
