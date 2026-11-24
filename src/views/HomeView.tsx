import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Images,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { MERCH_CADENCE_META } from "../industry/merch";
import { COLLECTOR_SOURCES } from "../industry/site";
import type {
  MerchItem,
  NavTab,
  NewsItem,
  OfflineEvent,
  SourcePlatformKey,
} from "../industry/types";
import { formatSlashMD } from "../lib/time";
import { LiveCountdownGrid } from "../components/LiveCountdownGrid";
import { NewsCard } from "../components/NewsCard";
import { SourceBadge } from "../components/SourceIcon";

interface HomeViewProps {
  news: NewsItem[];
  events: OfflineEvent[];
  merch: MerchItem[];
  bookmarks: Set<string>;
  readIds: Set<string>;
  onOpenItem: (item: NewsItem) => void;
  onOpenEvent: (ev: OfflineEvent) => void;
  onOpenMerch: (item: MerchItem) => void;
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
  onToggleBookmark,
  onNavigate,
}) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [dockCountdownMode, setDockCountdownMode] = useState<"fes" | "v34">("fes");

  const v34News = news.find((n) => n.id === "official-167400") ?? news[0];
  const hzFesEvent = events.find((e) => e.id === "ev-hz-fes-2026");
  const zliveEvent = events.find((e) => e.id === "ev-zlive-2026");
  const hsrCollabEvent = events.find((e) => e.id === "ev-v34-hsr-collab");

  const heroSlides = useMemo<HeroFeatureSlide[]>(() => {
    const slides: HeroFeatureSlide[] = [];

    if (v34News) {
      slides.push({
        id: "hero-v34",
        tag: "即将上线 · 3.4 新版本",
        source: "hoyoverse",
        dateLabel: "2026/12/02 正式更新",
        title: "3.4 新版本「长日终尽」：首位结使虚狩「挽昼」登场，星铁联动「知更鸟」登录即领",
        summary:
          "12月2日重磅上线！登录免费领联动 S 级限定「知更鸟」及推荐主属性定制驱动盘，累计签到再领 10 加密母带 + 10 邦布券 + 2320 菲林 + 全新免费邦布「帕姆」。",
        coverUrl:
          "https://fastcdn.hoyoverse.com/content-v2/nap/167400/29b97129ab47b08d41f7e79b03e0db31_1702952051770016417.jpg",
        ctaLabel: "查看 3.4 福利与前瞻总览",
        onClick: () => onOpenItem(v34News),
      });
    }

    if (hzFesEvent) {
      slides.push({
        id: "hero-fes",
        tag: "即将开馆 · 年度盛会 FES",
        source: "zzz-cn",
        dateLabel: `${hzFesEvent.city} · ${hzFesEvent.dateRange}`,
        title: hzFesEvent.title,
        summary: hzFesEvent.subtitle,
        coverUrl: hzFesEvent.coverUrl,
        ctaLabel: "查看杭州 FES 6 张官方情报图",
        onClick: () => onOpenEvent(hzFesEvent),
      });
    }

    if (zliveEvent) {
      slides.push({
        id: "hero-zlive",
        tag: "即将开唱 · Zenless LIVE 2026",
        source: "bilibili",
        dateLabel: `${zliveEvent.city} · ${zliveEvent.dateRange}`,
        title: zliveEvent.title,
        summary: zliveEvent.subtitle,
        coverUrl: zliveEvent.coverUrl,
        ctaLabel: "查看 ZLIVE 演出与购票详情",
        onClick: () => onOpenEvent(zliveEvent),
      });
    }

    if (hsrCollabEvent) {
      slides.push({
        id: "hero-collab",
        tag: "最新跨界联动 · 即将开启",
        source: "x",
        dateLabel: `${hsrCollabEvent.city} · ${hsrCollabEvent.dateRange}`,
        title: hsrCollabEvent.title,
        summary: hsrCollabEvent.subtitle,
        coverUrl: hsrCollabEvent.coverUrl,
        ctaLabel: "查看最新联动与限定周边",
        onClick: () => onOpenEvent(hsrCollabEvent),
      });
    }

    return slides;
  }, [v34News, hzFesEvent, zliveEvent, hsrCollabEvent, onOpenItem, onOpenEvent]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const t = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(t);
  }, [heroSlides.length]);

  const activeSlide = heroSlides[slideIdx % Math.max(1, heroSlides.length)];

  // Strictly ONLY upcoming / open events on Home (no archived past events)
  const upcomingEventsOnly = useMemo(
    () => events.filter((e) => e.status !== "archive").slice(0, 4),
    [events]
  );

  // Strictly freshest / upcoming merch drops with full real multi-image galleries
  const freshMerchOnly = useMemo(
    () =>
      merch
        .filter(
          (m) =>
            m.saleStatus === "coming_soon" ||
            m.cadence === "fes_drop" ||
            m.cadence === "version_drop" ||
            m.id === "merch-yadea-ebikes"
        )
        .slice(0, 3),
    [merch]
  );

  const latestNewsOnly = useMemo(() => news.slice(0, 6), [news]);

  const dockTarget =
    dockCountdownMode === "fes"
      ? {
          title: "2026 杭州 FES「布梦嘉年华」& ZLIVE 专场",
          at: "2026-11-27T09:30:00+08:00",
          sub: "杭州大会展中心 4/5/6号馆",
          onClick: () => (hzFesEvent ? onOpenEvent(hzFesEvent) : onNavigate("events")),
        }
      : {
          title: "3.4「长日终尽」正式上线 · 登录送知更鸟",
          at: "2026-12-02T11:00:00+08:00",
          sub: "首位结使虚狩「挽昼」+ 2320菲林 + 10连",
          onClick: () => v34News && onOpenItem(v34News),
        };

  return (
    <>
      {/* 1. Hero Bento: Upcoming Blockbusters + Dual Milestone Countdown & Multi-Source Feed */}
      <section className="hero-bento" aria-label="即将到来重磅聚焦">
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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="hero-tag-glass">
                  <Sparkles size={13} color="#ff8c38" />
                  {activeSlide.tag}
                </span>
                <SourceBadge platform={activeSlide.source} />
              </div>

              <div className="hero-arrows">
                <button
                  type="button"
                  className="hero-arrow-btn"
                  aria-label="上一条重磅"
                  onClick={() =>
                    setSlideIdx((i) => (i - 1 + heroSlides.length) % heroSlides.length)
                  }
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  type="button"
                  className="hero-arrow-btn"
                  aria-label="下一条重磅"
                  onClick={() => setSlideIdx((i) => (i + 1) % heroSlides.length)}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>

            <div className="hero-content">
              <div className="mono" style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
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

                <div className="hero-dots" role="tablist" aria-label="切换重磅聚焦">
                  {heroSlides.map((sl, idx) => (
                    <button
                      key={sl.id}
                      type="button"
                      className={`hero-dot ${idx === slideIdx % heroSlides.length ? "active" : ""}`}
                      onClick={() => setSlideIdx(idx)}
                      aria-label={`切换到 ${sl.tag}`}
                    />
                  ))}
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
                <CalendarClock size={14} /> 两大重磅倒计时
              </span>
              <div style={{ display: "inline-flex", gap: 4 }}>
                <button
                  type="button"
                  className={`chip ${dockCountdownMode === "fes" ? "brand-active" : ""}`}
                  style={{ padding: "3px 9px", fontSize: 11 }}
                  onClick={() => setDockCountdownMode("fes")}
                >
                  杭州 FES
                </button>
                <button
                  type="button"
                  className={`chip ${dockCountdownMode === "v34" ? "brand-active" : ""}`}
                  style={{ padding: "3px 9px", fontSize: 11 }}
                  onClick={() => setDockCountdownMode("v34")}
                >
                  3.4 新版本
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
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 800 }}>
                <span className="live-dot" />
                官方多信源实时汇总
              </span>
              <button
                type="button"
                className="ghost-link"
                style={{ padding: "2px 8px", fontSize: 12 }}
                onClick={() => onNavigate("hub")}
              >
                号池状态 →
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {COLLECTOR_SOURCES.slice(0, 6).map((src) => (
                <a
                  key={src.id}
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  title={`${src.name} (${src.handle})`}
                >
                  <SourceBadge platform={src.platform} />
                </a>
              ))}
            </div>

            <div className="mini-feed-list" style={{ marginTop: 2 }}>
              {news.slice(0, 3).map((item) => (
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

      {/* 2. Upcoming Only: Annual FES / ZLIVE / Latest Collabs */}
      <section aria-label="即将到来的大型活动与最新联动">
        <div className="section-head">
          <div className="section-title-group">
            <span className="section-kicker">UPCOMING ONLY · FES · ZLIVE · LATEST COLLABS</span>
            <h2 className="section-title">即将到来：年度 FES、ZLIVE 与最新联动</h2>
          </div>
          <button type="button" className="ghost-link" onClick={() => onNavigate("events")}>
            查看全部活动 ({events.length}) <ArrowRight size={15} />
          </button>
        </div>

        <div className="grid-2">
          {upcomingEventsOnly.map((ev) => (
            <article key={ev.id} className="event-card">
              <div
                className="merch-photo-wrap"
                style={{ aspectRatio: "16 / 8.6" }}
                onClick={() => onOpenEvent(ev)}
              >
                <img src={ev.coverUrl} alt={ev.title} loading="lazy" />
                <div className="merch-photo-scrim" />
                <div className="media-overlay-top">
                  <span className={ev.official ? "badge-official" : "badge-unofficial"}>
                    {ev.official ? <ShieldCheck size={12} /> : <Users size={12} />}
                    {ev.official ? "官方重磅" : "同人活动"}
                  </span>
                  <span className="badge-status">
                    {ev.city} · {ev.dateRange}
                  </span>
                </div>
                <div className="merch-photo-bottom">
                  <SourceBadge platform={ev.sourcePlatform} />
                  {ev.gallery.length > 1 && (
                    <span className="photo-count-pill">
                      <Images size={11} /> {ev.gallery.length} 张官方情报图
                    </span>
                  )}
                </div>
              </div>

              <div style={{ padding: "15px 18px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                <h3
                  style={{ margin: 0, fontSize: 16.5, fontWeight: 800, lineHeight: 1.36, cursor: "pointer" }}
                  onClick={() => onOpenEvent(ev)}
                >
                  {ev.title}
                </h3>
                <div style={{ fontSize: 12.5, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={13} color="var(--brand-text)" />
                  {ev.venue}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. Fresh Official & Collab Merch Drops */}
      <section aria-label="最新官方与联名周边">
        <div className="section-head">
          <div className="section-title-group">
            <span className="section-kicker">LATEST MERCH & COLLAB GEAR</span>
            <h2 className="section-title">最新周边上新与跨界联名</h2>
          </div>
          <button type="button" className="ghost-link" onClick={() => onNavigate("merch")}>
            进入周边上新 ({merch.length} 款) <ArrowRight size={15} />
          </button>
        </div>

        <div className="merch-grid">
          {freshMerchOnly.map((item) => (
            <article key={item.id} className="merch-card">
              <div className="merch-photo-wrap" onClick={() => onOpenMerch(item)}>
                <img src={item.coverUrl} alt={item.name} loading="lazy" />
                <div className="merch-photo-scrim" />
                <div className="media-overlay-top">
                  <span
                    className={`cadence-pill ${MERCH_CADENCE_META[item.cadence].cssClass}`}
                    style={{ background: "rgba(11,12,17,0.78)", color: "#fff" }}
                  >
                    {MERCH_CADENCE_META[item.cadence].label}
                  </span>
                  <span className="photo-count-pill">
                    <Images size={11} /> {item.gallery.length} 张详图
                  </span>
                </div>
              </div>

              <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {item.sourcePlatforms.slice(0, 2).map((sp) => (
                    <SourceBadge key={sp} platform={sp} />
                  ))}
                </div>
                <h3
                  style={{ margin: 0, fontSize: 15.5, fontWeight: 800, lineHeight: 1.38, cursor: "pointer" }}
                  onClick={() => onOpenMerch(item)}
                >
                  {item.name}
                </h3>
                <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 6 }}>
                  <span className="merch-price" style={{ fontSize: 17 }}>
                    {item.priceText}
                  </span>
                  <button
                    type="button"
                    className="ghost-link"
                    style={{ fontSize: 12, padding: "2px 6px" }}
                    onClick={() => onOpenMerch(item)}
                  >
                    看多图详情 →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. Latest Important News */}
      <section aria-label="最新官方与社区资讯">
        <div className="section-head">
          <div className="section-title-group">
            <span className="section-kicker">FRESH OFFICIAL UPDATES</span>
            <h2 className="section-title">最新重要公告与版本动态</h2>
          </div>
          <button type="button" className="ghost-link" onClick={() => onNavigate("feed")}>
            全部 {news.length} 条资讯 <ArrowRight size={15} />
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
