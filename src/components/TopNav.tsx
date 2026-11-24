import React from "react";
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
  onToggleTheme: (next: ThemeMode, ev: React.MouseEvent) => void;
}

const DESKTOP_TABS: NavTab[] = ["home", "feed", "events", "merch", "hub"];

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

  return (
    <header className="topbar">
      <div className="topbar-inner">
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

        <nav className="nav-pills" aria-label="Main Navigation">
          {DESKTOP_TABS.map((id) => (
            <button
              key={id}
              type="button"
              className={`nav-pill ${activeTab === id ? "active" : ""}`}
              onClick={() => onNavigate(id)}
            >
              <span>{t.nav[id]}</span>
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          {/* Compact 4-Language Switcher (ZH / JA / KO / EN) */}
          <label className="lang-select-wrap" title="Switch Language / 言語 / 언어">
            <Globe size={13} color="var(--text-2)" />
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

          <button
            type="button"
            className="codes-pill-btn"
            onClick={onOpenCodes}
            title={t.codesModalTitle}
          >
            <Ticket size={13} />
            <span>{t.codesBtn}</span>
            {activeCodeCount > 0 && <span className="mono codes-pill-count">{activeCodeCount}</span>}
          </button>

          <button
            type="button"
            className="sync-chip"
            onClick={onSync}
            disabled={isSyncing}
            title={t.refreshOfficialBtn}
          >
            <span className="live-dot" />
            <RefreshCw size={13} className={isSyncing ? "spin" : ""} />
            <span className="hide-sm">
              {isSyncing ? t.syncing : `${t.livePrefix} ${liveCount}`}
            </span>
          </button>

          <button
            type="button"
            className="icon-btn"
            aria-label={t.searchAria}
            title={t.searchTitle}
            onClick={onOpenSearch}
          >
            <Search size={16} />
          </button>

          <button
            type="button"
            className="icon-btn"
            aria-label={t.bookmarkTitle}
            title={t.bookmarkTitle}
            onClick={() => onNavigate("hub")}
          >
            <Bookmark size={16} />
            {bookmarkCount > 0 && <span className="icon-dot" />}
          </button>

          <button
            type="button"
            className="icon-btn"
            aria-label={theme === "dark" ? t.themeToLight : t.themeToDark}
            title={theme === "dark" ? t.themeToLight : t.themeToDark}
            onClick={(e) => onToggleTheme(theme === "dark" ? "light" : "dark", e)}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
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
