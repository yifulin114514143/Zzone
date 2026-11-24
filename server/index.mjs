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
  "https://api-takumi-static.mihoyo.com/content_v2_user/app/706fd13a87294881/getContentList?iPageSize=24&iPage=1&sLangKey=zh-cn&iChanId=273";
const OFFICIAL_CN_PAGE2_API_URL =
  "https://api-takumi-static.mihoyo.com/content_v2_user/app/706fd13a87294881/getContentList?iPageSize=24&iPage=2&sLangKey=zh-cn&iChanId=273";
const OFFICIAL_JP_API_URL =
  "https://sg-public-api-static.hoyoverse.com/content_v2_user/app/3e9196a4b9274bd7/getContentList?iPageSize=24&iPage=1&sLangKey=ja-jp&iChanId=288";
const OFFICIAL_KR_API_URL =
  "https://sg-public-api-static.hoyoverse.com/content_v2_user/app/3e9196a4b9274bd7/getContentList?iPageSize=24&iPage=1&sLangKey=ko-kr&iChanId=288";
const OFFICIAL_TW_API_URL =
  "https://sg-public-api-static.hoyoverse.com/content_v2_user/app/3e9196a4b9274bd7/getContentList?iPageSize=24&iPage=1&sLangKey=zh-tw&iChanId=288";
const MIYOUSHE_EVENTS_API_URL =
  "https://bbs-api-static.miyoushe.com/painter/wapi/getNewsList?gids=8&page_size=12&type=2";
const MIYOUSHE_NEWS_API_URL =
  "https://bbs-api-static.miyoushe.com/painter/wapi/getNewsList?gids=8&page_size=10&type=3";
const HOYOLAB_EVENTS_API_URL =
  "https://bbs-api-os.hoyolab.com/community/post/wapi/getNewsList?gids=8&page_size=10&type=2";
const HOYOLAB_NEWS_API_URL =
  "https://bbs-api-os.hoyolab.com/community/post/wapi/getNewsList?gids=8&page_size=8&type=3";
const YOUTUBE_OFFICIAL_RSS_URL =
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC2SpC8rL9LaeQriE4YNdyzA";
const BILISHOW_ZZZ_SEARCH_URL =
  "https://show.bilibili.com/api/ticket/search/list?version=134&keyword=%E7%BB%9D%E5%8C%BA%E9%9B%B6&pagesize=12&page=1&platform=web";
const CPP_ZZZ_SEARCH_URL =
  "https://www.allcpp.cn/allcpp/event/eventMainListV2.do?keyword=%E7%BB%9D%E5%8C%BA%E9%9B%B6&pageNo=1&pageSize=10";
const MIHOYOGIFT_LIST_API =
  "https://api-mall.mihoyogift.com/common/homeishop/v1/goods/search_goods_spu_list";
const MIHOYOGIFT_DETAIL_API =
  "https://api-mall.mihoyogift.com/common/homeishop/v1/goods/get_goods_spu_detail";

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
  eventsCheckedAt: null,
  totalAvailable: 0,
  source: "Global 10-Source Live Matrix (国服/国际/米游社/HoYoLAB/日/韩/繁中/YouTube/会员购/CPP)",
  sourceStats: {
    "zzz-cn": 0,
    hoyoverse: 0,
    miyoushe: 0,
    hoyolab: 0,
    "zzz-jp": 0,
    "zzz-kr": 0,
    "zzz-tw": 0,
    youtube: 0,
    ticket: 0,
    cpp: 0,
  },
  officialItems: [],
  liveEvents: [],
  liveMerch: [],
  mihoyogiftCatalog: [],
  mihoyogiftTotal: 0,
  merchDetailCache: new Map(),
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
    const headers = { "User-Agent": "Mozilla/5.0 Zzone-Official-Collector/3.1" };
    const hoyolabHeaders = { ...headers, "x-rpc-language": "zh-cn" };

    const [globalRes, cnRes, jpRes, krRes, twRes, mysEvRes, mysNewsRes, hlEvRes, hlNewsRes, ytRes] =
      await Promise.allSettled([
        fetch(OFFICIAL_GLOBAL_API_URL, { headers, signal: AbortSignal.timeout(10000) }),
        fetch(OFFICIAL_CN_API_URL, { headers, signal: AbortSignal.timeout(10000) }),
        fetch(OFFICIAL_JP_API_URL, { headers, signal: AbortSignal.timeout(10000) }),
        fetch(OFFICIAL_KR_API_URL, { headers, signal: AbortSignal.timeout(10000) }),
        fetch(OFFICIAL_TW_API_URL, { headers, signal: AbortSignal.timeout(10000) }),
        fetch(MIYOUSHE_EVENTS_API_URL, { headers, signal: AbortSignal.timeout(10000) }),
        fetch(MIYOUSHE_NEWS_API_URL, { headers, signal: AbortSignal.timeout(10000) }),
        fetch(HOYOLAB_EVENTS_API_URL, { headers: hoyolabHeaders, signal: AbortSignal.timeout(10000) }),
        fetch(HOYOLAB_NEWS_API_URL, { headers: hoyolabHeaders, signal: AbortSignal.timeout(10000) }),
        fetch(YOUTUBE_OFFICIAL_RSS_URL, { headers, signal: AbortSignal.timeout(6500) }),
      ]);

    const merged = [];
    const keyToItem = new Map();
    const globalInfoIds = new Set();
    const stats = {
      ...cache.sourceStats,
      "zzz-cn": 0,
      hoyoverse: 0,
      miyoushe: 0,
      hoyolab: 0,
      "zzz-jp": 0,
      "zzz-kr": 0,
      "zzz-tw": 0,
      youtube: 0,
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
        // For JP / KR / TW official sites, only keep region-exclusive items whose iInfoId is NOT in zh-cn global feed
        if ((platform === "zzz-jp" || platform === "zzz-kr" || platform === "zzz-tw") && globalInfoIds.has(rawId)) {
          continue;
        }

        const plain = stripHtml(raw.sContent || raw.sIntro || "");
        const cover = extractCover(raw.sExt);
        const bodyImgs = extractBodyImages(raw.sContent || "");
        const gallery = [...new Set([cover, ...bodyImgs].filter(Boolean))].slice(0, 12);

        const officialUrl =
          platform === "zzz-cn"
            ? `https://zzz.mihoyo.com/news/${rawId}`
            : platform === "zzz-jp"
            ? `https://zenless.hoyoverse.com/ja-jp/news/${rawId}`
            : platform === "zzz-kr"
            ? `https://zenless.hoyoverse.com/ko-kr/news/${rawId}`
            : platform === "zzz-tw"
            ? `https://zenless.hoyoverse.com/zh-tw/news/${rawId}`
            : `https://zenless.hoyoverse.com/zh-cn/news/${rawId}`;

        const sourceName =
          platform === "zzz-cn"
            ? "绝区零中国官网"
            : platform === "zzz-jp"
            ? "绝区零日服官网 · 日本专属"
            : platform === "zzz-kr"
            ? "绝区零韩服官网 · 韩国专属"
            : platform === "zzz-tw"
            ? "绝区零繁中官网 · 港澳台"
            : "HoYoverse 国际官网";

        const idPrefix =
          platform === "zzz-cn"
            ? "cn-"
            : platform === "zzz-jp"
            ? "jp-"
            : platform === "zzz-kr"
            ? "kr-"
            : platform === "zzz-tw"
            ? "tw-"
            : "";

        pushItem({
          infoId: `${idPrefix}${rawId}`,
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
          imgs[0] ||
          (post.cover && /^https?:\/\//i.test(post.cover) ? post.cover : "");
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

    if (krRes.status === "fulfilled" && krRes.value.ok) {
      const krJson = await krRes.value.json();
      ingestOfficialContent(krJson?.data?.list, "zzz-kr");
    }

    if (twRes.status === "fulfilled" && twRes.value.ok) {
      const twJson = await twRes.value.json();
      ingestOfficialContent(twJson?.data?.list, "zzz-tw");
    }

    // Native YouTube Atom RSS (@ZZZ_Official) — keeps top official trailers/EP/retrospectives without duplicating Special Program recaps
    if (ytRes.status === "fulfilled" && ytRes.value.ok) {
      const xml = await ytRes.value.text();
      const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 8);
      for (const m of entries) {
        const block = m[1];
        const vid = (block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1];
        const rawTitle = (block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
        const title = rawTitle
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .trim();
        const pub = (block.match(/<published>([^<]+)<\/published>/) || [])[1];
        if (!vid || !title) continue;
        // Skip fragmented "Special Program Recap 1..7" micro clips to avoid clutter
        if (/Special Program Recap \d+/i.test(title)) continue;
        const thumb = `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`;
        pushItem({
          infoId: `yt-${vid}`,
          channelId: "youtube",
          title,
          publishedAt: pub || new Date().toISOString(),
          coverUrl: thumb,
          gallery: [thumb],
          officialUrl: `https://www.youtube.com/watch?v=${vid}`,
          sourcePlatform: "youtube",
          sourceName: "YouTube 官方频道",
          excerpt: `YouTube @ZZZ_Official 官方视频发布：${title}`,
          bodyText: `YouTube 官方频道 @ZZZ_Official 最新发布的官方影像内容：${title}。点击直达 YouTube 观看完整高清视频。`,
        });
      }
    }

    if (merged.length > 0) {
      merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      cache.officialItems = merged.slice(0, 64);
      cache.sourceStats = stats;
      cache.fetchedAt = new Date().toISOString();
      cache.syncRuns += 1;
      cache.lastError = null;
      console.log(
        `[Zzone Collector] Multi-Source synced ${cache.officialItems.length} live items (cn=${stats["zzz-cn"]}, global=${stats.hoyoverse}, mys=${stats.miyoushe}, hoyolab=${stats.hoyolab}, jp=${stats["zzz-jp"]}, kr=${stats["zzz-kr"]}, tw=${stats["zzz-tw"]}, yt=${stats.youtube}) at ${cache.fetchedAt}`
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
          imgs[0] ||
          (post.cover && /^https?:\/\//i.test(post.cover) ? post.cover : "");
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

const CURATED_MERCH_INFO_IDS = new Set([
  "167278", "166912", "166933", "166911", "166672",
  "166669", "166670", "166130", "165950", "165940",
  "165939", "165301", "165294", "165293", "165292",
  "165286", "165285", "165284", "165283", "165174",
  "164669", "164651", "164650", "163749", "163740",
  "163739", "163738", "163735", "163169", "163156",
  "163154", "163153", "162611", "162511", "162472",
  "162471", "162465", "162464", "162463", "161649",
  "161610", "161609", "161598", "161597", "161596",
  "161595", "160715", "160714", "160713", "158986",
  "158983", "157502", "157501", "157500", "157499",
  "156036", "156028", "155434", "155433", "154518",
  "154491", "129756", "128908", "127983", "127922",
  "127892", "127332", "127302", "126651", "126639",
  "125962", "124689",
]);

const FALLBACK_FAN_EVENT_COVER =
  "https://fastcdn.hoyoverse.com/content-v2/nap/167369/22818f42207fbeae8dcb93c649a3cfc0_5203235106970544581.png";

/**
 * Live Fan-Convention & Ticketing Aggregator (Bilibili Show + CPP AllCPP, zero account pool needed!)
 */
async function runLiveEventsSync() {
  const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  try {
    const [biliRes, cppRes] = await Promise.allSettled([
      fetch(BILISHOW_ZZZ_SEARCH_URL, {
        headers: { "User-Agent": UA, Referer: "https://show.bilibili.com/" },
        signal: AbortSignal.timeout(9000),
      }),
      fetch(CPP_ZZZ_SEARCH_URL, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(9000),
      }),
    ]);

    const liveList = [];
    const seenKeys = new Set();
    let biliCount = 0;
    let cppCount = 0;
    const nowMs = Date.now();

    const makeCityDateKey = (city, startMs) => {
      const c = String(city || "").replace(/市$/, "").trim();
      const d = startMs ? new Date(startMs + 8 * 3600_000).toISOString().slice(0, 10) : "";
      return `${c}|${d}`;
    };

    if (biliRes.status === "fulfilled" && biliRes.value.ok) {
      const j = await biliRes.value.json();
      for (const item of j?.data?.result || []) {
        const title = String(item.project_name || item.title || "").trim();
        if (!title) continue;
        // Skip Hangzhou 2026 FES / ZLIVE already represented with curated 6-image official dossiers
        if (/2026\s*FES|布梦嘉年华|Zenless\s*LIVE\s*2026/i.test(title)) continue;
        const startSec = Number(item.start_unix || 0);
        const startMs = startSec ? startSec * 1000 : 0;
        if (!startMs) continue;
        const city = String(item.city || "全国").replace(/市$/, "");
        const key = makeCityDateKey(city, startMs);
        if (seenKeys.has(key)) continue;

        const saleFlag = String(item.sale_flag || "");
        const isPast = saleFlag === "已结束" || startMs + 3 * 86400_000 < nowMs;
        // Keep all upcoming/open expos, plus only recent 2025-2026 past expos to avoid old 2024 spam
        if (isPast && startMs < Date.UTC(2025, 6, 1)) continue;

        seenKeys.add(key);
        const rawCover = String(item.cover || "");
        const coverUrl = rawCover
          ? rawCover.startsWith("//")
            ? `https:${rawCover}`
            : rawCover
          : FALLBACK_FAN_EVENT_COVER;
        const isOfficial = /官方|米哈游|FES|Zenless\s*LIVE/i.test(title) && !/同人|only/i.test(title);
        const startIso = new Date(startMs).toISOString();
        const endIso = new Date(startMs + 8 * 3600_000).toISOString();

        liveList.push({
          id: `ev-bili-${item.id}`,
          title,
          subtitle: `${city} · ${item.venue_name || "待定场馆"} · B站会员购实时同步（${saleFlag || "售票中"}）`,
          official: isOfficial,
          region: "cn",
          organizer: isOfficial ? "官方 / 合作展方" : "B站会员购收录 · 同人企划",
          type: isOfficial ? "popup" : "fan_only",
          status: isPast ? "archive" : saleFlag.includes("预售") || saleFlag.includes("售票") ? "open" : "upcoming",
          city,
          venue: String(item.venue_name || "详见购票页"),
          dateRange: String(item.tlabel || startIso.slice(0, 10).replace(/-/g, ".")),
          startAt: startIso,
          endAt: endIso,
          ticketStatus: `B站会员购 · ${saleFlag || "开放购票"}`,
          accent: isOfficial ? "#ff5a1f" : "#a78bfa",
          coverUrl,
          gallery: [coverUrl],
          sourcePlatform: "ticket",
          highlights: [
            `实时同步自 B站会员购漫展/演出检索（票务状态：${saleFlag || "进行中"}）`,
            `举办场馆：${city} · ${item.venue_name || "详见官方购票页面"}`,
            "支持点击下方链接直达 B站会员购查看摊位详情、票档与入场须知",
          ],
          description: `由 Zzone 免号池直连 B站会员购实时抓取的《绝区零》相关线下展会/同人 Only 活动，票务与排期自动跟随平台更新。`,
          sourceUrl: `https://show.bilibili.com/platform/detail.html?id=${item.id}`,
        });
        biliCount += 1;
      }
    }

    if (cppRes.status === "fulfilled" && cppRes.value.ok) {
      const j = await cppRes.value.json();
      for (const item of j?.result?.list || []) {
        const title = String(item.name || "").trim();
        if (!title) continue;
        const startMs = Number(item.enterTime || 0);
        if (!startMs) continue;
        const city = String(item.cityName || item.provName || "全国").replace(/市$/, "");
        const key = makeCityDateKey(city, startMs);
        if (seenKeys.has(key)) continue;

        const isPast = Boolean(item.ended) || startMs + 3 * 86400_000 < nowMs;
        if (isPast && startMs < Date.UTC(2026, 0, 1)) continue;

        seenKeys.add(key);
        const startIso = new Date(startMs).toISOString();
        const endIso = new Date(Number(item.endTime || startMs) + 8 * 3600_000).toISOString();
        const dateStr = new Date(startMs + 8 * 3600_000).toISOString().slice(0, 10).replace(/-/g, ".");

        liveList.push({
          id: `ev-cpp-${item.eventId || item.id}`,
          title,
          subtitle: `${city} · CPP 同人展实时收录（${item.circleCount || 0} 参展社团 · ${item.doujinshiCount || 0} 制品 · ${item.wannaGoCount || 0} 人想去）`,
          official: false,
          region: "cn",
          organizer: "CPP 无差别同人站收录",
          type: "fan_only",
          status: isPast ? "archive" : "open",
          city,
          venue: String(item.enterAddress || `${city}（详见 CPP 页面）`),
          dateRange: dateStr,
          startAt: startIso,
          endAt: endIso,
          ticketStatus: isPast ? "已结束 · CPP 历史归档" : `CPP 开票/申摊中 · ${item.wannaGoCount || 0} 人想去`,
          accent: "#a78bfa",
          coverUrl: FALLBACK_FAN_EVENT_COVER,
          gallery: [FALLBACK_FAN_EVENT_COVER],
          sourcePlatform: "cpp",
          highlights: [
            `实时同步自 CPP 无差别同人站（参展社团 ${item.circleCount || 0} · 同人制品 ${item.doujinshiCount || 0}）`,
            `场地地址：${item.enterAddress || city}`,
            `标签：${item.tag || "绝区零同人"}`,
          ],
          description: `由 Zzone 免号池直连 CPP 无差别同人站实时发现的《绝区零》同人 Only / 游园会信息，点击直达 CPP 官网查看完整摊位与购票入口。`,
          sourceUrl: `https://www.allcpp.cn/allcpp/event/event.do?event=${item.eventId || item.id}`,
        });
        cppCount += 1;
      }
    }

    cache.liveEvents = liveList;
    cache.eventsCheckedAt = new Date().toISOString();
    cache.sourceStats.ticket = biliCount;
    cache.sourceStats.cpp = cppCount;
    console.log(
      `[Zzone Events] Live synced ${liveList.length} conventions/fan-only events (biliShow=${biliCount}, cpp=${cppCount})`
    );
  } catch (err) {
    console.warn("[Zzone Events] Live sync error:", err.message);
  }
}

/**
 * Auto-discover brand-new official merch drops from CN official "新品情报 / 周边展示"
 */
async function runPeriodicMerchCheck() {
  cache.merchCheckedAt = new Date().toISOString();
  cache.merchCheckRuns += 1;
  try {
    const headers = { "User-Agent": "Mozilla/5.0 Zzone-Official-Collector/3.1" };
    const [p1, p2] = await Promise.allSettled([
      fetch(OFFICIAL_CN_API_URL, { headers, signal: AbortSignal.timeout(9000) }),
      fetch(OFFICIAL_CN_PAGE2_API_URL, { headers, signal: AbortSignal.timeout(9000) }),
    ]);

    const rawArticles = [];
    for (const r of [p1, p2]) {
      if (r.status === "fulfilled" && r.value.ok) {
        const j = await r.value.json();
        rawArticles.push(...(j?.data?.list || []));
      }
    }

    const discovered = [];
    for (const raw of rawArticles) {
      const idStr = String(raw.iInfoId || "");
      const title = String(raw.sTitle || "").trim();
      if (!idStr || !title || CURATED_MERCH_INFO_IDS.has(idStr)) continue;
      if (!/新品情报|周边展示|粘土人|手办|盲盒|联名|三Z\s*STUDIO|黑胶|礼盒/i.test(title)) continue;
      if (/新品预告|即将上新/.test(title)) continue;

      const cover = extractCover(raw.sExt);
      const bodyImgs = [];
      const rx = /<img[^>]+src="([^"]+)"/gi;
      let m;
      while ((m = rx.exec(raw.sContent || "")) !== null) {
        if (m[1] && /^https?:\/\//i.test(m[1])) bodyImgs.push(m[1]);
      }
      const gallery = [...new Set([cover, ...bodyImgs].filter(Boolean))].slice(0, 8);
      if (gallery.length === 0) continue;

      const plain = stripHtml(raw.sContent || raw.sIntro || "");
      const dt = String(raw.dtStartTime || "").slice(0, 10);
      const priceMatch = plain.match(/(?:¥|￥|售价|全款|定金)\s*(\d{2,4})/);
      const priceNum = priceMatch ? Number(priceMatch[1]) : 99;
      const isFigure = /手办|粘土人|1\/7|1\/8|POP UP|Figuarts/i.test(title);
      const isBangboo = /邦布|嗯呢|盲盒/.test(title);
      const isCollab = /联名|联动|泡泡玛特|雅迪|KFC|飞智/.test(title);
      const isApparel = /服饰|夹克|键盘|手柄|耳机|快充|充电|外设/.test(title);

      discovered.push({
        id: `merch-live-${idStr}`,
        merchLine: isCollab ? "collab" : "game",
        name: title.replace(/^新品情报[丨|]\s*|^周边展示[丨|]\s*/, ""),
        series: isCollab ? "品牌跨界联名 · 官方新品" : "国服官网「新品情报」自动发现",
        category: isFigure ? "figure" : isCollab ? "collab_merch" : isBangboo ? "bangboo" : isApparel ? "apparel" : "goods",
        cadence: isCollab ? "collab_drop" : "daily_drop",
        saleStatus: "presale",
        region: "cn",
        priceText: priceMatch ? `¥${priceNum} 起` : "见官图详情",
        priceNum,
        releaseDate: `${dt} 官方公布上新`,
        shipDate: "详见米游铺 / 三Z旗舰店公告",
        channels: ["米游社 · 米游铺", "天猫 · 绝区零三Z官方旗舰店", "抖音 · 绝区零周边旗舰店"],
        sourcePlatforms: ["zzz-cn", "tmall", "miyoushe"],
        characterOrFaction: "官方最新上新",
        factionId: "new-eridu",
        coverUrl: gallery[0],
        gallery,
        accent: "#ff5a1f",
        specs: [
          `自动同步自国服官网新品情报（${dt}），共收录 ${gallery.length} 张官方实拍/长图`,
          "点击上方多图画廊或下方链接查看完整价格、规格与预售窗口",
        ],
        summary: (plain || title).slice(0, 120),
        detailIntro: (plain || title).slice(0, 600),
        buyUrl: `https://zzz.mihoyo.com/news/${idStr}`,
        updatedAt: new Date().toISOString(),
      });
    }

    cache.liveMerch = discovered.slice(0, 12);
    if (discovered.length > 0) {
      console.log(`[Zzone Merch] Auto-discovered ${discovered.length} new official merch drops`);
    }
  } catch (err) {
    console.warn("[Zzone Merch] Periodic check error:", err.message);
  }

  await syncMiHoYoGiftCatalog();
}

const COLLAB_MERCH_RX =
  /联名|联动|闪魂|泡泡玛特|POP\s*MART|雅迪|飞智|八爪鱼|盖世小鸡|万代|S\.H\.Figuarts|肯德基|KFC|麦当劳|茶百道|荷美尔|星穹铁道|芬达|GiGO|寿司郎|全家|罗森|瑞幸|雷蛇|罗技|索尼/i;

const CURATED_DUPE_SHOP_RX =
  /「噪点狂潮」客制化三模机械键盘|八爪鱼\s*6\s*Pro|S\.H\.Figuarts\s*(?:零号·安比|比利)|泡泡玛特.*邦布派对|怪啖屋\s*浮波柚叶\s*1\/7|LIMEPIE.*(?:仪玄|星见雅|铃\s*1\/8|月城柳)|Gift\+.*艾莲·乔|仪玄.*独步沧溟|星见雅·砺世澄沧Ver\.\s*1\/7|GSC\s*粘土人(?:手办)?\s*(?:爱芮|千夏|星见雅|铃|哲)|天琴座\s*耀嘉音\s*1\/7|刑侦特勤组\s*简.*1\/7|维多利亚家政\s*(?:艾莲|冯·莱卡恩|可琳).*1\/7|狡兔屋\s*(?:安比|妮可|比利|猫宫).*1\/7|POP\s*UP\s*PARADE\s*SP.*铃&哲|「妄想天使·闪亮登场」耳夹款蓝牙耳机礼盒|邦布蔬果国度\s*搪胶毛绒挂件盲盒/i;

const FACTION_OR_CHAR_MATCHERS = [
  [/维多利亚家政|艾莲|莱卡恩|丽娜|可琳/, "维多利亚家政"],
  [/狡兔屋|安比|妮可|比利|猫又|猫宫/, "狡兔屋"],
  [/对空六课|星见雅|月城柳|浅羽悠真|苍角/, "对空六课"],
  [/刑侦特勤组|朱鸢|青衣|简|赛斯/, "刑侦特勤组"],
  [/卡吕冬之子|凯撒|柏妮思|露西|派派|莱特|波可娜/, "卡吕冬之子"],
  [/白祇重工|珂蕾妲|格莉丝|本|安东/, "白祇重工"],
  [/天琴座|耀嘉音|伊芙琳/, "天琴座"],
  [/怪啖屋|浮波柚叶|爱丽丝/, "怪啖屋"],
  [/云岿山|仪玄|橘福福|潘引壶/, "云岿山"],
  [/反舌鸟|薇薇安|雨果/, "反舌鸟"],
  [/妄想天使|千夏|爱芮|南宫羽/, "妄想天使"],
  [/奥波勒斯|零号·安比|扳机|奥菲丝|席德|11号/, "奥波勒斯小队"],
  [/弗林特工坊/, "弗林特工坊"],
  [/绳匠|法厄同|铃|哲/, "Random Play"],
  [/闪魂/, "闪魂联名"],
  [/邦布|嗯呢|伊埃斯/, "邦布"],
  [/三Z|2026AW|噪点狂潮|急速电力/, "三Z STUDIO"],
];

function formatShopTitle(rawName) {
  let clean = rawName
    .replace(/^【绝区零(?:\/[^】]*)?】\s*/, "")
    .replace(/^【(?:绝区零)?】\s*/, "")
    .trim();
  if (/^【绝区零×闪魂】/.test(clean)) {
    clean = clean.replace(/^【绝区零×闪魂】\s*/, "闪魂 ×《绝区零》").replace("-", " · ");
  }
  return clean || rawName;
}

function extractSeriesLabel(cleanName) {
  const exactRules = [
    [/PINK甜蜜暴击/i, "PINK 甜蜜暴击"],
    [/协奏频段/, "协奏频段"],
    [/空洞回响/, "空洞回响"],
    [/小小代理人|TinyAgents/i, "小小代理人"],
    [/阵营系列/, "阵营系列"],
    [/影画系列/, "影画系列"],
    [/立绘系列/, "立绘系列"],
    [/心象电影/, "心象电影"],
    [/丽都时装/, "丽都时装"],
    [/丽都日常/, "丽都日常"],
    [/闪魂/, "闪魂收藏卡"],
    [/2026AW|2025AW|2025SS/i, "三Z STUDIO 服饰"],
    [/噪点狂潮/, "三Z STUDIO 外设"],
    [/急速电力\s*Pro|急速电力/i, "急速电力数码"],
    [/妄想天使/, "妄想天使"],
    [/GSC\s*粘土人/i, "GSC 粘土人"],
    [/GSC\s*POP\s*UP|POP\s*UP\s*PARADE/i, "POP UP PARADE"],
    [/GSC\s*HELLO/i, "GSC HELLO!"],
    [/LIMEPIE/i, "LIMEPIE 1/8 手办"],
    [/Gift\+/i, "Gift+ 1/8 手办"],
    [/极限委托/, "原声黑胶企划"],
    [/HB2U/i, "HB2U 生日纪念"],
    [/BITE!/i, "BITE! 系列"],
    [/邦布蔬果国度/, "邦布蔬果国度"],
    [/福袋/, "限定福袋"],
    [/FES|Zenless\s*LIVE/i, "FES 场贩限定"],
    [/三Z\s*STUDIO/i, "三Z STUDIO"],
  ];
  for (const [rx, label] of exactRules) {
    if (rx.test(cleanName)) return label;
  }
  const m = cleanName.match(/([^\s【】「」]+系列)/);
  if (m) return m[1];
  return "米游铺官方周边";
}

function extractFactionOrChar(cleanName, seriesLabel) {
  for (const [rx, label] of FACTION_OR_CHAR_MATCHERS) {
    if (rx.test(cleanName)) return label;
  }
  return seriesLabel || "绝区零官方";
}

/**
 * Live full-catalog sync from official miHoYoGift (米游铺) ZZZ shop (`shop_code=zzz`, ~400+ real SKUs)
 */
async function syncMiHoYoGiftCatalog() {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    Referer: "https://www.mihoyogift.com/",
    Origin: "https://www.mihoyogift.com",
  };
  try {
    const first = await fetch(`${MIHOYOGIFT_LIST_API}?shop_code=zzz&page=1&limit=50`, {
      headers,
      signal: AbortSignal.timeout(9000),
    }).then((r) => r.json());

    if (first?.retcode !== 0 || !Array.isArray(first?.data?.list)) return;
    const total = Number(first.data.count || first.data.list.length);
    const totalPages = Math.min(14, Math.ceil(total / 50));

    const restPages = await Promise.allSettled(
      Array.from({ length: Math.max(0, totalPages - 1) }, (_, idx) => idx + 2).map((page) =>
        fetch(`${MIHOYOGIFT_LIST_API}?shop_code=zzz&page=${page}&limit=50`, {
          headers,
          signal: AbortSignal.timeout(9000),
        }).then((r) => r.json())
      )
    );

    const rawList = [...first.data.list];
    for (const r of restPages) {
      if (r.status === "fulfilled" && Array.isArray(r.value?.data?.list)) {
        rawList.push(...r.value.data.list);
      }
    }

    const catalog = [];
    const seenIds = new Set();

    for (const g of rawList) {
      const gid = String(g.goods_id || "");
      const rawName = String(g.name || "").trim();
      if (!gid || !rawName || !g.cover_url || seenIds.has(gid)) continue;
      // Skip balance-payment-only links & flagship items already curated with multi-photo dossiers
      if (/(?:【|\/)尾款】|尾款专拍|补款专拍/.test(rawName)) continue;
      if (CURATED_DUPE_SHOP_RX.test(rawName)) continue;
      seenIds.add(gid);

      const cleanName = formatShopTitle(rawName);
      const isDeposit = /定金/.test(rawName);
      const isCollab = COLLAB_MERCH_RX.test(rawName);
      const isFigure = /手办|粘土人|POP UP|Figuarts|雕像|1\/7|1\/8|LIMEPIE|Gift\+|可动模玩/i.test(rawName);
      const isFes = /FES|LIVE|嘉年华|音乐会|场贩/i.test(rawName);
      const isBangboo = /邦布|嗯呢|盲盒|毛绒|抱枕|靠垫|玩偶|公仔|地毯/.test(rawName);
      const isApparel =
        /服饰|T恤|卫衣|夹克|外套|长裤|短裤|衬衫|帽|包|毛巾|拖鞋|毯|键盘|手柄|耳机|快充|充电|鼠标垫|手机支架|数据线|播放器|音响|手表|伞/.test(
          rawName
        );

      const category = isFes
        ? "fes_limited"
        : isFigure
        ? "figure"
        : isCollab && !isBangboo
        ? "collab_merch"
        : isBangboo
        ? "bangboo"
        : isApparel
        ? "apparel"
        : "goods";

      const cadence = isFes
        ? "fes_drop"
        : isCollab
        ? "collab_drop"
        : /立绘系列|影画系列|版本/.test(rawName)
        ? "version_drop"
        : "daily_drop";

      const saleStatus = g.is_sold_out
        ? "archived"
        : g.presale || isDeposit
        ? "presale"
        : "in_stock";

      const priceYuan = Math.round(Number(g.price || 0) / 100);
      const saleSec = Number(g.sale_time || 0);
      const releaseYmd = saleSec
        ? new Date(saleSec * 1000 + 8 * 3600_000).toISOString().slice(0, 10)
        : "2026-01-01";
      const seriesLabel = extractSeriesLabel(cleanName);
      const charLabel = extractFactionOrChar(cleanName, seriesLabel);
      const coverUrl = String(g.cover_url);
      const statusBrief = g.is_sold_out
        ? "已售罄，可关注后续补货"
        : g.presale || isDeposit
        ? "预售中，发货时间以米游铺商品页为准"
        : "米游铺官方现货发售";

      catalog.push({
        id: `mg-${gid}`,
        mihoyogiftId: gid,
        merchLine: isCollab ? "collab" : "game",
        name: cleanName,
        series: seriesLabel,
        category,
        cadence,
        saleStatus,
        soldOut: Boolean(g.is_sold_out),
        region: "cn",
        priceText: isDeposit ? `定金 ¥${priceYuan}` : `¥${priceYuan}`,
        priceNum: priceYuan,
        releaseDate: `${releaseYmd} 上架`,
        shipDate: statusBrief,
        channels: ["米游铺 · 官方直营", "天猫 · 绝区零三Z官方旗舰店"],
        sourcePlatforms: ["miyoushe", "tmall"],
        characterOrFaction: charLabel,
        factionId: "new-eridu",
        coverUrl,
        gallery: [coverUrl],
        accent: isCollab ? "#38bdf8" : isFigure ? "#f5b73b" : "#ea541d",
        specs: [],
        summary: `${seriesLabel} · ${statusBrief}`,
        detailIntro: `${seriesLabel.endsWith("系列") || seriesLabel.endsWith("周边") ? seriesLabel : `${seriesLabel}系列`}官方直营商品，可前往米游铺查看实时库存、满赠活动与发货安排。`,
        buyUrl: `https://www.mihoyogift.com/goods/${gid}`,
        updatedAt: saleSec ? new Date(saleSec * 1000).toISOString() : new Date().toISOString(),
      });
    }

    catalog.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    cache.mihoyogiftCatalog = catalog;
    cache.mihoyogiftTotal = total;
    console.log(
      `[Zzone miHoYoGift] Synced ${catalog.length}/${total} live official goods (game=${catalog.filter((x) => x.merchLine === "game").length}, collab=${catalog.filter((x) => x.merchLine === "collab").length}, soldOut=${catalog.filter((x) => x.soldOut).length})`
    );
  } catch (err) {
    console.warn("[Zzone miHoYoGift] Catalog sync error:", err.message);
  }
}

async function fetchMiHoYoGiftDetail(goodsId) {
  const gid = String(goodsId || "").replace(/[^0-9]/g, "");
  if (!gid) throw new Error("Invalid goods_id");
  const hit = cache.merchDetailCache.get(gid);
  if (hit && Date.now() - hit.at < 30 * 60 * 1000) return hit.data;

  const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    Referer: "https://www.mihoyogift.com/",
    Origin: "https://www.mihoyogift.com",
  };
  const json = await fetch(`${MIHOYOGIFT_DETAIL_API}?goods_id=${gid}`, {
    headers,
    signal: AbortSignal.timeout(9000),
  }).then((r) => r.json());

  const d = json?.data?.detail;
  if (json?.retcode !== 0 || !d) throw new Error("miHoYoGift detail unavailable");

  const gallery = [
    ...new Set(
      [
        d.cover_url,
        ...(Array.isArray(d.banner_url) ? d.banner_url : []),
        ...(Array.isArray(d.main_url) ? d.main_url : []),
      ].filter((u) => typeof u === "string" && /^https?:\/\//i.test(u))
    ),
  ].slice(0, 12);

  const attrLines = [];
  const attrGroups = [];
  for (const attr of d.sale_attrs || []) {
    const opts = (attr.content || []).map((c) => String(c.text || "").trim()).filter(Boolean);
    if (opts.length > 0) {
      const groupName = String(attr.name || "款式").trim();
      attrGroups.push({ name: groupName, options: opts.slice(0, 24), total: opts.length });
      attrLines.push(`${groupName}：${opts.slice(0, 10).join(" / ")}${opts.length > 10 ? ` 等 ${opts.length} 款` : ""}`);
    }
  }

  const out = {
    goodsId: gid,
    name: formatShopTitle(String(d.name || "")),
    gallery,
    specs: attrLines,
    attrGroups,
    notices: Array.isArray(json?.data?.notices)
      ? json.data.notices
          .map((n) => stripHtml(String(n.content || n.title || "")))
          .filter(Boolean)
          .slice(0, 3)
      : [],
  };

  cache.merchDetailCache.set(gid, { at: Date.now(), data: out });
  if (cache.merchDetailCache.size > 120) {
    const firstKey = cache.merchDetailCache.keys().next().value;
    cache.merchDetailCache.delete(firstKey);
  }
  return out;
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
runLiveEventsSync();
runPeriodicMerchCheck();
setInterval(runLiveSync, SYNC_INTERVAL_MS);
setInterval(runLiveEventsSync, MERCH_CHECK_INTERVAL_MS);
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
      pushedEventsCount: cache.pushedEvents.length + cache.liveEvents.length,
      pushedMerchCount: cache.pushedMerch.length + cache.liveMerch.length + cache.mihoyogiftCatalog.length,
      liveEventsCount: cache.liveEvents.length,
      liveMerchCount: cache.liveMerch.length + cache.mihoyogiftCatalog.length,
      mihoyogiftTotal: cache.mihoyogiftTotal,
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
    const refresh = url.searchParams.get("refresh") === "1";
    if (refresh) await runLiveEventsSync();
    return sendJson(res, 200, {
      ok: true,
      liveEvents: cache.liveEvents,
      pushedEvents: [...cache.pushedEvents, ...cache.liveEvents],
      updatedAt: cache.eventsCheckedAt || cache.fetchedAt || new Date().toISOString(),
    });
  }

  if (pathname === "/api/v1/merch/detail") {
    const goodsId = url.searchParams.get("goods_id") || "";
    try {
      const detail = await fetchMiHoYoGiftDetail(goodsId);
      return sendJson(res, 200, { ok: true, ...detail });
    } catch (err) {
      return sendJson(res, 502, { ok: false, error: err.message });
    }
  }

  if (pathname === "/api/v1/merch") {
    const refresh = url.searchParams.get("refresh") === "1";
    if (refresh || cache.merchCheckRuns === 0 || cache.mihoyogiftCatalog.length === 0) {
      await runPeriodicMerchCheck();
    }
    const mergedMerch = [...cache.pushedMerch, ...cache.liveMerch, ...cache.mihoyogiftCatalog];
    return sendJson(res, 200, {
      ok: true,
      lastCheckedAt: cache.merchCheckedAt,
      checkIntervalMin: Math.round(MERCH_CHECK_INTERVAL_MS / 60000),
      mihoyogiftTotal: cache.mihoyogiftTotal,
      liveMerchCount: mergedMerch.length,
      liveMerch: cache.liveMerch,
      pushedMerch: mergedMerch,
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
