import officialSnapshot from "./officialSnapshot.json";
import type { NewsCategory, NewsItem, SourcePlatformKey } from "./types";

export interface RawOfficialArticle {
  infoId: string;
  channelId: string;
  title: string;
  publishedAt: string;
  coverUrl?: string;
  gallery?: string[];
  officialUrl: string;
  sourcePlatform?: SourcePlatformKey;
  sourceName?: string;
  excerpt: string;
  bodyText: string;
  aiSummary?: string;
  aiCategory?: NewsCategory;
  aiTags?: string[];
  aiTakeaways?: string[];
}

/**
 * Filter out per-version routine filler announcements (double drops, recurring check-ins,
 * routine shop packs, device compatibility notices, probability tables) so the feed only
 * highlights genuinely important updates, events, collabs, new agents, and merch drops.
 */
const ROUTINE_FILLER_RX =
  /数据悬赏|先遣赏金|嗯呢[」』]?\s*从天降|全新放送|「商城」上新|商城上新说明|调频概率公示|机型[的]?适配说明|放送倒计时\s*\d+\s*小时|前瞻特别节目预告|【已开奖】|\[已開獎\]|データ懸賞|先遣賞金|んナ.*降る|新着放送|「ショップ」.*更新|ショップ.*新商品|変調確率|機種.*対応|確率詳細|予告番組のお知らせ|【当選発表】|데이터 현상금|선발 현상금|응나.*선물|신규 방송|「상점」.*신규|상점.*업데이트|변조 확률|기기.*최적화|특별 방송 예고|\[당첨자 발표\]|Data Bounty|Advanced Bounty|En-Nah Into Your Lap|All-New Program|Store.*New|Signal Search Probability|Compatibility Notice|Device Optimization|Special Program Announcement|Countdown.*1\s*Hour|Winners Announced/i;

export function isRoutineOfficialFiller(title: string): boolean {
  return ROUTINE_FILLER_RX.test(title);
}

function extractCoverHash(url?: string): string {
  if (!url) return "";
  const file = url.split("?")[0].split("/").pop() || "";
  const m = file.match(/^([a-f0-9]{24,40})_/i);
  return m ? m[1].toLowerCase() : file.toLowerCase();
}

function buildFrontendDedupeKeys(title: string, coverUrl?: string): string[] {
  const keys: string[] = [];
  const stripped = title
    .replace(/【[^】]*(有奖活动|活动|已开奖|米游币兑换中心|イベント|当選発表)[^】]*】/gi, "")
    .replace(/\[[^\]]*(Prize Event|Event|Winners Announced|보상 이벤트|당첨자 발표)[^\]]*\]/gi, "")
    .replace(/《绝区零》|『ゼンレスゾーンゼロ』|〈젠레스 존 제로〉|Zenless Zone Zero/gi, "")
    .replace(/[《》「」『』【】〈〉丨|\s!！?？·.,，。:：\-—🎁📌📸☆&＆"'()（）]/g, "")
    .toLowerCase();
  if (stripped) keys.push(`txt:${stripped}`);

  const isV34 = /3\.4|长日终尽|ついには長き|긴 나날의 끝자락|Finality of the Day/i.test(title);
  if (isV34) {
    if (/情报总览|情報まとめ|정보 일람|Intel Report/i.test(title)) keys.push("topic:v34-intel-overview");
    else if (/福利速递|特典速報|혜택 속보|Benefits Express/i.test(title)) keys.push("topic:v34-benefits");
    else if (/讨论活动|ディスカッション|토론 이벤트|Discussion Event/i.test(title)) keys.push("topic:v34-discuss");
    else if (/创作者|クリエイター|크리에이터|Creator/i.test(title)) keys.push("topic:v34-creator");
    else if (/\bPV\b/i.test(title)) keys.push("topic:v34-pv");
    else if (/前瞻特别节目|予告番組|특별 방송|Special Program/i.test(title)) keys.push("topic:v34-livestream");
  }

  if (/调频统计工具|変調統計ツール|변조 통계 도구|Signal Search Statistical Tool/i.test(title)) {
    keys.push("topic:signal-stat-tool");
  }
  if (/米游币兑换中心/.test(title)) {
    keys.push("topic:miyoushe-coin-exchange");
  }
  if (/决战于黎明之前|夜明け前、決戦へ|여명 전의 결전|Final Battle Before Dawn/i.test(title) && !/薪火之影|长明之影/.test(title)) {
    keys.push("topic:dawn-battle-main");
  }

  const hash = extractCoverHash(coverUrl);
  if (hash) keys.push(`img:${hash}`);
  return keys;
}

function classifyArticle(title: string, body: string): NewsCategory {
  const hay = `${title} ${body}`;
  if (/联动|星穹铁道|知更鸟|卡芙卡|帕姆|雅迪|肯德基|コラボ|スターレイル|ロビン|カフカ|콜라보|스타레일|로빈|카프카|Crossover|Collab|Star Rail|Robin|Kafka/i.test(hay))
    return "collab";
  if (/限时频段|调频统计|调频|変調|변조|Signal Search/i.test(title)) return "banner";
  if (/福利速递|兑换码|特典速報|혜택 속보|Benefits Express|Redemption/i.test(hay)) return "code";
  if (/活动说明|有奖活动|漂流画集|奇踪记|FES|LIVE|嘉年华|快闪|イベント|이벤트|Event|Contest/i.test(title))
    return "event";
  if (/生日快乐|时装展示|代理人机制|未归档影像|ハッピーバースデー|コスチューム|エージェント|생일 축하|코스튬|에이전트|Birthday|Outfit|Agent Mechanics/i.test(title))
    return "agent";
  if (/壁纸|纪念回顾|影像档案|PV|EP|壁紙|振り返り映像|アーカイブ|배경화면|회고 영상|Wallpaper|Retrospective|Video Archive/i.test(title))
    return "media";
  return "patch";
}

function buildTakeaways(title: string, body: string): string[] {
  const points: string[] = [];
  const timeMatch = body.match(/202\d\/\d{1,2}\/\d{1,2}[^。\n]{0,42}/);
  if (timeMatch) points.push(`时间节点：${timeMatch[0].trim()}`);

  if (/知更鸟/.test(body)) points.push("登录即领联动 S 级限定代理人「知更鸟」及定制驱动盘");
  if (/挽昼/.test(body)) points.push("3.4 首位结使系虚狩「挽昼」定档 12月2日");
  if (/卡芙卡/.test(body)) points.push("1月1日后星铁联动「卡芙卡」加入限时调频");
  if (/菲林/.test(body) && !points.some((p) => p.includes("菲林"))) {
    const poly = body.match(/菲林[×x*]\d+|\d+菲林/g);
    if (poly) points.push(`核心福利：${[...new Set(poly)].slice(0, 3).join(" / ")}`);
  }
  if (/1350菲林底片/.test(body)) points.push("限时折扣 1350 菲林底片（原价 1680）");
  if (/调频统计工具/.test(title)) points.push("官方网页 & HoYoLAB 免抓包直查调频历史");

  if (points.length === 0) {
    const clean = body.replace(/\s+/g, " ").trim();
    if (clean.length > 10) {
      points.push(clean.slice(0, 48) + (clean.length > 48 ? "…" : ""));
    }
  }
  return points.slice(0, 3);
}

function bindDeadline(infoId: string): { deadlineAt?: string; deadlineLabel?: string } {
  const map: Record<string, { deadlineAt: string; deadlineLabel: string }> = {
    "167400": { deadlineAt: "2026-12-02T11:00:00+08:00", deadlineLabel: "3.4 上线" },
    "167395": { deadlineAt: "2026-12-02T05:59:00+08:00", deadlineLabel: "预约截止" },
    "167283": { deadlineAt: "2026-11-30T03:59:00+08:00", deadlineLabel: "活动截止" },
    "167269": { deadlineAt: "2026-12-01T14:59:00+08:00", deadlineLabel: "卡池结束" },
    "167272": { deadlineAt: "2026-12-02T05:59:00+08:00", deadlineLabel: "折扣截止" },
  };
  return map[infoId] ?? {};
}

export function normalizeOfficialArticle(raw: RawOfficialArticle, idx = 0): NewsItem {
  const category = classifyArticle(raw.title, raw.bodyText);
  const takeaways = buildTakeaways(raw.title, raw.bodyText);
  const { deadlineAt, deadlineLabel } = bindDeadline(raw.infoId);

  const highImpact = /3\.4|长日终尽|知更鸟|调频统计|限时频段|新世界前夜|FES|LIVE|雅迪|肯德基/.test(
    raw.title
  );
  const baseHeat = highImpact ? 92 - Math.min(idx, 10) : 76 - Math.min(idx, 16);

  const tags: string[] = ["官方一手"];
  if (/3\.4/.test(raw.title + raw.excerpt)) tags.push("3.4长日终尽");
  if (/3\.3/.test(raw.title + raw.excerpt)) tags.push("3.3版本");
  if (/赛维里安/.test(raw.title)) tags.push("赛维里安");
  if (/知更鸟|卡芙卡|联动/.test(raw.bodyText)) tags.push("星铁联动");
  if (/FES|LIVE|雅迪|肯德基/.test(raw.title)) tags.push("大型活动");

  const summarySource = raw.excerpt || raw.bodyText || raw.title;
  const cleanSummary = summarySource
    .replace(/【[^】]+】/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);

  const inferredPlatform: SourcePlatformKey =
    raw.sourcePlatform ||
    (raw.infoId.startsWith("miyoushe-") || raw.officialUrl.includes("miyoushe.com")
      ? "miyoushe"
      : raw.infoId.startsWith("hoyolab-") || raw.officialUrl.includes("hoyolab.com")
      ? "hoyolab"
      : raw.infoId.startsWith("jp-") || raw.officialUrl.includes("/ja-jp/")
      ? "zzz-jp"
      : raw.infoId.startsWith("cn-") || raw.officialUrl.includes("zzz.mihoyo.com")
      ? "zzz-cn"
      : "hoyoverse");

  const inferredSourceName =
    raw.sourceName ||
    (inferredPlatform === "miyoushe"
      ? "米游社绝区零官方"
      : inferredPlatform === "hoyolab"
      ? "HoYoLAB 官方社区"
      : inferredPlatform === "zzz-jp"
      ? "绝区零日服官网 · 日本专属"
      : inferredPlatform === "zzz-cn"
      ? "绝区零中国官网"
      : "HoYoverse 国际官网");

  return {
    id: `official-${raw.infoId}`,
    title: raw.title,
    summary: raw.aiSummary || cleanSummary || raw.title,
    body: raw.bodyText || raw.excerpt || raw.title,
    takeaways: raw.aiTakeaways && raw.aiTakeaways.length > 0 ? raw.aiTakeaways : takeaways,
    category: raw.aiCategory || category,
    tags: raw.aiTags && raw.aiTags.length > 0 ? raw.aiTags.slice(0, 4) : tags.slice(0, 4),
    source: inferredSourceName,
    sourcePlatform: inferredPlatform,
    sourceTier: "official",
    sourceCount: highImpact ? 12 + (idx % 7) : 3 + (idx % 5),
    publishedAt: raw.publishedAt,
    heat: Math.max(54, Math.min(98, baseHeat)),
    isPick: highImpact || idx < 6,
    isLiveOfficial: true,
    coverUrl: raw.coverUrl || undefined,
    gallery: raw.gallery && raw.gallery.length > 0 ? raw.gallery : undefined,
    originalUrl: raw.officialUrl,
    deadlineAt,
    deadlineLabel,
  };
}

export const OFFICIAL_SNAPSHOT_META = {
  fetchedAt: officialSnapshot.fetchedAt,
  totalAvailable: officialSnapshot.totalAvailable,
  source: officialSnapshot.source,
};

export function buildUnifiedNewsList(
  officialItems: RawOfficialArticle[] = officialSnapshot.items as RawOfficialArticle[]
): NewsItem[] {
  const filteredRaw = officialItems.filter(
    (item) => !isRoutineOfficialFiller(item.title)
  );
  const normalizedOfficial = filteredRaw.map((item, idx) =>
    normalizeOfficialArticle(item, idx)
  );
  const seenIds = new Set<string>();
  const keyMap = new Map<string, NewsItem>();
  const merged: NewsItem[] = [];

  for (const item of normalizedOfficial) {
    if (seenIds.has(item.id)) continue;
    seenIds.add(item.id);

    const keys = buildFrontendDedupeKeys(item.title, item.coverUrl);
    let duplicateOf: NewsItem | undefined;
    for (const k of keys) {
      if (keyMap.has(k)) {
        duplicateOf = keyMap.get(k);
        break;
      }
    }

    if (duplicateOf) {
      // Combine unique gallery images into primary entry and boost sourceCount
      const extraGallery = [...new Set([...(duplicateOf.gallery || []), ...(item.gallery || [])])].slice(0, 14);
      if (extraGallery.length > (duplicateOf.gallery || []).length) {
        duplicateOf.gallery = extraGallery;
      }
      duplicateOf.sourceCount = Math.min(35, duplicateOf.sourceCount + 1);
      continue;
    }

    for (const k of keys) keyMap.set(k, item);
    merged.push(item);
  }
  return merged.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export const INITIAL_NEWS: NewsItem[] = buildUnifiedNewsList();
