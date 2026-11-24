import type { NewsCategory, SourcePlatformKey } from "./types";

export const SITE = {
  name: "Zzone",
  version: "v3.0",
  enName: "ZZONE · NEW ERIDU",
  domain: "zzone.app",
  tagline: "绝区零全生态实时情报 · 线下活动 · 官方周边定期追踪",
  description:
    "实时聚合《绝区零》国服官网、HoYoverse 国际/日服官网、米游社官方、HoYoLAB 官方社区，并预留 X、B站、微博、APEX-TOYS、Hpoi、CPP 与会员购多渠道号池接入。",
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
  /* ---- Tier 1: 5 Live Direct Official APIs (Zero Account Pool Needed!) ---- */
  {
    id: "zzz-cn-official",
    name: "绝区零中国官网 (zzz.mihoyo.com)",
    handle: "api-takumi-static · Content-V2",
    platform: "zzz-cn",
    url: "https://zzz.mihoyo.com/news",
    mode: "live",
    interval: "每 15 分钟自动抓取",
    desc: "直连国服官网，实时同步版本公告、杭州 FES/ZLIVE、雅迪/KFC 联动与米游铺「新品情报」多图长图。",
  },
  {
    id: "hoyoverse-global",
    name: "HoYoverse 国际官网 (zenless.hoyoverse.com)",
    handle: "sg-public-api-static · zh-cn",
    platform: "hoyoverse",
    url: "https://zenless.hoyoverse.com/zh-cn/news",
    mode: "live",
    interval: "每 15 分钟自动抓取",
    desc: "直连国际服简体中文官网通道，与国服双向去重互补，同步海外与全球官宣。",
  },
  {
    id: "miyoushe-official",
    name: "米游社绝区零官方（活动 & 资讯）",
    handle: "bbs-api-static · gids=8 (免号池直连)",
    platform: "miyoushe",
    url: "https://www.miyoushe.com/zzz/",
    mode: "live",
    interval: "每 15 分钟自动抓取（自带多图画廊）",
    desc: "免登录直连米游社官方活动/资讯接口，独家捕获米游币周边上新、会员册抽奖、同人征集与多张官方原图。",
  },
  {
    id: "hoyolab-official",
    name: "HoYoLAB 绝区零中文官方社区",
    handle: "bbs-api-os · gids=8 · zh-cn",
    platform: "hoyolab",
    url: "https://www.hoyolab.com/circles/8/47/official",
    mode: "live",
    interval: "每 15 分钟自动抓取",
    desc: "免登录直连国际服官方社区，捕获海外专属活动、实物周边抽奖与创作者征集活动。",
  },
  {
    id: "hoyoverse-jp",
    name: "HoYoverse 日服官网（日本专属监测）",
    handle: "sg-public-api-static · ja-jp 差量捕获",
    platform: "zzz-jp",
    url: "https://zenless.hoyoverse.com/ja-jp/news",
    mode: "live",
    interval: "每 15 分钟自动差量比对",
    desc: "自动过滤全球同步多语言公告，仅捕获日本地区独有的东京 Live、秋叶原/涩谷快闪与日区品牌联动。",
  },

  /* ---- Tier 2: RSS / Overseas Free Feeds ---- */
  {
    id: "youtube-official",
    name: "YouTube 官方频道 (@ZZZ_Official / @ZZZ_JP)",
    handle: "Native YouTube Atom RSS",
    platform: "youtube",
    url: "https://www.youtube.com/@ZZZ_Official",
    mode: "rss",
    interval: "部署海外云后每 15 分钟直连",
    desc: "通过 YouTube 原生免费 RSS 同步角色 PV、EP 单曲、前瞻特别节目与海外活动宣传片。",
  },
  {
    id: "hpoi-figures",
    name: "Hpoi 手办维基 · 绝区零手办档案",
    handle: "hpoi.net · 开订 / 截单 / 出货",
    platform: "hpoi",
    url: "https://www.hpoi.net/",
    mode: "rss",
    interval: "每 30 分钟增量监测",
    desc: "专门追踪绝区零全系列比例手办与粘土人的开订、截单、延期、补款与出货时间节点。",
  },

  /* ---- Tier 3: Account-Pool / Vertical Event & Merch Channels ---- */
  {
    id: "weibo-official",
    name: "微博 @绝区零 & @米游铺",
    handle: "Weibo Official Matrix",
    platform: "weibo",
    url: "https://weibo.com/",
    mode: "pool-ready",
    interval: "接入微博号池后每 3 分钟轮询",
    desc: "国内跨界联名（KFC/雅迪等）、场贩实拍、手办首发图与抽奖福利更新最快的一手阵地。",
  },
  {
    id: "x-zzz-official",
    name: "X / Twitter 绝区零官方矩阵",
    handle: "@ZZZ_EN · @ZZZ_JP · @ZZZ_CHT",
    platform: "x",
    url: "https://x.com/ZZZ_EN",
    mode: "pool-ready",
    interval: "接入 X 号池后每 3 分钟轮询",
    desc: "监控英/日/繁中 X 官方账号，抢先抓取海外快闪、东京演唱会与海外联动官宣。",
  },
  {
    id: "bilibili-official",
    name: "Bilibili 绝区零官方动态 & 视频",
    handle: "UID 1636034895 · @绝区零",
    platform: "bilibili",
    url: "https://space.bilibili.com/1636034895",
    mode: "pool-ready",
    interval: "接入 B站号池后每 5 分钟轮询",
    desc: "同步 B站官方动态、PV / EP 首发以及国服线下直播活动通知。",
  },
  {
    id: "apex-gsc-makers",
    name: "APEX-TOYS & Good Smile (GSC) 手办合作官厂",
    handle: "1/7 比例手办 · 粘土人首发厂",
    platform: "apex",
    url: "https://www.mihoyogift.com/",
    mode: "pool-ready",
    interval: "接入号池后每日定时监测",
    desc: "紧盯米哈游主力合作手办厂动态，第一时间获取绝区零手办灰模展示、上色官图与预售情报。",
  },
  {
    id: "tmall-douyin-shops",
    name: "天猫三Z官方旗舰店 & 抖音周边旗舰店",
    handle: "米游铺 · 三Z STUDIO · 抖音店",
    platform: "tmall",
    url: "https://www.mihoyogift.com/",
    mode: "pool-ready",
    interval: "每 30 分钟巡检上新与库存",
    desc: "配合国服「新品情报」追踪日常突击上新周边、预售截单与补款通知。",
  },
  {
    id: "cpp-allcpp",
    name: "CPP 无差别同人站 · 绝区零同人展",
    handle: "allcpp.cn · 全国同人 Only",
    platform: "cpp",
    url: "https://www.allcpp.cn/",
    mode: "pool-ready",
    interval: "每日定时巡检同人排期",
    desc: "自动发现全国各地绝区零非官方同人 Only 展、茶话会与同人 Live 演出排期。",
  },
  {
    id: "ticket-show-damai",
    name: "B站会员购漫展 & 大麦网演出票务",
    handle: "show.bilibili.com · 大麦",
    platform: "ticket",
    url: "https://show.bilibili.com/",
    mode: "pool-ready",
    interval: "大型活动期间高频监测开票",
    desc: "实时盯防杭州 FES、ZLIVE 专场演唱会与城市快闪的开票、二开及回流票通知。",
  },
  {
    id: "xhs-taptap",
    name: "小红书 & TapTap 绝区零专区",
    handle: "线下打卡实拍 · 平台专属兑换码",
    platform: "xhs",
    url: "https://www.taptap.cn/",
    mode: "pool-ready",
    interval: "接入号池后定时抓取",
    desc: "汇总城市快闪实拍、周边开箱与 TapTap 平台专属签到福利/额外兑换码。",
  },
];
