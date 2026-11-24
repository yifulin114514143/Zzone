import React from "react";
import {
  Bookmark,
  CalendarHeart,
  Compass,
  Moon,
  Newspaper,
  Radio,
  RefreshCw,
  Search,
  ShoppingBag,
  Sun,
} from "lucide-react";
import type { NavTab } from "../industry/types";
import type { ThemeMode } from "../lib/storage";

interface TopNavProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  bookmarkCount: number;
  liveCount: number;
  isSyncing: boolean;
  onSync: () => void;
  onOpenSearch: () => void;
  theme: ThemeMode;
  onToggleTheme: (next: ThemeMode, ev: React.MouseEvent) => void;
}

const DESKTOP_TABS: Array<{ id: NavTab; label: string }> = [
  { id: "home", label: "发现" },
  { id: "feed", label: "资讯" },
  { id: "events", label: "活动" },
  { id: "merch", label: "周边" },
  { id: "hub", label: "信源" },
];

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onNavigate,
  bookmarkCount,
  liveCount,
  isSyncing,
  onSync,
  onOpenSearch,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* Bespoke Zzone v1 Brand Lockup + Official Anby Mascot App Icon */}
        <button
          type="button"
          className="brand-btn"
          onClick={() => onNavigate("home")}
          aria-label="Zzone 首页"
        >
          <span className="anby-app-icon">
            <img src="/anby-icon.jpg" alt="Zzone 安比看板娘图标" />
            <span className="anby-corner-dot" aria-hidden="true">
              Z
            </span>
          </span>
          <span className="brand-wordmark">
            <span className="brand-title">
              <span className="brand-z">Z</span>
              <span>zone</span>
              <span className="brand-tag">绝区零 v1</span>
            </span>
            <span className="brand-sub">资讯 · 活动 · 周边聚合</span>
          </span>
        </button>

        <nav className="nav-pills" aria-label="主导航">
          {DESKTOP_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`nav-pill ${activeTab === t.id ? "active" : ""}`}
              onClick={() => onNavigate(t.id)}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          <button
            type="button"
            className="sync-chip"
            onClick={onSync}
            disabled={isSyncing}
            title="实时同步国服 + HoYoverse 国际官网最新资讯"
          >
            <span className="live-dot" />
            <RefreshCw size={13} className={isSyncing ? "spin" : ""} />
            <span className="hide-sm">
              {isSyncing ? "同步中..." : `实时 · ${liveCount}`}
            </span>
          </button>

          <button
            type="button"
            className="icon-btn"
            aria-label="全站聚合搜索"
            title="全站聚合搜索 (⌘K / /)"
            onClick={onOpenSearch}
          >
            <Search size={16} />
          </button>

          <button
            type="button"
            className="icon-btn"
            aria-label="信源、兑换码与收藏"
            title="多平台信源、号池与本地收藏"
            onClick={() => onNavigate("hub")}
          >
            <Bookmark size={16} />
            {bookmarkCount > 0 && <span className="icon-dot" />}
          </button>

          <button
            type="button"
            className="icon-btn"
            aria-label="切换深浅模式"
            title={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
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
  const items: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: "home", label: "发现", icon: <Compass size={19} /> },
    { id: "feed", label: "资讯", icon: <Newspaper size={19} /> },
    { id: "events", label: "活动", icon: <CalendarHeart size={19} /> },
    { id: "merch", label: "周边", icon: <ShoppingBag size={19} /> },
    { id: "hub", label: "信源", icon: <Radio size={19} /> },
  ];

  return (
    <nav className="mobile-dock" aria-label="移动端底部导航">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className={`mobile-dock-btn ${activeTab === it.id ? "active" : ""}`}
          onClick={() => onNavigate(it.id)}
        >
          {it.icon}
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
};
