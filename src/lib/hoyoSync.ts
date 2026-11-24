import { buildUnifiedNewsList, type RawOfficialArticle } from "../industry/news";
import type { NewsItem } from "../industry/types";

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

/**
 * Live fetch real official HoYoverse ZZZ news:
 * 1) Tries our deployable backend `/api/v1/sync` (which also orchestrates Account Pool sources)
 * 2) Falls back to Vite dev proxy `/api/hoyoverse/...` directly hitting HoYoverse Content-V2 API
 * 3) Gracefully falls back to bundled local official snapshot if offline
 */
export async function syncLiveOfficialNews(): Promise<LiveSyncResult> {
  // 1. Try deployed Node backend first
  try {
    const apiRes = await fetch("/api/v1/sync", { method: "POST" });
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (Array.isArray(data?.officialItems) && data.officialItems.length > 0) {
        const items = buildUnifiedNewsList(data.officialItems as RawOfficialArticle[]);
        return {
          ok: true,
          items,
          syncedAt: data.fetchedAt || new Date().toISOString(),
          fetchedCount: data.officialItems.length,
          via: "backend-api",
          poolActiveAccounts: data.pool?.activeAccounts ?? 0,
          message: `已通过后端抓取服务实时同步 ${data.officialItems.length} 条绝区零官方资讯`,
        };
      }
    }
  } catch {
    // fall through to Vite dev proxy
  }

  // 2. Try Vite dev proxy directly to HoYoverse Content-V2 API
  try {
    const url =
      "/api/hoyoverse/content_v2_user/app/3e9196a4b9274bd7/getContentList?iPageSize=24&iPage=1&sLangKey=zh-cn&iChanId=288";
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const list = json?.data?.list;
      if (Array.isArray(list) && list.length > 0) {
        const rawArticles: RawOfficialArticle[] = list.map((raw: Record<string, unknown>) => {
          const plain = stripHtml(String(raw.sContent || raw.sIntro || ""));
          const chanArr = Array.isArray(raw.sChanId) ? raw.sChanId : ["295"];
          return {
            infoId: String(raw.iInfoId),
            channelId: String(chanArr[0] || "295"),
            title: String(raw.sTitle || "").trim(),
            publishedAt: String(raw.dtStartTime || "").replace(" ", "T") + "+08:00",
            coverUrl: extractCover(String(raw.sExt || "")),
            officialUrl: `https://zenless.hoyoverse.com/zh-cn/news/${raw.iInfoId}`,
            excerpt: plain.slice(0, 220),
            bodyText: plain.slice(0, 2200),
          };
        });
        const items = buildUnifiedNewsList(rawArticles);
        return {
          ok: true,
          items,
          syncedAt: new Date().toISOString(),
          fetchedCount: rawArticles.length,
          via: "vite-proxy",
          poolActiveAccounts: 0,
          message: `已直连 HoYoverse 官方接口刷新 ${rawArticles.length} 条实时资讯`,
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
    fetchedCount: 24,
    via: "snapshot-fallback",
    poolActiveAccounts: 0,
    message: "当前处于离线/静态预览模式，已加载最新官方快照数据",
  };
}
