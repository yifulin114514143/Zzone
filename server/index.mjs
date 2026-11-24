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
import { AccountPoolManager } from "./pool.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");
const SNAPSHOT_PATH = path.join(ROOT, "src/industry/officialSnapshot.json");
const POOL_PATH = path.join(__dirname, "pool.json");
const DATA_DIR = path.join(__dirname, "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const INGEST_TOKEN = process.env.INGEST_TOKEN || "";
const SYNC_INTERVAL_MS = Number(process.env.SYNC_INTERVAL_MS || 15 * 60 * 1000);
const MERCH_CHECK_INTERVAL_MS = Number(process.env.MERCH_CHECK_INTERVAL_MS || 30 * 60 * 1000);

const OFFICIAL_GLOBAL_API_URL =
  "https://sg-public-api-static.hoyoverse.com/content_v2_user/app/3e9196a4b9274bd7/getContentList?iPageSize=24&iPage=1&sLangKey=zh-cn&iChanId=288";
const OFFICIAL_CN_API_URL =
  "https://api-takumi-static.mihoyo.com/content_v2_user/app/706fd13a87294881/getContentList?iPageSize=20&iPage=1&sLangKey=zh-cn&iChanId=273";

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

const cache = {
  fetchedAt: null,
  merchCheckedAt: new Date().toISOString(),
  totalAvailable: 0,
  source: "HoYoverse Official Content-V2 (zh-cn)",
  officialItems: [],
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

async function runLiveSync() {
  try {
    const headers = { "User-Agent": "Mozilla/5.0 Zzone-Official-Collector/2.0" };
    const [globalRes, cnRes] = await Promise.allSettled([
      fetch(OFFICIAL_GLOBAL_API_URL, { headers }),
      fetch(OFFICIAL_CN_API_URL, { headers }),
    ]);

    const merged = [];
    const seenTitle = new Set();

    const ingestList = (list, isCn) => {
      for (const raw of list || []) {
        const title = String(raw.sTitle || "").trim();
        if (!title || title === "调频概率公示一览") continue;
        const normKey = title.replace(/\s+/g, "").toLowerCase();
        if (seenTitle.has(normKey)) continue;
        seenTitle.add(normKey);
        const plain = stripHtml(raw.sContent || raw.sIntro || "");
        merged.push({
          infoId: `${isCn ? "cn-" : ""}${raw.iInfoId}`,
          channelId: String((raw.sChanId && raw.sChanId[0]) || "295"),
          title,
          publishedAt: String(raw.dtStartTime || "").replace(" ", "T") + "+08:00",
          coverUrl: extractCover(raw.sExt),
          officialUrl: isCn
            ? `https://zzz.mihoyo.com/news/${raw.iInfoId}`
            : `https://zenless.hoyoverse.com/zh-cn/news/${raw.iInfoId}`,
          excerpt: plain.slice(0, 220),
          bodyText: plain.slice(0, 2200),
        });
      }
    };

    if (cnRes.status === "fulfilled" && cnRes.value.ok) {
      const cnJson = await cnRes.value.json();
      ingestList(cnJson?.data?.list, true);
      cache.totalAvailable = Math.max(cache.totalAvailable, cnJson?.data?.iTotal || 0);
    }

    if (globalRes.status === "fulfilled" && globalRes.value.ok) {
      const glJson = await globalRes.value.json();
      ingestList(glJson?.data?.list, false);
      cache.totalAvailable = Math.max(cache.totalAvailable, glJson?.data?.iTotal || 0);
    }

    if (merged.length > 0) {
      merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      cache.officialItems = merged.slice(0, 36);
      cache.fetchedAt = new Date().toISOString();
      cache.syncRuns += 1;
      cache.lastError = null;
      console.log(
        `[Zzone Collector] Dual-synced ${cache.officialItems.length} live CN+Global official ZZZ items at ${cache.fetchedAt}`
      );
    }
  } catch (err) {
    cache.lastError = err.message;
    console.warn("[Zzone Collector] Live sync error (serving cached snapshot):", err.message);
  }
  return cache;
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
    });
  }

  if (pathname === "/api/v1/news") {
    return sendJson(res, 200, {
      fetchedAt: cache.fetchedAt,
      totalAvailable: cache.totalAvailable,
      source: cache.source,
      officialItems: [...cache.pushedItems, ...cache.officialItems],
      pool: pool.getSummary(),
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
    await runLiveSync();
    return sendJson(res, 200, {
      ok: true,
      fetchedAt: cache.fetchedAt,
      officialItems: [...cache.pushedItems, ...cache.officialItems],
      pool: pool.getSummary(),
    });
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
      return sendJson(res, 200, { ok: true, pool: pool.reload() });
    }
    return sendJson(res, 200, { ok: true, pool: pool.getSummary() });
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
