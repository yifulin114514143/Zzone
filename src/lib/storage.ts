import type { AppLang } from "./i18n";

const BOOKMARKS_KEY = "zz:bookmarks";
const READ_KEY = "zz:read";
const WISHLIST_KEY = "zz:merch-wishlist";
const THEME_KEY = "zz:theme";
const LANG_KEY = "zz:lang";

export type ThemeMode = "dark" | "light";

export function loadLang(): AppLang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === "zh" || v === "ja" || v === "ko" || v === "en") return v;
  } catch {
    // ignore
  }
  return "zh";
}

export function saveLang(lang: AppLang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // ignore
  }
  const map: Record<AppLang, string> = { zh: "zh-CN", ja: "ja", ko: "ko", en: "en" };
  document.documentElement.setAttribute("lang", map[lang]);
}

export function loadTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    // ignore
  }
  return "dark";
}

export function saveTheme(theme: ThemeMode) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#0b0c11" : "#f6f7fa");
  }
}

export function loadIdSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveIdSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

export const storageKeys = {
  bookmarks: BOOKMARKS_KEY,
  read: READ_KEY,
  wishlist: WISHLIST_KEY,
};
