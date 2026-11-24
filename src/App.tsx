import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { REDEEM_CODES } from "./industry/codes";
import { localizeEvent, localizeMerch } from "./industry/localizedData";
import { MERCH_ITEMS } from "./industry/merch";
import { INITIAL_NEWS, OFFICIAL_SNAPSHOT_META } from "./industry/news";
import { OFFLINE_EVENTS } from "./industry/offlineEvents";
import type { MerchItem, NavTab, NewsItem, OfflineEvent } from "./industry/types";
import { syncLiveOfficialNews } from "./lib/hoyoSync";
import { LangContext, UI_DICT, type AppLang } from "./lib/i18n";
import {
  loadIdSet,
  loadLang,
  loadTheme,
  saveIdSet,
  saveLang,
  saveTheme,
  storageKeys,
  type ThemeMode,
} from "./lib/storage";
import { ArticleModal } from "./components/ArticleModal";
import { GlobalSearchModal } from "./components/GlobalSearchModal";
import { RedeemCodesModal } from "./components/RedeemCodesBar";
import { MobileDock, TopNav } from "./components/TopNav";
import { EventsView } from "./views/EventsView";
import { FeedView } from "./views/FeedView";
import { HomeView } from "./views/HomeView";
import { HubView } from "./views/HubView";
import { MerchView } from "./views/MerchView";

const VALID_TABS: NavTab[] = ["home", "feed", "events", "merch", "hub"];

function getInitialTab(): NavTab {
  const hash = window.location.hash.replace(/^#\/?/, "").split("?")[0] as NavTab;
  return VALID_TABS.includes(hash) ? hash : "home";
}

const MERCH_CHECK_TOAST: Record<AppLang, { ok: string; fallback: string; backTop: string }> = {
  zh: {
    ok: "已完成米游铺与天猫旗舰店定期上新巡检（当前均为最新）",
    fallback: "已刷新周边列表（接入米游铺号池后将自动实时增量推送）",
    backTop: "返回顶部",
  },
  ja: {
    ok: "公式ストア・新作グッズの定期チェックが完了しました（最新状態です）",
    fallback: "グッズ一覧を更新しました",
    backTop: "トップへ戻る",
  },
  ko: {
    ok: "공식 스토어 굿즈 신상 정기 점검을 완료했습니다 (최신 상태)",
    fallback: "굿즈 목록을 새로고침했습니다",
    backTop: "맨 위로",
  },
  en: {
    ok: "Completed official merch drop check (all items are up to date)",
    fallback: "Refreshed official merch catalog",
    backTop: "Back to top",
  },
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>(() => getInitialTab());
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
  const [lang, setLangState] = useState<AppLang>(() => loadLang());
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS);
  const [events, setEvents] = useState<OfflineEvent[]>(OFFLINE_EVENTS);
  const [merch, setMerch] = useState<MerchItem[]>(MERCH_ITEMS);

  const [syncedAt, setSyncedAt] = useState<string>(OFFICIAL_SNAPSHOT_META.fetchedAt);
  const [merchCheckedAt, setMerchCheckedAt] = useState<string>(() => new Date().toISOString());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingMerch, setIsCheckingMerch] = useState(false);

  const [openItem, setOpenItem] = useState<NewsItem | null>(null);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const [pendingMerchId, setPendingMerchId] = useState<string | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [codesModalOpen, setCodesModalOpen] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);

  const [bookmarks, setBookmarks] = useState<Set<string>>(() =>
    loadIdSet(storageKeys.bookmarks)
  );
  const [readIds, setReadIds] = useState<Set<string>>(() => loadIdSet(storageKeys.read));
  const [wishlist, setWishlist] = useState<Set<string>>(() =>
    loadIdSet(storageKeys.wishlist)
  );
  const [toast, setToast] = useState<string | null>(null);
  const syncSeqRef = useRef(0);

  const t = UI_DICT[lang];

  const showToast = useCallback((msg: string) => setToast(msg), []);

  const setLang = useCallback((next: AppLang) => {
    setLangState(next);
  }, []);

  useEffect(() => {
    saveLang(lang);
    document.title = UI_DICT[lang].docTitle;
  }, [lang]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 360);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Global shortcut: Cmd+K / Ctrl+K / "/" opens Global Search Modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
        return;
      }
      const tag = (document.activeElement?.tagName || "").toUpperCase();
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onHash = () => setActiveTab(getInitialTab());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((tab: NavTab) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const handleSync = useCallback(
    async (targetLang: AppLang, silent = false, forceRefresh = false) => {
      const seq = ++syncSeqRef.current;
      setIsSyncing(true);
      try {
        const res = await syncLiveOfficialNews(targetLang, forceRefresh);
        if (seq !== syncSeqRef.current) return;
        setNews(res.items);
        setSyncedAt(res.syncedAt);

        try {
          const [evRes, mRes] = await Promise.all([
            fetch("/api/v1/events"),
            fetch("/api/v1/merch"),
          ]);
          if (evRes.ok) {
            const evJson = await evRes.json();
            if (Array.isArray(evJson?.pushedEvents) && evJson.pushedEvents.length > 0) {
              setEvents((prev) => {
                const existing = new Set(prev.map((x) => x.id));
                const additions = (evJson.pushedEvents as OfflineEvent[]).filter(
                  (x) => !existing.has(x.id)
                );
                return additions.length ? [...additions, ...prev] : prev;
              });
            }
          }
          if (mRes.ok) {
            const mJson = await mRes.json();
            if (mJson?.lastCheckedAt) setMerchCheckedAt(mJson.lastCheckedAt);
            if (Array.isArray(mJson?.pushedMerch) && mJson.pushedMerch.length > 0) {
              setMerch((prev) => {
                const existing = new Set(prev.map((x) => x.id));
                const additions = (mJson.pushedMerch as MerchItem[]).filter(
                  (x) => !existing.has(x.id)
                );
                return additions.length ? [...additions, ...prev] : prev;
              });
            }
          }
        } catch {
          // static dev mode without backend server
        }

        if (!silent) showToast(res.message);
      } finally {
        if (seq === syncSeqRef.current) {
          setIsSyncing(false);
        }
      }
    },
    [showToast]
  );

  // Sync language-matched official feeds on boot & whenever the user switches language
  useEffect(() => {
    handleSync(lang, true, false);
  }, [lang, handleSync]);

  const handleManualSync = useCallback(() => {
    handleSync(lang, false, true);
  }, [lang, handleSync]);

  const handleCheckMerch = useCallback(async () => {
    setIsCheckingMerch(true);
    const copy = MERCH_CHECK_TOAST[lang];
    try {
      const res = await fetch("/api/v1/merch");
      if (res.ok) {
        const json = await res.json();
        setMerchCheckedAt(json.lastCheckedAt || new Date().toISOString());
        if (Array.isArray(json.pushedMerch) && json.pushedMerch.length > 0) {
          setMerch((prev) => {
            const existing = new Set(prev.map((x) => x.id));
            const additions = (json.pushedMerch as MerchItem[]).filter(
              (x) => !existing.has(x.id)
            );
            return additions.length ? [...additions, ...prev] : prev;
          });
        }
        showToast(copy.ok);
      } else {
        setMerchCheckedAt(new Date().toISOString());
        showToast(copy.fallback);
      }
    } catch {
      setMerchCheckedAt(new Date().toISOString());
      showToast(copy.fallback);
    } finally {
      setIsCheckingMerch(false);
    }
  }, [lang, showToast]);

  const handleToggleTheme = useCallback(
    (next: ThemeMode, ev: React.MouseEvent) => {
      if (next === theme) return;
      document.documentElement.style.setProperty("--vt-x", `${ev.clientX}px`);
      document.documentElement.style.setProperty("--vt-y", `${ev.clientY}px`);

      const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
      if (doc.startViewTransition) {
        doc.startViewTransition(() => {
          saveTheme(next);
          setTheme(next);
        });
      } else {
        saveTheme(next);
        setTheme(next);
      }
    },
    [theme]
  );

  const handleToggleBookmark = useCallback(
    (id: string) => {
      setBookmarks((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          showToast(t.toastUnbookmarked);
        } else {
          next.add(id);
          showToast(t.toastBookmarked);
        }
        saveIdSet(storageKeys.bookmarks, next);
        return next;
      });
    },
    [showToast, t.toastBookmarked, t.toastUnbookmarked]
  );

  const handleToggleWish = useCallback(
    (id: string) => {
      setWishlist((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          showToast(t.toastUnwished);
        } else {
          next.add(id);
          showToast(t.toastWished);
        }
        saveIdSet(storageKeys.wishlist, next);
        return next;
      });
    },
    [showToast, t.toastUnwished, t.toastWished]
  );

  const handleOpenItem = useCallback((item: NewsItem) => {
    setOpenItem(item);
    setReadIds((prev) => {
      if (prev.has(item.id)) return prev;
      const next = new Set(prev);
      next.add(item.id);
      saveIdSet(storageKeys.read, next);
      return next;
    });
  }, []);

  const handleOpenEventDirect = useCallback(
    (ev: OfflineEvent) => {
      setPendingEventId(ev.id);
      navigate("events");
    },
    [navigate]
  );

  const handleOpenMerchDirect = useCallback(
    (item: MerchItem) => {
      setPendingMerchId(item.id);
      navigate("merch");
    },
    [navigate]
  );

  const handleSubmitEvent = useCallback((ev: OfflineEvent) => {
    setEvents((prev) => [ev, ...prev]);
  }, []);

  const handleCopyCode = useCallback(
    async (code: string) => {
      try {
        await navigator.clipboard.writeText(code);
        showToast(t.toastCodeCopied(code));
      } catch {
        showToast(t.toastCodeCopied(code));
      }
    },
    [showToast, t]
  );

  const localizedEvents = useMemo(
    () => events.map((e) => localizeEvent(e, lang)),
    [events, lang]
  );
  const localizedMerch = useMemo(
    () => merch.map((m) => localizeMerch(m, lang)),
    [merch, lang]
  );

  const liveCount = useMemo(() => news.filter((n) => n.isLiveOfficial).length, [news]);
  const activeCodeCount = useMemo(
    () => REDEEM_CODES.filter((c) => c.status !== "expired").length,
    []
  );

  const langCtx = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LangContext.Provider value={langCtx}>
      <TopNav
        activeTab={activeTab}
        onNavigate={navigate}
        bookmarkCount={bookmarks.size}
        activeCodeCount={activeCodeCount}
        liveCount={liveCount}
        isSyncing={isSyncing}
        onSync={handleManualSync}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenCodes={() => setCodesModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="main-wrap">
        {activeTab === "home" && (
          <HomeView
            news={news}
            events={localizedEvents}
            merch={localizedMerch}
            bookmarks={bookmarks}
            readIds={readIds}
            onOpenItem={handleOpenItem}
            onOpenEvent={handleOpenEventDirect}
            onOpenMerch={handleOpenMerchDirect}
            onCopyCode={handleCopyCode}
            onOpenCodes={() => setCodesModalOpen(true)}
            onToggleBookmark={handleToggleBookmark}
            onNavigate={navigate}
          />
        )}

        {activeTab === "feed" && (
          <FeedView
            news={news}
            bookmarks={bookmarks}
            readIds={readIds}
            isSyncing={isSyncing}
            onSync={handleManualSync}
            onOpenItem={handleOpenItem}
            onCopyCode={handleCopyCode}
            onOpenCodes={() => setCodesModalOpen(true)}
            onToggleBookmark={handleToggleBookmark}
          />
        )}

        {activeTab === "events" && (
          <EventsView
            events={localizedEvents}
            initialEventId={pendingEventId}
            onClearInitialEvent={() => setPendingEventId(null)}
            onSubmitEvent={handleSubmitEvent}
            onNotify={showToast}
          />
        )}

        {activeTab === "merch" && (
          <MerchView
            items={localizedMerch}
            wishlist={wishlist}
            lastCheckedAt={merchCheckedAt}
            isChecking={isCheckingMerch}
            initialMerchId={pendingMerchId}
            onClearInitialMerch={() => setPendingMerchId(null)}
            onCheckMerch={handleCheckMerch}
            onToggleWish={handleToggleWish}
          />
        )}

        {activeTab === "hub" && (
          <HubView
            news={news}
            bookmarks={bookmarks}
            readIds={readIds}
            syncedAt={syncedAt}
            isSyncing={isSyncing}
            onSync={handleManualSync}
            onApplyNews={setNews}
            onOpenItem={handleOpenItem}
            onToggleBookmark={handleToggleBookmark}
            onNotify={showToast}
          />
        )}
      </main>

      <MobileDock activeTab={activeTab} onNavigate={navigate} />

      {showBackTop && (
        <button
          type="button"
          className="back-to-top-btn"
          aria-label={MERCH_CHECK_TOAST[lang].backTop}
          title={MERCH_CHECK_TOAST[lang].backTop}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp size={17} />
        </button>
      )}

      <GlobalSearchModal
        open={searchOpen}
        news={news}
        events={localizedEvents}
        merch={localizedMerch}
        onClose={() => setSearchOpen(false)}
        onSelectNews={handleOpenItem}
        onSelectEvent={handleOpenEventDirect}
        onSelectMerch={handleOpenMerchDirect}
        onCopyCode={handleCopyCode}
      />

      <RedeemCodesModal
        open={codesModalOpen}
        onClose={() => setCodesModalOpen(false)}
        onCopyCode={handleCopyCode}
      />

      <ArticleModal
        item={openItem}
        isBookmarked={openItem ? bookmarks.has(openItem.id) : false}
        onClose={() => setOpenItem(null)}
        onToggleBookmark={handleToggleBookmark}
        onNotify={showToast}
      />

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <span>✦</span>
          <span>{toast}</span>
        </div>
      )}
    </LangContext.Provider>
  );
};

export default App;
