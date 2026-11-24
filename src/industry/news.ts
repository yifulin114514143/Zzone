import officialSnapshot from "./officialSnapshot.json";
import type { NewsCategory, NewsItem } from "./types";

export interface RawOfficialArticle {
  infoId: string;
  channelId: string;
  title: string;
  publishedAt: string;
  coverUrl?: string;
  officialUrl: string;
  excerpt: string;
  bodyText: string;
}

function classifyArticle(title: string, body: string): NewsCategory {
  const hay = `${title} ${body}`;
  if (/联动|星穹铁道|知更鸟|卡芙卡|帕姆/.test(hay)) return "collab";
  if (/限时频段|调频统计|调频/.test(title)) return "banner";
  if (/福利速递|兑换码/.test(hay)) return "code";
  if (/活动说明|有奖活动|数据悬赏|从天降|漂流画集|奇踪记|先遣赏金/.test(title)) return "event";
  if (/生日快乐|时装展示|代理人机制|未归档影像/.test(title)) return "agent";
  if (/壁纸|纪念回顾|影像档案|PV|EP/.test(title)) return "media";
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
  if (/双倍奖励/.test(body)) points.push("实战模拟室每日 5 张怪物卡触发双倍掉落");
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
    "167413": { deadlineAt: "2026-11-30T03:59:00+08:00", deadlineLabel: "双倍截止" },
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

  const highImpact = /3\.4|长日终尽|知更鸟|调频统计|数据悬赏|限时频段|新世界前夜|FES|雅迪|肯德基/.test(
    raw.title
  );
  const baseHeat = highImpact ? 92 - Math.min(idx, 10) : 76 - Math.min(idx, 16);

  const tags: string[] = ["官方一手"];
  if (/3\.4/.test(raw.title + raw.excerpt)) tags.push("3.4长日终尽");
  if (/3\.3/.test(raw.title + raw.excerpt)) tags.push("3.3版本");
  if (/赛维里安/.test(raw.title)) tags.push("赛维里安");
  if (/知更鸟|卡芙卡|联动/.test(raw.bodyText)) tags.push("星铁联动");
  if (/双倍/.test(raw.bodyText)) tags.push("双倍产出");
  if (/FES|LIVE|雅迪|肯德基/.test(raw.title)) tags.push("大型活动");

  const summarySource = raw.excerpt || raw.bodyText || raw.title;
  const cleanSummary = summarySource
    .replace(/【[^】]+】/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);

  const isCn = raw.infoId.startsWith("cn-") || raw.officialUrl.includes("zzz.mihoyo.com");

  return {
    id: `official-${raw.infoId}`,
    title: raw.title,
    summary: cleanSummary || raw.title,
    body: raw.bodyText || raw.excerpt || raw.title,
    takeaways,
    category,
    tags: tags.slice(0, 4),
    source: isCn ? "绝区零中国官网" : "HoYoverse 国际官网",
    sourcePlatform: isCn ? "zzz-cn" : "hoyoverse",
    sourceTier: "official",
    sourceCount: highImpact ? 12 + (idx % 7) : 3 + (idx % 5),
    publishedAt: raw.publishedAt,
    heat: Math.max(54, Math.min(98, baseHeat)),
    isPick: highImpact || idx < 6,
    isLiveOfficial: true,
    coverUrl: raw.coverUrl || undefined,
    originalUrl: raw.officialUrl,
    deadlineAt,
    deadlineLabel,
  };
}

/**
 * Multi-platform community intelligence entries (米游社 / B站 / NGA / X)
 */
const COMMUNITY_INTEL: NewsItem[] = [
  {
    id: "comm-v34-poly-calc",
    title: "3.4 版本「长日终尽」全版本可领菲林统计：零氪约 118 抽，外加免费 S 级「知更鸟」",
    summary:
      "综合前瞻福利速递、预约活动 160 菲林、版本签到 1840 菲林 + 10 加密母带、版本活动与两期式舆/危局，社区汇总 3.4 零氪玩家可获超 110 抽，小月卡约 146 抽。",
    body: "根据 11月20日 3.4 前瞻节目披露的全部福利与常规玩法周期，社区公开福利汇总如下：\n\n• 登录即领：联动限定 S 级代理人「知更鸟」+ 推荐主属性定制驱动盘一套\n• 签到与预约：网页预约 160 菲林 + 决战于黎明之前 7 日签到 480 菲林 + 版本累计签到 1840 菲林 + 加密母带 ×10 + 邦布券 ×10\n• 玩法与深渊：主线终章 + 戏梦不知归处（免费领邦布「帕姆」）+ 式舆防卫战 & 危局强袭战周期结算\n• 卡池排期：12月2日开启上半首位结使虚狩「挽昼」，1月1日开启下半联动「卡芙卡」。",
    takeaways: [
      "零氪预计 ~118 抽，小月卡 ~146 抽",
      "知更鸟登录即送且附带定制驱动盘",
    ],
    category: "code",
    tags: ["3.4长日终尽", "福利汇总", "知更鸟"],
    source: "米游社 · 绝区零社区",
    sourcePlatform: "miyoushe",
    sourceTier: "community",
    sourceCount: 27,
    publishedAt: "2026-11-23T09:45:00+08:00",
    heat: 93,
    isPick: true,
    originalUrl: "https://zenless.hoyoverse.com/zh-cn/news/167400",
  },
  {
    id: "comm-sunbringer-kit",
    title: "虚狩「挽昼」全新定位「结使」机制前瞻解析：双轨共鸣与终结技演出逐帧拆解",
    summary:
      "3.4 前瞻放出的实机片段中，首位结使代理人「挽昼」展现了迥异于传统强攻/异常的联动能量条与领域展开视觉效果，海外 X 与国内社区展开热烈机制解析。",
    body: "作为《绝区零》继星见雅之后又一位虚狩级重量角色，3.4「长日终尽」登场的「挽昼」带来了全新特性「结使」。\n\n从前瞻实机画面可见，挽昼在场时会在敌方脚下展开光环刻度，配合队友受击弹反或连携技可快速叠层并触发高倍率斩击。具体倍率与配队生态将在 12 月 2 日开服前夕的官方机制介绍篇揭晓。",
    takeaways: [
      "全新特性「结使」首次实装，联动全队连携与弹反机制",
      "3.4 上半 12/02 正式登场",
    ],
    category: "agent",
    tags: ["挽昼", "虚狩", "结使机制"],
    source: "X @ZZZ_EN · 资讯速译",
    sourcePlatform: "x",
    sourceTier: "media",
    sourceCount: 22,
    publishedAt: "2026-11-21T20:15:00+08:00",
    heat: 91,
    isPick: true,
    originalUrl: "https://zenless.hoyoverse.com/zh-cn/news/167399",
  },
  {
    id: "comm-severian-guide",
    title: "赛维里安 0+0 vs 0+1 实测汇总：3.3 下期风系强攻定位与 3.4 抽卡取舍参考",
    summary:
      "3.3 下期卡池即将于 12月1日 结束。B站多家测评组测试显示赛维里安在 0+1 配置下失衡期爆发极强，专武「禁罪囚笼」对比常驻提升约 21%。",
    body: "Bilibili 与米游社多家战斗测评组发布 3.3 下期赛维里安终版评价：\n\n1. 核心机制：高频风属性切入与失衡期爆发兼具，与诺姆/耀嘉音组队手感流畅。\n2. 音擎差距：专武「禁罪囚笼」对比常驻 S 级强攻音擎约有 18%~22% 伤害优势。\n3. 卡池节点：3.3 下期调频将于 12月1日 14:59 结束，次日上线 3.4 新版本「长日终尽」。",
    takeaways: [
      "3.3 下期卡池将于 12/01 14:59 结束",
      "专武对比常驻 S 音擎提升约 21%",
    ],
    category: "guide",
    tags: ["赛维里安", "B站评测", "3.3卡池"],
    source: "Bilibili 绝区零专区",
    sourcePlatform: "bilibili",
    sourceTier: "media",
    sourceCount: 15,
    publishedAt: "2026-11-22T19:30:00+08:00",
    heat: 84,
    isPick: true,
    originalUrl: "https://zenless.hoyoverse.com/zh-cn/news/167269",
    deadlineAt: "2026-12-01T14:59:00+08:00",
    deadlineLabel: "卡池结束",
  },
];

export const OFFICIAL_SNAPSHOT_META = {
  fetchedAt: officialSnapshot.fetchedAt,
  totalAvailable: officialSnapshot.totalAvailable,
  source: officialSnapshot.source,
};

export function buildUnifiedNewsList(
  officialItems: RawOfficialArticle[] = officialSnapshot.items as RawOfficialArticle[]
): NewsItem[] {
  const normalizedOfficial = officialItems.map((item, idx) =>
    normalizeOfficialArticle(item, idx)
  );
  const seen = new Set<string>();
  const merged: NewsItem[] = [];
  for (const item of [...COMMUNITY_INTEL, ...normalizedOfficial]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export const INITIAL_NEWS: NewsItem[] = buildUnifiedNewsList();
