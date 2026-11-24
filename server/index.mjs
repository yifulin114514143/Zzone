#!/usr/bin/env node
/**
 * Zzone · 绝区零全生态实时资讯 Production Server
 * - Serves built Vite SPA (`dist/`)
 * - Auto-fetches official HoYoverse ZZZ Content-V2 news every 15 minutes
 * - Periodic Merch & Offline Events watcher tick every 30 minutes
 * - Exposes REST JSON API (`/api/v1/news`, `/api/v1/events`, `/api/v1/merch`, `/api/v1/status`, `/api/v1/pool`, `POST /api/v1/sync`, `POST /api/v1/ingest`)
 * - Exposes standard RSS 2.0 feed (`/feed.xml`)
 * - Integrates pluggable AccountPoolManager (`server/pool.json` / `ACCOUNT_POOL_JSON`)
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LLMClient } from "./llm.mjs";
import { AccountPoolManager } from "./pool.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");
const SNAPSHOT_PATH = path.join(ROOT, "src/industry/officialSnapshot.json");
const POOL_PATH = path.join(__dirname, "pool.json");
const DATA_DIR = path.join(__dirname, "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const AI_CACHE_PATH = path.join(DATA_DIR, "ai-cache.json");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const INGEST_TOKEN = process.env.INGEST_TOKEN || "";
const SYNC_INTERVAL_MS = Number(process.env.SYNC_INTERVAL_MS || 15 * 60 * 1000);
const MERCH_CHECK_INTERVAL_MS = Number(process.env.MERCH_CHECK_INTERVAL_MS || 30 * 60 * 1000);

const OFFICIAL_GLOBAL_API_URL =
  "https://sg-public-api-static.hoyoverse.com/content_v2_user/app/3e9196a4b9274bd7/getContentList?iPageSize=24&iPage=1&sLangKey=zh-cn&iChanId=288";
const OFFICIAL_CN_API_URL =
  "https://api-takumi-static.mihoyo.com/content_v2_user/app/706fd13a87294881/getContentList?iPageSize=20&iPage=1&sLangKey=zh-cn&iChanId=273";
const OFFICIAL_JP_API_URL =
  "https://sg-public-api-static.hoyoverse.com/content_v2_user/app/3e9196a4b9274bd7/getContentList?iPageSize=24&iPage=1&sLangKey=ja-jp&iChanId=288";
const MIYOUSHE_EVENTS_API_URL =
  "https://bbs-api-static.miyoushe.com/painter/wapi/getNewsList?gids=8&page_size=12&type=2";
const MIYOUSHE_NEWS_API_URL =
  "https://bbs-api-static.miyoushe.com/painter/wapi/getNewsList?gids=8&page_size=10&type=3";
const HOYOLAB_EVENTS_API_URL =
  "https://bbs-api-os.hoyolab.com/community/post/wapi/getNewsList?gids=8&page_size=10&type=2";
const HOYOLAB_NEWS_API_URL =
  "https://bbs-api-os.hoyolab.com/community/post/wapi/getNewsList?gids=8&page_size=8&type=3";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const pool = new AccountPoolManager(POOL_PATH);
const llm = new LLMClient(pool, AI_CACHE_PATH);

const cache = {
  fetchedAt: null,
  merchCheckedAt: new Date().toISOString(),
  totalAvailable: 0,
  source: "5-Source Live Official Matrix (国服官网 / 国际官网 / 米游社 / HoYoLAB / 日服官网)",
  sourceStats: {
    "zzz-cn": 0,
    hoyoverse: 0,
    miyoushe: 0,
    hoyolab: 0,
    "zzz-jp": 0,
  },
  officialItems: [],
  langCache: {
    ja: { fetchedAt: null, items: [] },
    ko: { fetchedAt: null, items: [] },
    en: { fetchedAt: null, items: [] },
  },
  pushedItems: [],
  pushedEvents: [],
  pushedMerch: [],
  syncRuns: 0,
  merchCheckRuns: 0,
  lastError: null,
};

function stripHtml(html = "") {
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

function extractCover(sExt) {
  try {
    const ext = JSON.parse(sExt || "{}");
    for (const val of Object.values(ext)) {
      if (Array.isArray(val) && val.length > 0 && val[0]?.url) {
        return val[0].url;
      }
    }
  } catch {
    // ignore
  }
  return "";
}

function readBodyJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) reject(new Error("Payload too large"));
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function loadPersistedStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return;
    const saved = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
    if (Array.isArray(saved.pushedItems)) cache.pushedItems = saved.pushedItems.slice(0, 200);
    if (Array.isArray(saved.pushedEvents)) cache.pushedEvents = saved.pushedEvents.slice(0, 100);
    if (Array.isArray(saved.pushedMerch)) cache.pushedMerch = saved.pushedMerch.slice(0, 120);
    console.log(
      `[Zzone Store] Restored persisted items: news=${cache.pushedItems.length}, events=${cache.pushedEvents.length}, merch=${cache.pushedMerch.length}`
    );
  } catch (err) {
    console.warn("[Zzone Store] Failed to restore store.json:", err.message);
  }
}

function persistStore() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmpPath = `${STORE_PATH}.tmp`;
    fs.writeFileSync(
      tmpPath,
      JSON.stringify(
        {
          savedAt: new Date().toISOString(),
          pushedItems: cache.pushedItems,
          pushedEvents: cache.pushedEvents,
          pushedMerch: cache.pushedMerch,
        },
        null,
        2
      ),
      "utf-8"
    );
    fs.renameSync(tmpPath, STORE_PATH);
  } catch (err) {
    console.warn("[Zzone Store] Failed to persist store.json:", err.message);
  }
}

function loadLocalSnapshot() {
  if (fs.existsSync(SNAPSHOT_PATH)) {
    try {
      const snap = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf-8"));
      cache.fetchedAt = snap.fetchedAt;
      cache.totalAvailable = snap.totalAvailable || (snap.items || []).length;
      cache.officialItems = snap.items || [];
    } catch (err) {
      console.warn("[Zzone Collector] Snapshot load failed:", err.message);
    }
  }
}

const ROUTINE_OR_EXPIRED_RX =
  /数据悬赏|先遣赏金|嗯呢[」』]?\s*从天降|全新放送|「商城」上新|商城上新说明|调频概率公示|机型[的]?适配说明|放送倒计时\s*\d+\s*小时|前瞻特别节目预告|【已开奖】|\[已開獎\]|データ懸賞|先遣賞金|んナ.*降る|新着放送|「ショップ」.*更新|ショップ.*新商品|変調確率|機種.*対応|確率詳細|予告番組のお知らせ|【当選発表】|데이터 현상금|선발 현상금|응나.*선물|신규 방송|「상점」.*신규|상점.*업데이트|변조 확률|기기.*최적화|특별 방송 예고|\[당첨자 발표\]|Data Bounty|Advanced Bounty|En-Nah Into Your Lap|All-New Program|Store.*New|Signal Search Probability|Compatibility Notice|Device Optimization|Special Program Announcement|Countdown.*1\s*Hour|Winners Announced/i;

function extractCoverHash(url = "") {
  if (!url) return "";
  const file = String(url).split("?")[0].split("/").pop() || "";
  const m = file.match(/^([a-f0-9]{24,40})_/i);
  return m ? m[1].toLowerCase() : file.toLowerCase();
}

function buildDedupeKeys(title = "", coverUrl = "") {
  const keys = [];
  const stripped = String(title || "")
    .replace(/【[^】]*(有奖活动|活动|已开奖|米游币兑换中心|イベント|当選発表)[^】]*】/gi, "")
    .replace(/\[[^\]]*(Prize Event|Event|Winners Announced|보상 이벤트|당첨자 발표)[^\]]*\]/gi, "")
    .replace(/《绝区零》|『ゼンレスゾーンゼロ』|〈젠레스 존 제로〉|Zenless Zone Zero/gi, "")
    .replace(/[《》「」『』【】〈〉丨|\s!！?？·.,，。:：\-—🎁📌📸☆&＆"'()（）]/g, "")
    .toLowerCase();
  if (stripped) keys.push(`txt:${stripped}`);

  const raw = String(title || "");
  const isV34 = /3\.4|长日终尽|ついには長き|긴 나날의 끝자락|Finality of the Day/i.test(raw);
  if (isV34) {
    if (/情报总览|情報まとめ|정보 일람|Intel Report/i.test(raw)) keys.push("topic:v34-intel-overview");
    else if (/福利速递|特典速報|혜택 속보|Benefits Express/i.test(raw)) keys.push("topic:v34-benefits");
    else if (/讨论活动|ディスカッション|토론 이벤트|Discussion Event/i.test(raw)) keys.push("topic:v34-discuss");
    else if (/创作者|クリエイター|크리에이터|Creator/i.test(raw)) keys.push("topic:v34-creator");
    else if (/\bPV\b/i.test(raw)) keys.push("topic:v34-pv");
    else if (/前瞻特别节目|予告番組|특별 방송|Special Program/i.test(raw)) keys.push("topic:v34-livestream");
  }

  if (/调频统计工具|変調統計ツール|변조 통계 도구|Signal Search Statistical Tool/i.test(raw)) {
    keys.push("topic:signal-stat-tool");
  }
  if (/米游币兑换中心/.test(raw)) {
    keys.push("topic:miyoushe-coin-exchange");
  }
  if (/参加活动.*赢取原装母带x10[！!]?$/.test(raw.trim())) {
    keys.push("topic:hoyolab-master-tape-10");
  }
  if (/决战于黎明之前|夜明け前、決戦へ|여명 전의 결전|Final Battle Before Dawn/i.test(raw) && !/薪火之影|长明之影/.test(raw)) {
    keys.push("topic:dawn-battle-main");
  }

  const coverHash = extractCoverHash(coverUrl);
  if (coverHash) keys.push(`img:${coverHash}`);
  return keys;
}

function isStaleCommunityPost(publishedAt, platform) {
  if (platform !== "miyoushe" && platform !== "hoyolab") return false;
  const ts = new Date(publishedAt).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts > 75 * 86400_000;
}

async function runLiveSync() {
  try {
    const headers = { "User-Agent": "Mozilla/5.0 Zzone-Official-Collector/2.1" };
    const hoyolabHeaders = { ...headers, "x-rpc-language": "zh-cn" };

    const [globalRes, cnRes, jpRes, mysEvRes, mysNewsRes, hlEvRes, hlNewsRes] =
      await Promise.allSettled([
        fetch(OFFICIAL_GLOBAL_API_URL, { headers }),
        fetch(OFFICIAL_CN_API_URL, { headers }),
        fetch(OFFICIAL_JP_API_URL, { headers }),
        fetch(MIYOUSHE_EVENTS_API_URL, { headers }),
        fetch(MIYOUSHE_NEWS_API_URL, { headers }),
        fetch(HOYOLAB_EVENTS_API_URL, { headers: hoyolabHeaders }),
        fetch(HOYOLAB_NEWS_API_URL, { headers: hoyolabHeaders }),
      ]);

    const merged = [];
    const keyToItem = new Map();
    const globalInfoIds = new Set();
    const stats = {
      "zzz-cn": 0,
      hoyoverse: 0,
      miyoushe: 0,
      hoyolab: 0,
      "zzz-jp": 0,
    };

    const extractBodyImages = (html = "") => {
      const urls = [];
      const rx = /<img[^>]+src="([^"]+)"/gi;
      let m;
      while ((m = rx.exec(html)) !== null) {
        if (m[1] && /^https?:\/\//i.test(m[1])) urls.push(m[1]);
      }
      return [...new Set(urls)];
    };

    const pushItem = (item) => {
      const title = String(item.title || "").trim();
      if (!title || ROUTINE_OR_EXPIRED_RX.test(title)) return;
      if (isStaleCommunityPost(item.publishedAt, item.sourcePlatform)) return;

      const keys = buildDedupeKeys(title, item.coverUrl);
      if (keys.length === 0) return;

      for (const k of keys) {
        const existing = keyToItem.get(k);
        if (existing) {
          // Merge extra gallery images into existing primary entry without duplicating cards
          const combinedGallery = [...new Set([...(existing.gallery || []), ...(item.gallery || [])])].slice(0, 14);
          if (combinedGallery.length > (existing.gallery || []).length) {
            existing.gallery = combinedGallery;
          }
          if (!existing.coverUrl && item.coverUrl) {
            existing.coverUrl = item.coverUrl;
          }
          return;
        }
      }

      for (const k of keys) keyToItem.set(k, item);
      merged.push(item);
      if (item.sourcePlatform && stats[item.sourcePlatform] !== undefined) {
        stats[item.sourcePlatform] += 1;
      }
    };

    const ingestOfficialContent = (list, platform) => {
      for (const raw of list || []) {
        const title = String(raw.sTitle || "").trim();
        const rawId = String(raw.iInfoId || "");
        if (platform === "hoyoverse" && rawId) globalInfoIds.add(rawId);
        // For JP official site, only keep JP-exclusive items whose iInfoId is NOT in zh-cn global feed
        if (platform === "zzz-jp" && globalInfoIds.has(rawId)) continue;

        const plain = stripHtml(raw.sContent || raw.sIntro || "");
        const cover = extractCover(raw.sExt);
        const bodyImgs = extractBodyImages(raw.sContent || "");
        const gallery = [...new Set([cover, ...bodyImgs].filter(Boolean))].slice(0, 12);

        const officialUrl =
          platform === "zzz-cn"
            ? `https://zzz.mihoyo.com/news/${rawId}`
            : platform === "zzz-jp"
            ? `https://zenless.hoyoverse.com/ja-jp/news/${rawId}`
            : `https://zenless.hoyoverse.com/zh-cn/news/${rawId}`;

        const sourceName =
          platform === "zzz-cn"
            ? "绝区零中国官网"
            : platform === "zzz-jp"
            ? "绝区零日服官网 · 日本专属"
            : "HoYoverse 国际官网";

        pushItem({
          infoId: `${platform === "zzz-cn" ? "cn-" : platform === "zzz-jp" ? "jp-" : ""}${rawId}`,
          channelId: String((raw.sChanId && raw.sChanId[0]) || "295"),
          title,
          publishedAt: String(raw.dtStartTime || "").replace(" ", "T") + "+08:00",
          coverUrl: cover || gallery[0] || "",
          gallery,
          officialUrl,
          sourcePlatform: platform,
          sourceName,
          excerpt: plain.slice(0, 220),
          bodyText: plain.slice(0, 2200),
        });
      }
    };

    const ingestBbsPosts = (list, platform) => {
      for (const entry of list || []) {
        const post = entry?.post;
        if (!post?.post_id || !post?.subject) continue;
        const title = String(post.subject).trim();
        const imgs = (entry.image_list || [])
          .map((im) => im?.url)
          .filter((u) => typeof u === "string" && /^https?:\/\//i.test(u));
        const cover =
          (post.cover && /^https?:\/\//i.test(post.cover) ? post.cover : "") ||
          imgs[0] ||
          "";
        if (!cover) continue; // Keep high-quality visual posts only

        const gallery = [...new Set([cover, ...imgs])].slice(0, 14);
        const createdSec = Number(post.created_at || 0);
        const publishedAt = createdSec
          ? new Date(createdSec * 1000).toISOString()
          : new Date().toISOString();

        const rawContent = stripHtml(String(post.content || post.summary || ""));
        const fallbackDesc =
          platform === "miyoushe"
            ? `米游社《绝区零》官方动态 · 收录 ${gallery.length} 张官方原图，点击上方画廊浏览高清详情或直达米游社原帖参与活动。`
            : `HoYoLAB《绝区零》国际服官方活动 · 收录 ${gallery.length} 张官方原图，点击直达 HoYoLAB 原帖查看规则与奖励。`;

        pushItem({
          infoId: `${platform}-${post.post_id}`,
          channelId: platform,
          title,
          publishedAt,
          coverUrl: cover,
          gallery,
          officialUrl:
            platform === "miyoushe"
              ? `https://www.miyoushe.com/zzz/article/${post.post_id}`
              : `https://www.hoyolab.com/article/${post.post_id}`,
          sourcePlatform: platform,
          sourceName: platform === "miyoushe" ? "米游社绝区零官方" : "HoYoLAB 官方社区",
          excerpt: (rawContent || fallbackDesc).slice(0, 220),
          bodyText: (rawContent || fallbackDesc).slice(0, 2200),
        });
      }
    };

    if (cnRes.status === "fulfilled" && cnRes.value.ok) {
      const cnJson = await cnRes.value.json();
      ingestOfficialContent(cnJson?.data?.list, "zzz-cn");
      cache.totalAvailable = Math.max(cache.totalAvailable, cnJson?.data?.iTotal || 0);
    }

    if (globalRes.status === "fulfilled" && globalRes.value.ok) {
      const glJson = await globalRes.value.json();
      ingestOfficialContent(glJson?.data?.list, "hoyoverse");
      cache.totalAvailable = Math.max(cache.totalAvailable, glJson?.data?.iTotal || 0);
    }

    if (mysEvRes.status === "fulfilled" && mysEvRes.value.ok) {
      const j = await mysEvRes.value.json();
      ingestBbsPosts(j?.data?.list, "miyoushe");
    }
    if (mysNewsRes.status === "fulfilled" && mysNewsRes.value.ok) {
      const j = await mysNewsRes.value.json();
      ingestBbsPosts(j?.data?.list, "miyoushe");
    }

    if (hlEvRes.status === "fulfilled" && hlEvRes.value.ok) {
      const j = await hlEvRes.value.json();
      ingestBbsPosts(j?.data?.list, "hoyolab");
    }
    if (hlNewsRes.status === "fulfilled" && hlNewsRes.value.ok) {
      const j = await hlNewsRes.value.json();
      ingestBbsPosts(j?.data?.list, "hoyolab");
    }

    if (jpRes.status === "fulfilled" && jpRes.value.ok) {
      const jpJson = await jpRes.value.json();
      ingestOfficialContent(jpJson?.data?.list, "zzz-jp");
    }

    if (merged.length > 0) {
      merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      cache.officialItems = merged.slice(0, 56);
      cache.sourceStats = stats;
      cache.fetchedAt = new Date().toISOString();
      cache.syncRuns += 1;
      cache.lastError = null;
      console.log(
        `[Zzone Collector] 5-Source synced ${cache.officialItems.length} live official items (cn=${stats["zzz-cn"]}, global=${stats.hoyoverse}, mys=${stats.miyoushe}, hoyolab=${stats.hoyolab}, jpOnly=${stats["zzz-jp"]}) at ${cache.fetchedAt}`
      );
    }
  } catch (err) {
    cache.lastError = err.message;
    console.warn("[Zzone Collector] Live sync error (serving cached snapshot):", err.message);
  }
  return cache;
}

const LANG_CONFIG = {
  ja: {
    sLangKey: "ja-jp",
    urlSeg: "ja-jp",
    platform: "zzz-jp",
    officialName: "ゼンレスゾーンゼロ 公式",
    hoyolabName: "HoYoLAB 公式",
    fillerRx:
      /データ懸賞|先遣賞金|んナ.*降る|新着放送|「ショップ」.*更新|ショップ.*新商品|変調確率|機種.*対応|確率詳細/,
    fallbackDesc: (n) =>
      `HoYoLAB『ゼンレスゾーンゼロ』公式投稿（公式画像 ${n} 枚）。ギャラリーまたは公式リンクから詳細をご確認ください。`,
  },
  ko: {
    sLangKey: "ko-kr",
    urlSeg: "ko-kr",
    platform: "hoyoverse",
    officialName: "젠레스 존 제로 공식",
    hoyolabName: "HoYoLAB 공식",
    fillerRx:
      /데이터 현상금|선발 현상금|응나.*선물|신규 방송|「상점」.*신규|상점.*업데이트|변조 확률|기기.*최적화/,
    fallbackDesc: (n) =>
      `HoYoLAB 〈젠레스 존 제로〉 공식 게시물 (공식 이미지 ${n}장). 갤러리 또는 공식 원문에서 상세 내용을 확인하세요.`,
  },
  en: {
    sLangKey: "en-us",
    urlSeg: "en-us",
    platform: "hoyoverse",
    officialName: "Zenless Zone Zero Official",
    hoyolabName: "HoYoLAB Official",
    fillerRx:
      /Data Bounty|Advanced Bounty|En-Nah Into Your Lap|All-New Program|Store.*New|Signal Search Probability|Compatibility Notice|Device Optimization/i,
    fallbackDesc: (n) =>
      `HoYoLAB Zenless Zone Zero official post (${n} official images). Browse the gallery or open the original post for full details.`,
  },
};

async function runLangLiveSync(lang, force = false) {
  const cfg = LANG_CONFIG[lang];
  if (!cfg) return cache.officialItems;

  const slot = cache.langCache[lang];
  if (
    !force &&
    slot?.fetchedAt &&
    slot.items.length > 0 &&
    Date.now() - new Date(slot.fetchedAt).getTime() < SYNC_INTERVAL_MS
  ) {
    return slot.items;
  }

  try {
    const headers = { "User-Agent": "Mozilla/5.0 Zzone-Official-Collector/2.2" };
    const hlHeaders = { ...headers, "x-rpc-language": cfg.sLangKey };
    const officialUrl = `https://sg-public-api-static.hoyoverse.com/content_v2_user/app/3e9196a4b9274bd7/getContentList?iPageSize=28&iPage=1&sLangKey=${cfg.sLangKey}&iChanId=288`;

    const [offRes, hlEvRes, hlNewsRes] = await Promise.allSettled([
      fetch(officialUrl, { headers }),
      fetch(HOYOLAB_EVENTS_API_URL, { headers: hlHeaders }),
      fetch(HOYOLAB_NEWS_API_URL, { headers: hlHeaders }),
    ]);

    const merged = [];
    const keyToItem = new Map();

    const extractImgs = (html = "") => {
      const urls = [];
      const rx = /<img[^>]+src="([^"]+)"/gi;
      let m;
      while ((m = rx.exec(html)) !== null) {
        if (m[1] && /^https?:\/\//i.test(m[1])) urls.push(m[1]);
      }
      return [...new Set(urls)];
    };

    const addOne = (item) => {
      const title = String(item.title || "").trim();
      if (!title || cfg.fillerRx.test(title) || ROUTINE_OR_EXPIRED_RX.test(title)) return;
      if (isStaleCommunityPost(item.publishedAt, item.sourcePlatform)) return;

      const keys = buildDedupeKeys(title, item.coverUrl);
      if (keys.length === 0) return;

      for (const k of keys) {
        const existing = keyToItem.get(k);
        if (existing) {
          const combinedGallery = [...new Set([...(existing.gallery || []), ...(item.gallery || [])])].slice(0, 14);
          if (combinedGallery.length > (existing.gallery || []).length) {
            existing.gallery = combinedGallery;
          }
          if (!existing.coverUrl && item.coverUrl) existing.coverUrl = item.coverUrl;
          return;
        }
      }

      for (const k of keys) keyToItem.set(k, item);
      merged.push(item);
    };

    if (offRes.status === "fulfilled" && offRes.value.ok) {
      const j = await offRes.value.json();
      for (const raw of j?.data?.list || []) {
        const plain = stripHtml(raw.sContent || raw.sIntro || "");
        const cover = extractCover(raw.sExt);
        const bodyImgs = extractImgs(raw.sContent || "");
        const gallery = [...new Set([cover, ...bodyImgs].filter(Boolean))].slice(0, 12);
        addOne({
          infoId: `${lang}-${raw.iInfoId}`,
          channelId: String((raw.sChanId && raw.sChanId[0]) || "295"),
          title: String(raw.sTitle || "").trim(),
          publishedAt: String(raw.dtStartTime || "").replace(" ", "T") + "+08:00",
          coverUrl: cover || gallery[0] || "",
          gallery,
          officialUrl: `https://zenless.hoyoverse.com/${cfg.urlSeg}/news/${raw.iInfoId}`,
          sourcePlatform: cfg.platform,
          sourceName: cfg.officialName,
          excerpt: plain.slice(0, 220),
          bodyText: plain.slice(0, 2200),
        });
      }
    }

    const ingestHl = (list) => {
      for (const entry of list || []) {
        const post = entry?.post;
        if (!post?.post_id || !post?.subject) continue;
        const imgs = (entry.image_list || [])
          .map((im) => im?.url)
          .filter((u) => typeof u === "string" && /^https?:\/\//i.test(u));
        const cover =
          (post.cover && /^https?:\/\//i.test(post.cover) ? post.cover : "") ||
          imgs[0] ||
          "";
        if (!cover) continue;
        const gallery = [...new Set([cover, ...imgs])].slice(0, 14);
        const createdSec = Number(post.created_at || 0);
        const publishedAt = createdSec
          ? new Date(createdSec * 1000).toISOString()
          : new Date().toISOString();
        const plain = stripHtml(String(post.content || post.summary || ""));
        addOne({
          infoId: `hoyolab-${lang}-${post.post_id}`,
          channelId: "hoyolab",
          title: String(post.subject).trim(),
          publishedAt,
          coverUrl: cover,
          gallery,
          officialUrl: `https://www.hoyolab.com/article/${post.post_id}`,
          sourcePlatform: "hoyolab",
          sourceName: cfg.hoyolabName,
          excerpt: (plain || cfg.fallbackDesc(gallery.length)).slice(0, 220),
          bodyText: (plain || cfg.fallbackDesc(gallery.length)).slice(0, 2200),
        });
      }
    };

    if (hlEvRes.status === "fulfilled" && hlEvRes.value.ok) {
      ingestHl((await hlEvRes.value.json())?.data?.list);
    }
    if (hlNewsRes.status === "fulfilled" && hlNewsRes.value.ok) {
      ingestHl((await hlNewsRes.value.json())?.data?.list);
    }

    if (merged.length > 0) {
      merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      slot.items = merged.slice(0, 42);
      slot.fetchedAt = new Date().toISOString();
      console.log(
        `[Zzone Collector] Lang(${lang}) synced ${slot.items.length} official items at ${slot.fetchedAt}`
      );
    }
  } catch (err) {
    console.warn(`[Zzone Collector] Lang(${lang}) sync error:`, err.message);
  }
  return slot.items;
}

function runPeriodicMerchCheck() {
  cache.merchCheckedAt = new Date().toISOString();
  cache.merchCheckRuns += 1;
  // When miyoushe/miyoupu account pool is configured in server/pool.json,
  // pool.acquire("miyoushe") will pull fresh daily/version merch drops here.
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function escapeXml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildRssXml() {
  const itemsXml = [...cache.pushedItems, ...cache.officialItems]
    .slice(0, 20)
    .map(
      (it) => `    <item>
      <title>${escapeXml(it.title)}</title>
      <link>${escapeXml(it.officialUrl)}</link>
      <guid isPermaLink="false">zzone-${escapeXml(it.infoId)}</guid>
      <pubDate>${new Date(it.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(it.excerpt)}</description>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Zzone · 绝区零全生态实时资讯</title>
    <link>http://localhost:${PORT}/</link>
    <description>绝区零官方公告、线下活动（FES/同人）与米游铺周边上新 RSS</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;
}

loadLocalSnapshot();
loadPersistedStore();
runLiveSync();
runPeriodicMerchCheck();
setInterval(runLiveSync, SYNC_INTERVAL_MS);
setInterval(runPeriodicMerchCheck, MERCH_CHECK_INTERVAL_MS);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  if (pathname === "/healthz") {
    return sendJson(res, 200, { ok: true, uptimeSec: Math.round(process.uptime()) });
  }

  if (pathname === "/api/v1/status") {
    return sendJson(res, 200, {
      ok: true,
      service: "zzone-realtime-hub",
      persistedStore: fs.existsSync(STORE_PATH),
      sourceStats: cache.sourceStats,
      fetchedAt: cache.fetchedAt,
      merchCheckedAt: cache.merchCheckedAt,
      itemCount: cache.officialItems.length + cache.pushedItems.length,
      pushedEventsCount: cache.pushedEvents.length,
      pushedMerchCount: cache.pushedMerch.length,
      totalOfficialArchive: cache.totalAvailable,
      syncRuns: cache.syncRuns,
      merchCheckRuns: cache.merchCheckRuns,
      syncIntervalSec: Math.round(SYNC_INTERVAL_MS / 1000),
      merchIntervalSec: Math.round(MERCH_CHECK_INTERVAL_MS / 1000),
      lastError: cache.lastError,
      pool: pool.getSummary(),
      llm: llm.getStatus(),
    });
  }

  if (pathname === "/api/v1/news") {
    const lang = url.searchParams.get("lang") || "zh";
    if (lang === "ja" || lang === "ko" || lang === "en") {
      const langItems = await runLangLiveSync(lang, false);
      return sendJson(res, 200, {
        lang,
        fetchedAt: cache.langCache[lang].fetchedAt || cache.fetchedAt,
        totalAvailable: langItems.length,
        source: `HoYoverse Official (${lang})`,
        officialItems: langItems,
        pool: pool.getSummary(),
        llm: llm.getStatus(),
      });
    }
    return sendJson(res, 200, {
      lang: "zh",
      fetchedAt: cache.fetchedAt,
      totalAvailable: cache.totalAvailable,
      source: cache.source,
      officialItems: llm.applyCachedToItems([...cache.pushedItems, ...cache.officialItems]),
      pool: pool.getSummary(),
      llm: llm.getStatus(),
    });
  }

  if (pathname === "/api/v1/events") {
    return sendJson(res, 200, {
      ok: true,
      pushedEvents: cache.pushedEvents,
      updatedAt: cache.fetchedAt || new Date().toISOString(),
    });
  }

  if (pathname === "/api/v1/merch") {
    runPeriodicMerchCheck();
    return sendJson(res, 200, {
      ok: true,
      lastCheckedAt: cache.merchCheckedAt,
      checkIntervalMin: Math.round(MERCH_CHECK_INTERVAL_MS / 60000),
      pushedMerch: cache.pushedMerch,
    });
  }

  if (pathname === "/api/v1/sync" && req.method === "POST") {
    const lang = url.searchParams.get("lang") || "zh";
    if (lang === "ja" || lang === "ko" || lang === "en") {
      const langItems = await runLangLiveSync(lang, true);
      return sendJson(res, 200, {
        ok: true,
        lang,
        fetchedAt: cache.langCache[lang].fetchedAt || new Date().toISOString(),
        officialItems: langItems,
        pool: pool.getSummary(),
        llm: llm.getStatus(),
      });
    }
    await runLiveSync();
    return sendJson(res, 200, {
      ok: true,
      lang: "zh",
      fetchedAt: cache.fetchedAt,
      officialItems: llm.applyCachedToItems([...cache.pushedItems, ...cache.officialItems]),
      pool: pool.getSummary(),
      llm: llm.getStatus(),
    });
  }

  // Server-side LLM batch classification & summarization (with disk SHA-256 cache)
  if ((pathname === "/api/ai/enrich" || pathname === "/api/ai/group") && req.method === "POST") {
    try {
      const payload = await readBodyJson(req);
      const maxPerBatch = Math.min(20, Math.max(1, Number(payload.limit || 12)));
      const sourceList =
        Array.isArray(payload.items) && payload.items.length > 0
          ? payload.items.slice(0, 20).map((x, idx) => ({
              infoId: String(x.infoId || x.id || `custom-${idx}`),
              title: String(x.title || ""),
              bodyText: String(x.bodyText || x.body || x.excerpt || x.summary || ""),
              sourceName: x.sourceName || x.source || "",
            }))
          : [...cache.pushedItems, ...cache.officialItems];

      const out = await llm.enrichBatch(sourceList, { maxPerBatch });
      return sendJson(res, 200, {
        ok: true,
        ...out,
        officialItems: llm.applyCachedToItems([...cache.pushedItems, ...cache.officialItems]),
        llm: llm.getStatus(),
      });
    } catch (err) {
      return sendJson(res, 502, { ok: false, error: err.message, llm: llm.getStatus() });
    }
  }

  // Server-side on-demand AI search summary (30-min query cache + daily cap)
  if (pathname === "/api/ai/search-summary" && req.method === "POST") {
    try {
      const payload = await readBodyJson(req);
      const query = String(payload.query || "").trim();
      const lang = String(payload.lang || "zh");
      const contextItems = Array.isArray(payload.items) ? payload.items : [];
      if (!query) return sendJson(res, 400, { ok: false, error: "Missing search query" });
      const out = await llm.summarizeSearch(query, contextItems, lang);
      return sendJson(res, 200, { ok: true, ...out, llm: llm.getStatus() });
    } catch (err) {
      return sendJson(res, 502, { ok: false, error: err.message, llm: llm.getStatus() });
    }
  }

  // AIHOT-compatible external push / account-pool worker ingest endpoint
  // Supports kind: "news" | "event" | "merch"
  if (pathname === "/api/v1/ingest" && req.method === "POST") {
    if (INGEST_TOKEN) {
      const provided =
        req.headers["x-ingest-token"] ||
        String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (provided !== INGEST_TOKEN) {
        return sendJson(res, 401, { ok: false, error: "Unauthorized ingest token" });
      }
    }
    try {
      const payload = await readBodyJson(req);
      const kind = payload.kind || "news";

      if (kind === "event" && payload.item?.title) {
        const ev = {
          id: payload.item.id || `ev-push-${Date.now()}`,
          official: Boolean(payload.item.official),
          organizer: payload.item.organizer || "号池自动采集",
          type: payload.item.type || "fan_only",
          status: payload.item.status || "upcoming",
          city: payload.item.city || "待定",
          venue: payload.item.venue || "待公布",
          dateRange: payload.item.dateRange || "待定",
          startAt: payload.item.startAt || new Date().toISOString(),
          ticketStatus: payload.item.ticketStatus || "信息更新中",
          accent: payload.item.accent || (payload.item.official ? "#ff5a1f" : "#a78bfa"),
          highlights: payload.item.highlights || [payload.item.subtitle || payload.item.title],
          description: payload.item.description || payload.item.subtitle || payload.item.title,
          sourceUrl: payload.item.sourceUrl || "https://www.miyoushe.com/zzz/",
          ...payload.item,
        };
        cache.pushedEvents.unshift(ev);
        cache.pushedEvents = cache.pushedEvents.slice(0, 100);
        persistStore();
        return sendJson(res, 200, { ok: true, kind: "event", totalPushedEvents: cache.pushedEvents.length });
      }

      if (kind === "merch" && payload.item?.name) {
        const m = {
          id: payload.item.id || `merch-push-${Date.now()}`,
          series: payload.item.series || "米游铺定期监测上新",
          category: payload.item.category || "goods",
          cadence: payload.item.cadence || "daily_drop",
          saleStatus: payload.item.saleStatus || "in_stock",
          priceText: payload.item.priceText || "待公布",
          priceNum: Number(payload.item.priceNum || 59),
          releaseDate: payload.item.releaseDate || new Date().toISOString().slice(0, 10),
          channels: payload.item.channels || ["米游铺 · 绝区零专区"],
          characterOrFaction: payload.item.characterOrFaction || "绝区零官方周边",
          factionId: payload.item.factionId || "new-eridu",
          accent: payload.item.accent || "#ff5a1f",
          specs: payload.item.specs || ["米游铺官方正品周边"],
          summary: payload.item.summary || payload.item.name,
          buyUrl: payload.item.buyUrl || "https://www.mihoyogift.com/",
          updatedAt: new Date().toISOString(),
          ...payload.item,
        };
        cache.pushedMerch.unshift(m);
        cache.pushedMerch = cache.pushedMerch.slice(0, 120);
        cache.merchCheckedAt = new Date().toISOString();
        persistStore();
        return sendJson(res, 200, { ok: true, kind: "merch", totalPushedMerch: cache.pushedMerch.length });
      }

      const list = Array.isArray(payload) ? payload : payload.items || [payload];
      let added = 0;
      for (const item of list) {
        if (!item?.title) continue;
        const infoId = String(item.infoId || item.id || `push-${Date.now()}-${added}`);
        if (cache.pushedItems.some((x) => x.infoId === infoId)) continue;
        cache.pushedItems.unshift({
          infoId,
          channelId: String(item.channelId || "push"),
          title: String(item.title).trim(),
          publishedAt: item.publishedAt || new Date().toISOString(),
          coverUrl: item.coverUrl || "",
          officialUrl: item.url || item.officialUrl || "https://zenless.hoyoverse.com/zh-cn/news",
          excerpt: String(item.summary || item.excerpt || item.body || item.title).slice(0, 220),
          bodyText: String(item.body || item.summary || item.title).slice(0, 2200),
        });
        added += 1;
      }
      cache.pushedItems = cache.pushedItems.slice(0, 200);
      if (added > 0) persistStore();
      return sendJson(res, 200, { ok: true, kind: "news", added, totalPushed: cache.pushedItems.length });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  if (pathname === "/api/v1/pool") {
    if (req.method === "POST") {
      return sendJson(res, 200, { ok: true, pool: pool.reload(), llm: llm.getStatus() });
    }
    return sendJson(res, 200, { ok: true, pool: pool.getSummary(), llm: llm.getStatus() });
  }

  if (pathname === "/feed.xml") {
    res.writeHead(200, { "Content-Type": "application/rss+xml; charset=utf-8" });
    return res.end(buildRssXml());
  }

  // Static frontend serving (`dist/`)
  let filePath = path.join(DIST_DIR, pathname === "/" ? "index.html" : pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, "index.html");
  }
  if (!fs.existsSync(filePath)) {
    res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Build not found. Run `pnpm run build` first.");
  }

  const ext = path.extname(filePath);
  const isImmutableAsset = pathname.startsWith("/assets/");
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Cache-Control": isImmutableAsset ? "public, max-age=604800, immutable" : "no-cache",
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`\n✦ Zzone · 绝区零全生态实时资讯 Server running at http://${HOST === "0.0.0.0" ? "127.0.0.1" : HOST}:${PORT}`);
  console.log(`   - API:  /api/v1/news | /api/v1/events | /api/v1/merch | /api/v1/status | POST /api/v1/ingest`);
  console.log(`   - RSS:  /feed.xml`);
  console.log(`   - Pool: ${pool.getSummary().totalAccounts} accounts loaded (${POOL_PATH})\n`);
});
