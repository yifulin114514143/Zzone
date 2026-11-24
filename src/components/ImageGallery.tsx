import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Expand,
  Images,
  Layers,
  X,
  ZoomIn,
} from "lucide-react";
import { useI18n } from "../lib/i18n";

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

interface ImageDim {
  w: number;
  h: number;
}

const SECTION_HEIGHT_PX = 620;

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, alt }) => {
  const { t } = useI18n();
  const list = images.filter(Boolean);
  const [idx, setIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [dims, setDims] = useState<Record<string, ImageDim>>({});
  const [visibleSections, setVisibleSections] = useState(1);
  const [expandAll, setExpandAll] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = useState(740);

  const active = list[idx % Math.max(1, list.length)] || "";

  useEffect(() => {
    setVisibleSections(1);
    setExpandAll(false);
  }, [active, idx]);

  useEffect(() => {
    const updateWidth = () => {
      if (stageRef.current) {
        setStageWidth(stageRef.current.clientWidth || 740);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  if (list.length === 0) return null;

  const currentDim = dims[active];
  const aspectRatio = currentDim && currentDim.w > 0 ? currentDim.h / currentDim.w : 0;
  // Treat tall posters / vertical product detail strips (H/W > 1.35) as long infographics
  const isLongImage = aspectRatio > 1.35;
  const renderedHeight = isLongImage ? Math.round(stageWidth * aspectRatio) : 0;
  const totalSections = isLongImage
    ? Math.max(1, Math.ceil(renderedHeight / SECTION_HEIGHT_PX))
    : 1;
  const needsSteppedExpand = isLongImage && totalSections > 1;
  const currentMaxHeight = !currentDim
    ? SECTION_HEIGHT_PX
    : !needsSteppedExpand || expandAll
    ? undefined
    : Math.min(renderedHeight, visibleSections * SECTION_HEIGHT_PX);
  const isFullyExpanded = !needsSteppedExpand || expandAll || visibleSections >= totalSections;

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIdx((i) => (i - 1 + list.length) % list.length);
  };
  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIdx((i) => (i + 1) % list.length);
  };

  const handleImageLoad = (src: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setDims((prevDims) => {
        const existing = prevDims[src];
        if (existing && existing.w === img.naturalWidth && existing.h === img.naturalHeight) {
          return prevDims;
        }
        return {
          ...prevDims,
          [src]: { w: img.naturalWidth, h: img.naturalHeight },
        };
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Top Toolbar: Switcher + Long-Image Section Indicator + Zoom */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="photo-count-pill">
            <Images size={12} /> {t.galleryIndex(idx + 1, list.length)}
          </span>
          {needsSteppedExpand && (
            <span
              className="mono"
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                padding: "3px 9px",
                borderRadius: 99,
                background: "var(--brand-soft)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Layers size={11} />
              {t.longImageProgress(
                expandAll ? totalSections : Math.min(visibleSections, totalSections),
                totalSections
              )}
            </span>
          )}
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {list.length > 1 && (
            <>
              <button
                type="button"
                className="btn-secondary"
                style={{ height: 30, padding: "0 10px", fontSize: 12 }}
                onClick={prev}
                aria-label={t.prevImg}
              >
                <ChevronLeft size={14} /> {t.prevImg}
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ height: 30, padding: "0 10px", fontSize: 12 }}
                onClick={next}
                aria-label={t.nextImg}
              >
                {t.nextImg} <ChevronRight size={14} />
              </button>
            </>
          )}
          <button
            type="button"
            className="btn-secondary"
            style={{ height: 30, padding: "0 10px", fontSize: 12 }}
            onClick={() => setZoomed(true)}
          >
            <ZoomIn size={13} /> {t.fullImageBtn}
          </button>
        </div>
      </div>

      {/* Thumbnails Strip placed above the stage so switching stays effortless even when a long image is expanded */}
      {list.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {list.map((src, i) => {
            const d = dims[src];
            const isTallThumb = d && d.w > 0 && d.h / d.w > 1.35;
            return (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={t.galleryIndex(i + 1, list.length)}
                style={{
                  position: "relative",
                  width: 96,
                  height: 58,
                  flexShrink: 0,
                  padding: 0,
                  borderRadius: 10,
                  overflow: "hidden",
                  border:
                    i === idx % list.length
                      ? "2px solid var(--brand)"
                      : "1px solid var(--border)",
                  opacity: i === idx % list.length ? 1 : 0.65,
                  background: "#0d0f16",
                  transition: "opacity 150ms, border-color 150ms",
                }}
              >
                <img
                  src={src}
                  alt={`${alt} #${i + 1}`}
                  onLoad={(e) => handleImageLoad(src, e)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "top center",
                  }}
                  loading="lazy"
                />
                {isTallThumb && (
                  <span
                    style={{
                      position: "absolute",
                      right: 4,
                      bottom: 4,
                      padding: "1px 5px",
                      borderRadius: 5,
                      background: "rgba(11, 12, 17, 0.86)",
                      color: "#fbcb62",
                      fontSize: 9.5,
                      fontWeight: 800,
                      lineHeight: 1.3,
                    }}
                  >
                    {t.longBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Image Stage: Always 100% Full-Width Crisp Rendering (NEVER squished into thin strip!) */}
      <div
        ref={stageRef}
        style={{
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid var(--border)",
          background: "#0d0f16",
          maxHeight: currentMaxHeight ? `${currentMaxHeight}px` : undefined,
          transition: "max-height 260ms ease",
        }}
      >
        <img
          key={active}
          src={active}
          alt={`${alt} - ${idx + 1}`}
          onLoad={(e) => handleImageLoad(active, e)}
          onClick={() => {
            if (!needsSteppedExpand || isFullyExpanded) {
              setZoomed(true);
            } else {
              setVisibleSections((v) => Math.min(totalSections, v + 1));
            }
          }}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            cursor: !needsSteppedExpand || isFullyExpanded ? "zoom-in" : "pointer",
            background: "#0d0f16",
          }}
        />

        {/* Soft bottom gradient fade + section-by-section expand actions */}
        {needsSteppedExpand && !isFullyExpanded && (
          <div
            style={{
              position: "absolute",
              inset: "auto 0 0 0",
              height: 112,
              background:
                "linear-gradient(180deg, rgba(13, 15, 22, 0) 0%, rgba(13, 15, 22, 0.92) 76%, rgba(13, 15, 22, 0.98) 100%)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              padding: "0 16px 14px",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn-primary"
              style={{ height: 36, fontSize: 12.5 }}
              onClick={() => setVisibleSections((v) => Math.min(totalSections, v + 1))}
            >
              <ChevronDown size={15} />
              {t.expandNextSection(Math.min(visibleSections + 1, totalSections), totalSections)}
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{
                height: 36,
                fontSize: 12.5,
                background: "rgba(23, 26, 36, 0.88)",
                color: "#f5f7fb",
                borderColor: "rgba(255, 255, 255, 0.22)",
              }}
              onClick={() => setExpandAll(true)}
            >
              <Expand size={13} /> {t.expandFullLongBtn}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Collapse / Next Section Bar after expanding */}
      {needsSteppedExpand && (visibleSections > 1 || expandAll) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "8px 12px",
            borderRadius: 12,
            background: "var(--bg-subtle)",
            border: "1px solid var(--border)",
            flexWrap: "wrap",
          }}
        >
          <span className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>
            {t.longCollapsedStatus(isFullyExpanded, visibleSections, totalSections)}
          </span>
          <div style={{ display: "inline-flex", gap: 8 }}>
            {!isFullyExpanded && (
              <button
                type="button"
                className="btn-primary"
                style={{ height: 30, padding: "0 12px", fontSize: 12 }}
                onClick={() => setVisibleSections((v) => Math.min(totalSections, v + 1))}
              >
                <ChevronDown size={13} /> {t.continueExpandBtn}
              </button>
            )}
            <button
              type="button"
              className="btn-secondary"
              style={{ height: 30, padding: "0 12px", fontSize: 12 }}
              onClick={() => {
                setExpandAll(false);
                setVisibleSections(1);
              }}
            >
              <ChevronUp size={13} /> {t.collapseToFirstBtn}
            </button>
          </div>
        </div>
      )}

      {/* Full-width Scrollable Lightbox for Official Long Infographics */}
      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.fullImageBtn}
          onClick={() => setZoomed(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 240,
            background: "rgba(6, 7, 12, 0.94)",
            backdropFilter: "blur(10px)",
            overflowY: "auto",
            padding: "56px 20px 48px",
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
                <button type="button" className="hero-arrow-btn" onClick={prev} aria-label={t.prevImg}>
                  <ChevronLeft size={18} />
                </button>
                <span className="photo-count-pill">
                  {idx + 1} / {list.length}
                </span>
                <button type="button" className="hero-arrow-btn" onClick={next} aria-label={t.nextImg}>
                  <ChevronRight size={18} />
                </button>
              </>
            )}
            <button
              type="button"
              className="hero-arrow-btn"
              onClick={() => setZoomed(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <img
            src={active}
            alt={`${alt} #${idx + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(920px, 94vw)",
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
