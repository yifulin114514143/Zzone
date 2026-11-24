import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Images,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import { MERCH_CAT_META } from "../industry/merch";
import { COLLECTOR_SOURCES } from "../industry/site";
import type {
  MerchItem,
  NavTab,
  NewsItem,
  OfflineEvent,
  SourcePlatformKey,
} from "../industry/types";
import { MERCH_CADENCE_LABELS, MERCH_CAT_LABELS, PLATFORM_LABELS, useI18n } from "../lib/i18n";
import {
  partitionAndSortEvents,
  partitionAndSortMerch,
  pickDiverseHomeNews,
  sortNewsByPriority,
} from "../lib/ranking";
import { formatSlashMD } from "../lib/time";
import { LiveCountdownGrid } from "../components/LiveCountdownGrid";
import { NewsCard } from "../components/NewsCard";
import { RedeemCodesStrip } from "../components/RedeemCodesBar";
import { SOURCE_PLATFORM_META, SourceBadge } from "../components/SourceIcon";

interface HomeViewProps {
  news: NewsItem[];
  events: OfflineEvent[];
  merch: MerchItem[];
  bookmarks: Set<string>;
  readIds: Set<string>;
  onOpenItem: (item: NewsItem) => void;
  onOpenEvent: (ev: OfflineEvent) => void;
  onOpenMerch: (item: MerchItem) => void;
  onCopyCode: (code: string) => void;
  onOpenCodes: () => void;
  onToggleBookmark: (id: string) => void;
  onNavigate: (tab: NavTab) => void;
}

interface HeroFeatureSlide {
  id: string;
  tag: string;
  source: SourcePlatformKey;
  dateLabel: string;
  title: string;
  summary: string;
  coverUrl: string;
  ctaLabel: string;
  onClick: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  news,
  events,
  merch,
  bookmarks,
  readIds,
  onOpenItem,
  onOpenEvent,
  onOpenMerch,
  onCopyCode,
  onOpenCodes,
  onToggleBookmark,
  onNavigate,
}) => {
  const { lang, t } = useI18n();
  const [slideIdx, setSlideIdx] = useState(0);
  const [dockCountdownMode, setDockCountdownMode] = useState<"fes" | "v34">("fes");

  const v34News =
    news.find((n) => n.id.includes("167400")) ??
    news.find((n) => /3\.4|长日终尽|ついには長き|긴 나날의 끝자락|Finality/i.test(n.title)) ??
    news[0];
  const hzFesEvent = events.find((e) => e.id === "ev-hz-fes-2026");
  const zliveEvent = events.find((e) => e.id === "ev-zlive-2026");

  const heroSlides = useMemo<HeroFeatureSlide[]>(() => {
    const slides: HeroFeatureSlide[] = [];

    if (v34News) {
      slides.push({
        id: "hero-v34",
        tag: t.heroV34Tag,
        source: lang === "ja" ? "zzz-jp" : "hoyoverse",
        dateLabel: t.heroV34Date,
        title: t.heroV34Title,
        summary: t.heroV34Summary,
        coverUrl:
          "https://upload-bbs.miyoushe.com/upload/2026/11/20/152039148/ddfd51de59193228f2908db0117219c8_5852735675604532366.png",
        ctaLabel: t.heroV34Cta,
        onClick: () => onOpenItem(v34News),
      });
    }

    if (hzFesEvent) {
      slides.push({
        id: "hero-fes",
        tag: t.heroFesTag,
        source: "zzz-cn",
        dateLabel: `${hzFesEvent.city} · ${hzFesEvent.dateRange}`,
        title: hzFesEvent.title,
        summary: hzFesEvent.subtitle,
        coverUrl: hzFesEvent.coverUrl,
        ctaLabel: t.heroFesCta,
        onClick: () => onOpenEvent(hzFesEvent),
      });
    }

    if (zliveEvent) {
      slides.push({
        id: "hero-zlive",
        tag: t.heroZliveTag,
        source: "bilibili",
        dateLabel: `${zliveEvent.city} · ${zliveEvent.dateRange}`,
        title: zliveEvent.title,
        summary: zliveEvent.subtitle,
        coverUrl: zliveEvent.coverUrl,
        ctaLabel: t.heroZliveCta,
        onClick: () => onOpenEvent(zliveEvent),
      });
    }

    return slides;
  }, [lang, t, v34News, hzFesEvent, zliveEvent, onOpenItem, onOpenEvent]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const activeSlide = heroSlides[slideIdx % Math.max(1, heroSlides.length)];

  const { active: sortedActiveEvents } = useMemo(
    () => partitionAndSortEvents(events),
    [events]
  );
  const upcomingEventsOnly = useMemo(
    () => sortedActiveEvents.slice(0, 4),
    [sortedActiveEvents]
  );
  const freshMerchOnly = useMemo(() => {
    // Strictly show pure official game merch on Discover (keep brand collabs cleanly separated on Merch -> Brand Collabs)
    const pureGameMerch = merch.filter((m) => m.merchLine !== "collab" && !m.mihoyogiftId);
    const { active: sorted } = partitionAndSortMerch(pureGameMerch);
    return sorted.slice(0, 3);
  }, [merch]);

  const prioritizedNews = useMemo(() => sortNewsByPriority(news), [news]);

  // Right-dock 3 headlines: diverse topics (no 3x identical Ver.3.4 lines)
  const dockFeedHeadlines = useMemo(
    () => pickDiverseHomeNews(prioritizedNews, [], 3),
    [prioritizedNews]
  );

  // Bottom 6 news cards: deduplicated across visual clusters AND never reusing Hero/Event/Merch cover art
  const latestNewsOnly = useMemo(() => {
    const usedCovers = [
      ...heroSlides.map((s) => s.coverUrl),
      ...upcomingEventsOnly.map((e) => e.coverUrl),
      ...freshMerchOnly.map((m) => m.coverUrl),
    ];
    return pickDiverseHomeNews(prioritizedNews, usedCovers, 6);
  }, [prioritizedNews, heroSlides, upcomingEventsOnly, freshMerchOnly]);

  const dockTarget =
    dockCountdownMode === "fes"
      ? {
          title: t.cdFesTitle,
          at: "2026-11-27T09:30:00+08:00",
          sub: t.cdFesSub,
          onClick: () => (hzFesEvent ? onOpenEvent(hzFesEvent) : onNavigate("events")),
        }
      : {
          title: t.cdV34Title,
          at: "2026-12-02T11:00:00+08:00",
          sub: t.cdV34Sub,
          onClick: () => v34News && onOpenItem(v34News),
        };

  return (
    <>
      <section className="hero-bento" aria-label="Featured Upcoming">
        {activeSlide && (
          <div className="hero-stage">
            <img
              key={activeSlide.id}
              src={activeSlide.coverUrl}
              alt={activeSlide.title}
              className="hero-bg-img"
            />
            <div className="hero-scrim" />

            <div className="hero-top-bar">
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="hero-tag-glass">{activeSlide.tag}</span>
                <SourceBadge platform={activeSlide.source} />
              </div>

              <div className="hero-arrows">
                <button
                  type="button"
                  className="hero-arrow-btn"
                  aria-label="Prev"
                  onClick={() =>
                    setSlideIdx((i) => (i - 1 + heroSlides.length) % heroSlides.length)
                  }
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="hero-arrow-btn"
                  aria-label="Next"
                  onClick={() => setSlideIdx((i) => (i + 1) % heroSlides.length)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="hero-content">
              <div className="mono" style={{ fontSize: 12, color: "rgba(255,255,255,0.78)" }}>
                {activeSlide.dateLabel}
              </div>

              <h1 className="hero-headline" onClick={activeSlide.onClick}>
                {activeSlide.title}
              </h1>

              <p className="hero-summary">{activeSlide.summary}</p>

              <div className="hero-footer">
                <button type="button" className="btn-primary" onClick={activeSlide.onClick}>
                  {activeSlide.ctaLabel} <ArrowRight size={15} />
                </button>

                <div className="hero-dots" role="tablist">
                  {heroSlides.map((sl, idx) => {
                    const isActive = idx === slideIdx % heroSlides.length;
                    return (
                      <button
                        key={sl.id}
                        type="button"
                        className={`hero-dot ${isActive ? "active" : ""}`}
                        onClick={() => setSlideIdx(idx)}
                        aria-label={sl.tag}
                      >
                        {isActive && <span key={`${sl.id}-${slideIdx}`} className="hero-dot-fill" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="hero-dock">
          <div className="dock-card highlight">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 800,
                  color: "var(--brand-text)",
                }}
              >
                <CalendarClock size={14} /> {t.dualCountdownTitle}
              </span>
              <div style={{ display: "inline-flex", gap: 4 }}>
                <button
                  type="button"
                  className={`chip ${dockCountdownMode === "fes" ? "brand-active" : ""}`}
                  style={{ padding: "3px 9px", fontSize: 11 }}
                  onClick={() => setDockCountdownMode("fes")}
                >
                  {t.cdTabFes}
                </button>
                <button
                  type="button"
                  className={`chip ${dockCountdownMode === "v34" ? "brand-active" : ""}`}
                  style={{ padding: "3px 9px", fontSize: 11 }}
                  onClick={() => setDockCountdownMode("v34")}
                >
                  {t.cdTabV34}
                </button>
              </div>
            </div>

            <div
              style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.35, cursor: "pointer" }}
              onClick={dockTarget.onClick}
            >
              {dockTarget.title}
            </div>

            <LiveCountdownGrid targetIso={dockTarget.at} />

            <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", justifyContent: "space-between" }}>
              <span>{dockTarget.sub}</span>
              <span className="mono">{formatSlashMD(dockTarget.at)}</span>
            </div>
          </div>

          <div className="dock-card" style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                <span className="live-dot-quiet" />
                {t.multiSourceTitle}
              </span>
              <button
                type="button"
                className="ghost-link"
                style={{ padding: "2px 8px", fontSize: 12 }}
                onClick={() => onNavigate("hub")}
              >
                {t.poolStatusLink}
              </button>
            </div>

            <div className="dock-source-line">
              {COLLECTOR_SOURCES.slice(0, 5)
                .map((src) => PLATFORM_LABELS[lang]?.[src.platform] || SOURCE_PLATFORM_META[src.platform]?.short)
                .join(" · ")}
            </div>

            <div className="mini-feed-list" style={{ marginTop: 2 }}>
              {dockFeedHeadlines.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="mini-feed-row"
                  onClick={() => onOpenItem(item)}
                >
                  <span className="mini-feed-time">{formatSlashMD(item.publishedAt)}</span>
                  <span className="mini-feed-title">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <RedeemCodesStrip onCopyCode={onCopyCode} onOpenModal={onOpenCodes} />

      <section aria-label={t.homeUpcomingTitle}>
        <div className="section-head">
          <div className="section-title-group">
            <h2 className="section-title">{t.homeUpcomingTitle}</h2>
          </div>
          <button type="button" className="ghost-link" onClick={() => onNavigate("events")}>
            {t.viewAllEvents} ({events.length}) <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid-2">
          {upcomingEventsOnly.map((ev) => (
            <article key={ev.id} className="event-card">
              <div
                className="merch-photo-wrap"
                style={{ aspectRatio: "16 / 9" }}
                onClick={() => onOpenEvent(ev)}
              >
                <img src={ev.coverUrl} alt={ev.title} loading="lazy" />
                <div className="merch-photo-scrim" />
                <div className="media-overlay-top">
                  <span className={ev.official ? "badge-official" : "badge-unofficial"}>
                    {ev.official ? <ShieldCheck size={11.5} /> : <Users size={11.5} />}
                    {ev.official ? t.officialMajorBadge : t.fanEventBadge}
                  </span>
                  {ev.gallery.length > 1 && (
                    <span className="photo-count-pill">
                      <Images size={11} /> {t.photosCount(ev.gallery.length)}
                    </span>
                  )}
                </div>
                <div className="merch-photo-bottom">
                  <span className="mono" style={{ fontSize: 11.5, color: "rgba(255,255,255,0.88)", fontWeight: 600 }}>
                    {ev.city} · {ev.dateRange}
                  </span>
                </div>
              </div>

              <div style={{ padding: "15px 18px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                <h3
                  style={{ margin: 0, fontSize: 16, fontWeight: 800, lineHeight: 1.38, cursor: "pointer" }}
                  onClick={() => onOpenEvent(ev)}
                >
                  {ev.title}
                </h3>
                <div style={{ fontSize: 12.5, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={12.5} color="var(--text-3)" />
                  {ev.venue}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-label={t.homeMerchTitle}>
        <div className="section-head">
          <div className="section-title-group">
            <h2 className="section-title">{t.homeMerchTitle}</h2>
          </div>
          <button type="button" className="ghost-link" onClick={() => onNavigate("merch")}>
            {t.enterMerchLink(merch.length)} <ArrowRight size={14} />
          </button>
        </div>

        <div className="merch-grid">
          {freshMerchOnly.map((item) => {
            const catMeta = MERCH_CAT_META[item.category];
            const pillLabel =
              item.cadence === "fes_drop" || item.cadence === "version_drop"
                ? MERCH_CADENCE_LABELS[lang][item.cadence]
                : MERCH_CAT_LABELS[lang][item.category];
            return (
              <article key={item.id} className="merch-card">
                <div className="merch-photo-wrap" onClick={() => onOpenMerch(item)}>
                  <img src={item.coverUrl} alt={item.name} loading="lazy" />
                  <div className="merch-photo-scrim" />
                  <div className="media-overlay-top">
                    <span className="cat-pill">
                      <span className="cat-dot" style={{ "--cc": catMeta.color } as React.CSSProperties} />
                      {pillLabel}
                    </span>
                    {item.gallery.length > 1 && (
                      <span className="photo-count-pill">
                        <Images size={11} /> {t.photosCount(item.gallery.length)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="merch-card-body">
                  <div className="merch-card-kicker">
                    <span className="merch-card-series">{item.characterOrFaction}</span>
                  </div>
                  <h3 style={{ margin: 0 }}>
                    <button
                      type="button"
                      className="news-title"
                      style={{ fontSize: 15 }}
                      onClick={() => onOpenMerch(item)}
                    >
                      {item.name}
                    </button>
                  </h3>
                  <div className="merch-card-foot">
                    <span className="merch-price" style={{ fontSize: 16.5 }}>
                      {item.priceText}
                    </span>
                    <button
                      type="button"
                      className="ghost-link"
                      style={{ fontSize: 12, padding: "2px 6px" }}
                      onClick={() => onOpenMerch(item)}
                    >
                      {t.viewMultiPhoto}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-label={t.homeNewsTitle}>
        <div className="section-head">
          <div className="section-title-group">
            <h2 className="section-title">{t.homeNewsTitle}</h2>
          </div>
          <button type="button" className="ghost-link" onClick={() => onNavigate("feed")}>
            {t.allNewsLink(news.length)} <ArrowRight size={14} />
          </button>
        </div>

        <div className="news-grid">
          {latestNewsOnly.map((item) => (
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
      </section>
    </>
  );
};
