import { buildUnifiedNewsList, type RawOfficialArticle } from "../industry/news";
import type { NewsItem } from "../industry/types";
import type { AppLang } from "./i18n";
import { UI_DICT } from "./i18n";

function stripHtml(html = ""): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h1|h2|h3|h4|li|div)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractCover(sExt?: string): string {
  try {
    const ext = JSON.parse(sExt || "{}");
    for (const val of Object.values(ext)) {
      if (Array.isArray(val) && val.length > 0 && (val[0] as { url?: string })?.url) {
        return String((val[0] as { url: string }).url);
      }
    }
  } catch {
    // ignore
  }
  return "";
}

export interface LiveSyncResult {
  ok: boolean;
  items: NewsItem[];
  syncedAt: string;
  fetchedCount: number;
  via: "backend-api" | "vite-proxy" | "snapshot-fallback";
  poolActiveAccounts?: number;
  message: string;
}

const SLANG_MAP: Record<AppLang, string> = {
  zh: "zh-cn",
  ja: "ja-jp",
  ko: "ko-kr",
  en: "en-us",
};

/**
 * Live fetch real official HoYoverse ZZZ news for the active language (zh / ja / ko / en)
 */
export async function syncLiveOfficialNews(
  lang: AppLang = "zh",
  forceRefresh = false
): Promise<LiveSyncResult> {
  const dict = UI_DICT[lang];

  // 1. Try deployed Node backend first (uses GET cached lang endpoint on language switch, POST on manual refresh)
  try {
    const endpoint = forceRefresh
      ? `/api/v1/sync?lang=${lang}`
      : `/api/v1/news?lang=${lang}`;
    const apiRes = await fetch(endpoint, { method: forceRefresh ? "POST" : "GET" });
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (Array.isArray(data?.officialItems) && data.officialItems.length > 0) {
        const items = buildUnifiedNewsList(data.officialItems as RawOfficialArticle[]);
        return {
          ok: true,
          items,
          syncedAt: data.fetchedAt || new Date().toISOString(),
          fetchedCount: items.length,
          via: "backend-api",
          poolActiveAccounts: data.pool?.activeAccounts ?? 0,
          message: dict.toastSynced(items.length),
        };
      }
    }
  } catch {
    // fall through to Vite dev proxy
  }

  // 2. Fallback: Vite dev proxy directly hitting HoYoverse Content-V2 API in target language
  try {
    const sLang = SLANG_MAP[lang];
    const url = `/api/hoyoverse/content_v2_user/app/3e9196a4b9274bd7/getContentList?iPageSize=24&iPage=1&sLangKey=${sLang}&iChanId=288`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const list = json?.data?.list;
      if (Array.isArray(list) && list.length > 0) {
        const rawArticles: RawOfficialArticle[] = list.map((raw: Record<string, unknown>) => {
          const plain = stripHtml(String(raw.sContent || raw.sIntro || ""));
          const chanArr = Array.isArray(raw.sChanId) ? raw.sChanId : ["295"];
          return {
            infoId: `${lang}-${raw.iInfoId}`,
            channelId: String(chanArr[0] || "295"),
            title: String(raw.sTitle || "").trim(),
            publishedAt: String(raw.dtStartTime || "").replace(" ", "T") + "+08:00",
            coverUrl: extractCover(String(raw.sExt || "")),
            officialUrl: `https://zenless.hoyoverse.com/${sLang}/news/${raw.iInfoId}`,
            sourcePlatform: lang === "ja" ? "zzz-jp" : "hoyoverse",
            excerpt: plain.slice(0, 220),
            bodyText: plain.slice(0, 2200),
          };
        });
        const items = buildUnifiedNewsList(rawArticles);
        return {
          ok: true,
          items,
          syncedAt: new Date().toISOString(),
          fetchedCount: items.length,
          via: "vite-proxy",
          poolActiveAccounts: 0,
          message: dict.toastSynced(items.length),
        };
      }
    }
  } catch {
    // fall back below
  }

  return {
    ok: false,
    items: buildUnifiedNewsList(),
    syncedAt: new Date().toISOString(),
    fetchedCount: 20,
    via: "snapshot-fallback",
    poolActiveAccounts: 0,
    message: dict.toastSynced(20),
  };
}
