import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Bookmark,
  CalendarHeart,
  Compass,
  Globe,
  Moon,
  Newspaper,
  Radio,
  RefreshCw,
  Search,
  ShoppingBag,
  Sun,
  Ticket,
} from "lucide-react";
import type { NavTab } from "../industry/types";
import { LANG_OPTIONS, useI18n, type AppLang } from "../lib/i18n";
import type { ThemeMode } from "../lib/storage";

interface TopNavProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  bookmarkCount: number;
  activeCodeCount: number;
  liveCount: number;
  isSyncing: boolean;
  onSync: () => void;
  onOpenSearch: () => void;
  onOpenCodes: () => void;
  theme: ThemeMode;
  onToggleTheme: (next: ThemeMode, ev: React.MouseEvent<HTMLButtonElement>) => void;
}

const DESKTOP_TABS: Array<{ id: NavTab; icon: React.ReactNode }> = [
  { id: "home", icon: <Compass size={13.5} /> },
  { id: "feed", icon: <Newspaper size={13.5} /> },
  { id: "events", icon: <CalendarHeart size={13.5} /> },
  { id: "merch", icon: <ShoppingBag size={13.5} /> },
  { id: "hub", icon: <Radio size={13.5} /> },
];

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onNavigate,
  bookmarkCount,
  activeCodeCount,
  liveCount,
  isSyncing,
  onSync,
  onOpenSearch,
  onOpenCodes,
  theme,
  onToggleTheme,
}) => {
  const { lang, setLang, t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  // Magnetic sliding pill indicator measurement
  const navRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Partial<Record<NavTab, HTMLButtonElement | null>>>({});
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const measureIndicator = useCallback(() => {
    const navEl = navRef.current;
    const btnEl = tabRefs.current[activeTab];
    if (!navEl || !btnEl) return;
    setPillStyle({
      left: btnEl.offsetLeft,
      width: btnEl.offsetWidth,
      ready: true,
    });
  }, [activeTab]);

  useLayoutEffect(() => {
    measureIndicator();
    const raf = window.requestAnimationFrame(measureIndicator);
    return () => window.cancelAnimationFrame(raf);
  }, [measureIndicator, lang]);

  useEffect(() => {
    const navEl = navRef.current;
    if (!navEl) return;
    const ro = new ResizeObserver(() => measureIndicator());
    ro.observe(navEl);
    window.addEventListener("resize", measureIndicator);
    document.fonts?.ready?.then(() => measureIndicator());
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureIndicator);
    };
  }, [measureIndicator]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(maxScroll > 40 ? Math.min(100, Math.max(0, (y / maxScroll) * 100)) : 0);
    };
    onScroll();
    const raf = window.requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [activeTab]);

  return (
    <header className={`topbar ${scrolled ? "is-scrolled" : ""}`}>
      <div className="topbar-shell">
        <div className="topbar-inner">
          {/* Brand Emblem with Subtle On-Air Signal Equalizer */}
          <button
            type="button"
            className="brand-btn"
            onClick={() => onNavigate("home")}
            aria-label="Zzone Home"
          >
            <span className="anby-app-icon">
              <img src="/anby-icon.jpg" alt="Zzone Anby Icon" />
              <span className="anby-corner-dot" aria-hidden="true">
                Z
              </span>
            </span>
            <span className="brand-wordmark">
              <span className="brand-title">
                <span className="brand-z">Z</span>
                <span>zone</span>
                <span className="brand-tag">{t.brandTag}</span>
              </span>
              <span className="brand-sub">{t.brandSub}</span>
            </span>
          </button>

          {/* Center Magnetic Sliding Navigation Rail */}
          <nav ref={navRef} className="nav-pills" aria-label="Main Navigation">
            {pillStyle.ready && (
              <span
                className="nav-sliding-indicator"
                aria-hidden="true"
                style={{
                  transform: `translateX(${pillStyle.left}px)`,
                  width: `${pillStyle.width}px`,
                }}
              />
            )}
            {DESKTOP_TABS.map(({ id, icon }) => (
              <button
                key={id}
                ref={(el) => {
                  tabRefs.current[id] = el;
                }}
                type="button"
                className={`nav-pill ${activeTab === id ? "active" : ""}`}
                onClick={() => onNavigate(id)}
              >
                <span className="nav-pill-icon" aria-hidden="true">
                  {icon}
                </span>
                <span>{t.nav[id]}</span>
              </button>
            ))}
          </nav>

          {/* Right Refined Command Bar: Spotlight Search + Codes + Unified Utility Capsule */}
          <div className="topbar-actions">
            <button
              type="button"
              className="cmd-search-btn"
              aria-label={t.searchAria}
              title={t.searchTitle}
              onClick={onOpenSearch}
            >
              <Search size={14} />
              <kbd className="cmd-kbd">⌘K</kbd>
            </button>

            <button
              type="button"
              className="codes-pill-btn"
              onClick={onOpenCodes}
              title={t.codesModalTitle}
            >
              <Ticket size={13} />
              <span className="hide-sm">{t.codesBtn}</span>
              {activeCodeCount > 0 && (
                <span className="mono codes-pill-count">{activeCodeCount}</span>
              )}
            </button>

            <div className="topbar-utility-group">
              <button
                type="button"
                className="utility-sync-btn"
                onClick={onSync}
                disabled={isSyncing}
                title={t.refreshOfficialBtn}
              >
                <span className="live-dot-quiet" />
                <RefreshCw size={12} className={isSyncing ? "spin" : ""} />
                <span className="hide-sm mono">
                  {isSyncing ? t.syncing : `${t.livePrefix} ${liveCount}`}
                </span>
              </button>

              <span className="utility-divider" aria-hidden="true" />

              <label className="lang-select-wrap" title="Switch Language / 言語 / 언어">
                <Globe size={13} className="lang-globe-icon" />
                <select
                  value={lang}
                  aria-label="Language Selector"
                  onChange={(e) => setLang(e.target.value as AppLang)}
                  className="lang-select"
                >
                  {LANG_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.short}
                    </option>
                  ))}
                </select>
              </label>

              <span className="utility-divider hide-xs" aria-hidden="true" />

              <button
                type="button"
                className="utility-icon-btn hide-xs"
                aria-label={t.bookmarkTitle}
                title={t.bookmarkTitle}
                onClick={() => onNavigate("hub")}
              >
                <Bookmark size={14.5} />
                {bookmarkCount > 0 && <span className="icon-dot" />}
              </button>

              <span className="utility-divider" aria-hidden="true" />

              <button
                type="button"
                className={`utility-icon-btn theme-toggle-btn ${theme === "dark" ? "is-dark" : "is-light"}`}
                aria-label={theme === "dark" ? t.themeToLight : t.themeToDark}
                title={theme === "dark" ? t.themeToLight : t.themeToDark}
                onClick={(e) => onToggleTheme(theme === "dark" ? "light" : "dark", e)}
              >
                <span className="theme-icon-layer theme-icon-sun" aria-hidden="true">
                  <Sun size={14.5} />
                </span>
                <span className="theme-icon-layer theme-icon-moon" aria-hidden="true">
                  <Moon size={14.5} />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Ultra-fine Reading Scroll Progress Glow Beam */}
        <div className="topbar-progress-track" aria-hidden="true">
          <div className="topbar-progress-fill" style={{ width: `${scrollPct}%` }} />
        </div>
      </div>
    </header>
  );
};

export const MobileDock: React.FC<{
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
}> = ({ activeTab, onNavigate }) => {
  const { t } = useI18n();
  const items: Array<{ id: NavTab; icon: React.ReactNode }> = [
    { id: "home", icon: <Compass size={19} /> },
    { id: "feed", icon: <Newspaper size={19} /> },
    { id: "events", icon: <CalendarHeart size={19} /> },
    { id: "merch", icon: <ShoppingBag size={19} /> },
    { id: "hub", icon: <Radio size={19} /> },
  ];

  return (
    <nav className="mobile-dock" aria-label="Mobile Navigation">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className={`mobile-dock-btn ${activeTab === it.id ? "active" : ""}`}
          onClick={() => onNavigate(it.id)}
        >
          {it.icon}
          <span>{t.nav[it.id]}</span>
        </button>
      ))}
    </nav>
  );
};
