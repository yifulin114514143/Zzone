#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.resolve(__dirname, "../src/industry/officialSnapshot.json");
const API_URL =
  "https://sg-public-api-static.hoyoverse.com/content_v2_user/app/3e9196a4b9274bd7/getContentList?iPageSize=24&iPage=1&sLangKey=zh-cn&iChanId=288";

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

async function main() {
  console.log("Fetching live official ZZZ news from HoYoverse Content-V2 API...");
  const res = await fetch(API_URL, {
    headers: { "User-Agent": "Mozilla/5.0 Zlesszone-InterKnot-Hot/1.0" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  const list = json?.data?.list ?? [];
  const items = list.map((raw) => {
    const plain = stripHtml(raw.sContent || raw.sIntro || "");
    return {
      infoId: String(raw.iInfoId),
      channelId: String((raw.sChanId && raw.sChanId[0]) || "295"),
      title: String(raw.sTitle || "").trim(),
      publishedAt: String(raw.dtStartTime || "").replace(" ", "T") + "+08:00",
      coverUrl: extractCover(raw.sExt),
      officialUrl: `https://zenless.hoyoverse.com/zh-cn/news/${raw.iInfoId}`,
      excerpt: plain.slice(0, 220),
      bodyText: plain.slice(0, 2200),
    };
  });

  const payload = {
    fetchedAt: new Date().toISOString(),
    totalAvailable: json?.data?.iTotal ?? items.length,
    source: "HoYoverse Official Content-V2 (zh-cn)",
    items,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`Saved ${items.length} real official ZZZ articles to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error("Failed to sync official ZZZ news:", err);
  process.exit(1);
});
