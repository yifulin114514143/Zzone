import type { NewsCategory, SourcePlatformKey } from "./types";

export const SITE = {
  name: "Zzone",
  version: "v1.0",
  enName: "ZZONE · NEW ERIDU",
  domain: "zzone.app",
  tagline: "绝区零全生态实时情报 · 线下活动 · 官方周边定期追踪",
  description:
    "实时聚合《绝区零》中国官网、HoYoverse 国际官网、X 官方、B站官方、米游社/米游铺等多信源，覆盖新版本、杭州 FES & ZLIVE、最新联动与官方周边多图上新。",
};

export const CATEGORY_META: Record<
  NewsCategory,
  { label: string; stamp: string; color: string; short: string }
> = {
  banner: { label: "卡池与调频", stamp: "BANNER", color: "#ff4f17", short: "调频" },
  event: { label: "限时活动", stamp: "EVENT", color: "#f5b73b", short: "活动" },
  agent: { label: "代理人情报", stamp: "AGENT", color: "#ff8c38", short: "代理人" },
  patch: { label: "版本与公告", stamp: "PATCH", color: "#38bdf8", short: "公告" },
  collab: { label: "联动与跨界", stamp: "COLLAB", color: "#a78bfa", short: "联动" },
  media: { label: "影像与音乐", stamp: "MEDIA", color: "#fb7185", short: "影像" },
  guide: { label: "攻略与评测", stamp: "GUIDE", color: "#60a5fa", short: "攻略" },
  code: { label: "福利与兑换码", stamp: "CODE", color: "#f59e0b", short: "福利" },
};

export interface CollectorSourceInfo {
  id: string;
  name: string;
  handle: string;
  platform: SourcePlatformKey;
  url: string;
  mode: "live" | "pool-ready" | "rss";
  interval: string;
  desc: string;
}

export const COLLECTOR_SOURCES: CollectorSourceInfo[] = [
  {
    id: "zzz-cn-official",
    name: "绝区零中国官方 (zzz.mihoyo.com)",
    handle: "api-takumi-static · Content-V2",
    platform: "zzz-cn",
    url: "https://zzz.mihoyo.com/news",
    mode: "live",
    interval: "每 15 分钟自动抓取（含新品周边 & FES）",
    desc: "直连绝区零国服官网内容库，实时捕获版本公告、杭州 FES/ZLIVE、雅迪/KFC等大型联动及米游铺「新品情报」多图画廊。",
  },
  {
    id: "hoyoverse-global",
    name: "HoYoverse 国际官方 (zenless.hoyoverse.com)",
    handle: "sg-public-api-static · zh-cn",
    platform: "hoyoverse",
    url: "https://zenless.hoyoverse.com/zh-cn/news",
    mode: "live",
    interval: "每 15 分钟自动抓取",
    desc: "直连国际服官网资讯通道，与国服官网双向去重互补，第一时间同步全球活动与海外资讯。",
  },
  {
    id: "x-zzz-official",
    name: "X / Twitter 绝区零官方矩阵",
    handle: "@ZZZ_EN · @ZZZ_JP · @ZZZ_CHT",
    platform: "x",
    url: "https://x.com/ZZZ_EN",
    mode: "pool-ready",
    interval: "接入 X 号池后每 3 分钟轮询",
    desc: "监控英/日/繁中三大 X 官方账号，实时抓取海外快闪、东京 Live 与海外官宣，自动汇总。",
  },
  {
    id: "bilibili-official",
    name: "Bilibili 绝区零官方 & 会员购演出",
    handle: "@绝区零 · B站动态与漫展购票",
    platform: "bilibili",
    url: "https://space.bilibili.com/1636034895",
    mode: "pool-ready",
    interval: "接入 B站号池后每 5 分钟轮询",
    desc: "同步 B站官方动态、角色 PV / EP 首发以及 FES & ZLIVE 会员购开票提醒。",
  },
  {
    id: "miyoushe-miyoupu",
    name: "米游社绝区零官方 & 米游铺商城",
    handle: "@绝区零 · forum_id=57 · 米游铺",
    platform: "miyoushe",
    url: "https://www.miyoushe.com/zzz/",
    mode: "pool-ready",
    interval: "接入米游社号池后每 5 分钟轮询",
    desc: "追踪米游社官方公告与米游铺版本同步/日常突击上新周边库存与价格变动。",
  },
  {
    id: "tmall-douyin-shops",
    name: "天猫三Z官方旗舰店 & 抖音周边旗舰店",
    handle: "绝区零三Z官方旗舰店 · 抖音周边店",
    platform: "tmall",
    url: "https://www.mihoyogift.com/",
    mode: "pool-ready",
    interval: "每 30 分钟定期巡检上新与截单",
    desc: "配合中国官网「新品情报」追踪手办预售截单、三Z STUDIO 服饰与跨界联名商品上新。",
  },
  {
    id: "nga-reddit-community",
    name: "NGA / Reddit / HoYoLAB 社区线索",
    handle: "NGA绝区零 · r/ZZZ_Official · HoYoLAB",
    platform: "hoyolab",
    url: "https://www.hoyolab.com/circles/8/47/official",
    mode: "rss",
    interval: "每 20 分钟增量拉取",
    desc: "聚合国内外核心社区的线下同人 Only 展线索与版本实测资讯。",
  },
];
