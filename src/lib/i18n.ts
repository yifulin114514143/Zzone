import React, { createContext, useContext } from "react";
import type {
  MerchCadence,
  MerchCategory,
  MerchSaleStatus,
  NavTab,
  NewsCategory,
  OfflineEventType,
  SourcePlatformKey,
} from "../industry/types";

export type AppLang = "zh" | "ja" | "ko" | "en";

export const LANG_OPTIONS: Array<{ id: AppLang; label: string; short: string; htmlLang: string }> = [
  { id: "zh", label: "简体中文", short: "中文", htmlLang: "zh-CN" },
  { id: "ja", label: "日本語", short: "日本語", htmlLang: "ja" },
  { id: "ko", label: "한국어", short: "한국어", htmlLang: "ko" },
  { id: "en", label: "English", short: "EN", htmlLang: "en" },
];

export interface UiDict {
  docTitle: string;
  brandTag: string;
  brandSub: string;
  nav: Record<NavTab, string>;
  syncing: string;
  livePrefix: string;
  codesBtn: string;
  searchAria: string;
  searchTitle: string;
  bookmarkTitle: string;
  themeToLight: string;
  themeToDark: string;
  // Redeem codes bar & modal
  codesBarBadge: string;
  codesBarHint: string;
  codesBarMore: string;
  codesModalTitle: string;
  codesActiveSuffix: string;
  officialRedeemBtn: string;
  copyOneClick: string;
  expiringBadge: string;
  permanentLabel: string;
  deadlinePrefix: string;
  expiredSectionTitle: string;
  expiredPrefix: string;
  codesFootNote: string;
  // Home
  heroV34Tag: string;
  heroV34Date: string;
  heroV34Title: string;
  heroV34Summary: string;
  heroV34Cta: string;
  heroFesTag: string;
  heroFesCta: string;
  heroZliveTag: string;
  heroZliveCta: string;
  heroCollabTag: string;
  heroCollabCta: string;
  dualCountdownTitle: string;
  cdTabFes: string;
  cdTabV34: string;
  cdFesTitle: string;
  cdFesSub: string;
  cdV34Title: string;
  cdV34Sub: string;
  cdUnits: [string, string, string, string];
  multiSourceTitle: string;
  poolStatusLink: string;
  homeUpcomingKicker: string;
  homeUpcomingTitle: string;
  viewAllEvents: string;
  officialMajorBadge: string;
  fanEventBadge: string;
  photosCount: (n: number) => string;
  homeMerchKicker: string;
  homeMerchTitle: string;
  enterMerchLink: (n: number) => string;
  viewMultiPhoto: string;
  homeNewsKicker: string;
  homeNewsTitle: string;
  allNewsLink: (n: number) => string;
  // Feed
  feedKicker: string;
  feedTitle: string;
  refreshOfficialBtn: string;
  refreshingBtn: string;
  feedPlaceholder: string;
  allSourcesOpt: string;
  sortPriority: string;
  sortLatest: string;
  sortHeat: string;
  allChannels: string;
  noMatchingNews: string;
  heatLabel: string;
  sourcesMentioned: (n: number) => string;
  daysLeft: (d: number) => string;
  // Events
  eventsKicker: string;
  eventsTitle: string;
  exportIcsBtn: string;
  submitEventBtn: string;
  annualBadge: string;
  browseGalleryBtn: (n: number) => string;
  ticketEntryBtn: string;
  fesCountdownLabel: string;
  fesCountdownSub: string;
  allTypesCount: (n: number) => string;
  officialEventsFilter: (n: number) => string;
  fanEventsFilter: (n: number) => string;
  activeEventsTab: (n: number) => string;
  pastEventsTab: (n: number) => string;
  allSubTypes: string;
  noActiveEvents: string;
  pastArchiveTitle: (n: number) => string;
  pastArchiveSub: string;
  expandPastBtn: string;
  collapsePastBtn: string;
  pastArchiveHeader: string;
  noPastEvents: string;
  badgeOfficial: string;
  badgeUnofficial: string;
  statusUpcoming: string;
  statusOpen: string;
  statusPast: string;
  detailAndGalleryBtn: string;
  officialOrTicketLink: string;
  highlightsTitle: string;
  addToCalendarBtn: string;
  visitOfficialLinkBtn: string;
  submitModalTitle: string;
  // Merch
  merchKicker: string;
  merchTitle: string;
  checkMerchBtn: string;
  checkingMerchBtn: string;
  merchBannerTitle: string;
  merchBannerSub: (time: string) => string;
  allCadence: (n: number) => string;
  wishOnly: (n: number) => string;
  wishBudgetPrefix: string;
  allMerchCat: string;
  noMerchMatch: string;
  cutoffDaysLeft: (d: number) => string;
  shipDatePrefix: string;
  releaseDatePrefix: string;
  merchDetailBtn: string;
  wishedLabel: string;
  wishAddLabel: string;
  specsTitle: string;
  channelsTitle: string;
  goBuyBtn: string;
  // Gallery
  galleryIndex: (i: number, total: number) => string;
  longImageProgress: (shown: number, total: number) => string;
  prevImg: string;
  nextImg: string;
  fullImageBtn: string;
  expandNextSection: (next: number, total: number) => string;
  expandFullLongBtn: string;
  longCollapsedStatus: (isFull: boolean, shown: number, total: number) => string;
  continueExpandBtn: string;
  collapseToFirstBtn: string;
  longBadge: string;
  // Article Modal
  takeawaysTitle: string;
  sourcePrefix: string;
  viewOriginalBtn: string;
  // Search Modal
  searchPlaceholder: string;
  hotKeywordsTitle: string;
  hotKeywords: string[];
  searchTip: string;
  noSearchHits: (q: string) => string;
  searchTryHint: string;
  aiBriefTitle: string;
  aiBriefBtn: string;
  aiBriefLoading: string;
  aiModelPrefix: string;
  aiCacheHitTag: string;
  aiLiveTag: string;
  groupEvents: string;
  groupMerch: string;
  groupNews: string;
  groupCodes: string;
  actionPhotos: string;
  actionDetail: string;
  actionRead: string;
  actionCopy: string;
  // Hub
  hubKicker: string;
  hubTitle: string;
  refresh5SourcesBtn: string;
  liveSourcesCardTitle: string;
  liveSourcesCardDesc: string;
  llmCardTitle: string;
  llmEnrichBtn: string;
  llmEnrichingBtn: string;
  llmStatusDesc: (cached: number, today: number, limit: number) => string;
  llmNotConfigured: string;
  apiCardTitle: string;
  sourceMatrixTitle: string;
  modeLive: string;
  modePool: string;
  modeRss: string;
  bookmarksKicker: string;
  bookmarksTitle: (n: number) => string;
  noBookmarks: string;
  // Toasts
  toastCodeCopied: (code: string) => string;
  toastBookmarked: string;
  toastUnbookmarked: string;
  toastWished: string;
  toastUnwished: string;
  toastShareCopied: string;
  toastSynced: (n: number) => string;
}

export const UI_DICT: Record<AppLang, UiDict> = {
  zh: {
    docTitle: "Zzone · 绝区零全生态实时资讯 · 活动 · 周边",
    brandTag: "绝区零 v2",
    brandSub: "资讯 · 活动 · 周边聚合",
    nav: { home: "发现", feed: "资讯", events: "活动", merch: "周边", hub: "信源" },
    syncing: "同步中...",
    livePrefix: "实时 ·",
    codesBtn: "兑换码",
    searchAria: "全站聚合搜索",
    searchTitle: "全站聚合搜索 (⌘K / /)",
    bookmarkTitle: "多平台信源、号池与本地收藏",
    themeToLight: "切换到浅色模式",
    themeToDark: "切换到深色模式",
    codesBarBadge: "可用兑换码",
    codesBarHint: "点击即复制",
    codesBarMore: "全部详情 & 兑换",
    codesModalTitle: "绝区零可用兑换码速抄箱",
    codesActiveSuffix: "个有效",
    officialRedeemBtn: "官方兑换页",
    copyOneClick: "一键复制",
    expiringBadge: "即将截止",
    permanentLabel: "长期有效",
    deadlinePrefix: "截止",
    expiredSectionTitle: "近期已失效（归档防踩坑）",
    expiredPrefix: "已过期",
    codesFootNote: "提示：国服请在游戏内「更多 → 兑换码」粘贴领取；国际服/亚服可点击右上角直达官方网页兑换页。",
    heroV34Tag: "即将上线 · 3.4 新版本",
    heroV34Date: "2026/12/02 正式更新",
    heroV34Title: "3.4 新版本「长日终尽」：首位结使虚狩「挽昼」登场，星铁联动「知更鸟」登录即领",
    heroV34Summary:
      "12月2日重磅上线！登录免费领联动 S 级限定「知更鸟」及推荐主属性定制驱动盘，累计签到再领 10 加密母带 + 10 邦布券 + 2320 菲林 + 全新免费邦布「帕姆」。",
    heroV34Cta: "查看 3.4 福利与前瞻总览",
    heroFesTag: "即将开馆 · 年度盛会 FES",
    heroFesCta: "查看杭州 FES 官方情报图",
    heroZliveTag: "即将开唱 · Zenless LIVE 2026",
    heroZliveCta: "查看 ZLIVE 演出与购票详情",
    heroCollabTag: "最新跨界联动 · 即将开启",
    heroCollabCta: "查看最新联动与限定周边",
    dualCountdownTitle: "两大重磅倒计时",
    cdTabFes: "杭州 FES",
    cdTabV34: "3.4 新版本",
    cdFesTitle: "2026 杭州 FES「布梦嘉年华」& ZLIVE 专场",
    cdFesSub: "杭州大会展中心 4/5/6号馆",
    cdV34Title: "3.4「长日终尽」正式上线 · 登录送知更鸟",
    cdV34Sub: "首位结使虚狩「挽昼」+ 2320菲林 + 10连",
    cdUnits: ["天", "时", "分", "秒"],
    multiSourceTitle: "官方多信源实时汇总",
    poolStatusLink: "号池状态 →",
    homeUpcomingKicker: "UPCOMING ONLY · FES · ZLIVE · LATEST COLLABS",
    homeUpcomingTitle: "即将到来：年度 FES、ZLIVE 与最新联动",
    viewAllEvents: "查看全部活动",
    officialMajorBadge: "官方重磅",
    fanEventBadge: "同人活动",
    photosCount: (n) => `${n} 张官图`,
    homeMerchKicker: "LATEST MERCH & COLLAB GEAR",
    homeMerchTitle: "最新周边上新与跨界联名",
    enterMerchLink: (n) => `进入周边上新 (${n} 款)`,
    viewMultiPhoto: "看多图详情 →",
    homeNewsKicker: "HIGH-PRIORITY OFFICIAL UPDATES",
    homeNewsTitle: "重要公告与高时效版本动态",
    allNewsLink: (n) => `全部 ${n} 条资讯`,
    feedKicker: "MULTI-SOURCE LIVE FEED",
    feedTitle: "全网实时资讯聚合",
    refreshOfficialBtn: "刷新最新官方资讯",
    refreshingBtn: "正在同步...",
    feedPlaceholder: "过滤版本、活动、代理人或关键词...",
    allSourcesOpt: "全部来源平台",
    sortPriority: "重要 · 时效",
    sortLatest: "最新",
    sortHeat: "热度",
    allChannels: "全部频道",
    noMatchingNews: "没有找到匹配当前条件的资讯，试试清空关键词或切换来源平台。",
    heatLabel: "热度",
    sourcesMentioned: (n) => `${n} 处信源提及`,
    daysLeft: (d) => `剩 ${d} 天`,
    eventsKicker: "FES · ZLIVE · COLLAB · FAN ONLY",
    eventsTitle: "绝区零官方大型活动、品牌联动与同人展",
    exportIcsBtn: "导出近期活动日历",
    submitEventBtn: "投稿官方/同人活动",
    annualBadge: "年度重磅 · 即将开馆",
    browseGalleryBtn: (n) => `浏览 ${n} 张官方情报图与亮点`,
    ticketEntryBtn: "B站会员购详情",
    fesCountdownLabel: "距离杭州 FES 开馆倒计时",
    fesCountdownSub: "4/5/6号三馆实景搭建，每晚 17:30 同期上演 Zenless LIVE 2026 FES 专场音乐会。",
    allTypesCount: (n) => `全部类型 (${n})`,
    officialEventsFilter: (n) => `官方大型活动 & 联动 (${n})`,
    fanEventsFilter: (n) => `非官方 / 同人 Only & Live (${n})`,
    activeEventsTab: (n) => `即将开启 / 进行中 (${n})`,
    pastEventsTab: (n) => `往日活动 (${n})`,
    allSubTypes: "全部细分",
    noActiveEvents: "当前筛选条件下暂无即将开启的活动，可切换类型或查看下方「往日活动」。",
    pastArchiveTitle: (n) => `往日活动归档（${n} 场已结束）`,
    pastArchiveSub: "含武汉欢乐谷 × 雅迪联动、KFC 联动、Z·COMBO 快闪、东京妄想天使 Live 等已收官记录",
    expandPastBtn: "展开查看往日活动",
    collapsePastBtn: "收起往日活动",
    pastArchiveHeader: "以下为已收官的往日官方大型联动与演出档案（按时间由近到远排列）：",
    noPastEvents: "当前筛选条件下暂无往日活动归档。",
    badgeOfficial: "官方活动",
    badgeUnofficial: "非官方 / 同人",
    statusUpcoming: "即将开启",
    statusOpen: "报名 / 开票中",
    statusPast: "往日已结束",
    detailAndGalleryBtn: "多图与活动详情",
    officialOrTicketLink: "官方/购票入口",
    highlightsTitle: "核心亮点与现场情报",
    addToCalendarBtn: "加入系统日历 (.ics)",
    visitOfficialLinkBtn: "前往官方/购票详情页",
    submitModalTitle: "投稿绝区零官方 / 同人线下活动线索",
    merchKicker: "OFFICIAL MERCH · MULTI-IMAGE CATALOG",
    merchTitle: "米游铺、三Z旗舰店与联名周边上新",
    checkMerchBtn: "立即检查官方上新",
    checkingMerchBtn: "正在巡检周边...",
    merchBannerTitle: "版本同步上新 + 日常定期上新 · 全商品多图档案",
    merchBannerSub: (time) => `每 30 分钟自动巡检米游铺与旗舰店上新 · 最近检查 ${time}`,
    allCadence: (n) => `全部上新 (${n})`,
    wishOnly: (n) => `我的心愿单 (${n})`,
    wishBudgetPrefix: "心愿单预估合计",
    allMerchCat: "全部分类",
    noMerchMatch: "当前筛选条件下没有对应周边，试试切换上新周期或分类。",
    cutoffDaysLeft: (d) => `截单剩 ${d} 天`,
    shipDatePrefix: "预计出货",
    releaseDatePrefix: "上新",
    merchDetailBtn: "查看详图与介绍",
    wishedLabel: "已种草",
    wishAddLabel: "种草",
    specsTitle: "规格与附赠亮点",
    channelsTitle: "官方发售渠道",
    goBuyBtn: "前往官方商店/情报页",
    galleryIndex: (i, total) => `第 ${i} / ${total} 张`,
    longImageProgress: (shown, total) => `详情长图 · 已展开 ${shown} / ${total} 节`,
    prevImg: "上一张",
    nextImg: "下一张",
    fullImageBtn: "全屏原图",
    expandNextSection: (next, total) => `展开下一节（第 ${next} / ${total} 节）`,
    expandFullLongBtn: "一次展开完整长图",
    longCollapsedStatus: (isFull, shown, total) =>
      `当前已展示 ${isFull ? "全部完整长图" : `第 1 ~ ${shown} 节`}（共 ${total} 节）`,
    continueExpandBtn: "继续展开下一节",
    collapseToFirstBtn: "收起回第 1 节",
    longBadge: "长图",
    takeawaysTitle: "核心要点速览",
    sourcePrefix: "来源：",
    viewOriginalBtn: "查看官方原文",
    searchPlaceholder: "搜索官方资讯、线下 FES/联动活动、米游铺周边、兑换码...",
    hotKeywordsTitle: "近期热门关键词",
    hotKeywords: ["3.4", "挽昼", "知更鸟", "杭州 FES", "ZLIVE", "雅迪联动", "浮波柚叶", "兑换码"],
    searchTip: "支持多词空格组合检索（例如：杭州 FES、雅迪 周边）",
    noSearchHits: (q) => `没有找到与「${q}」直接相关的内容`,
    searchTryHint: "试试搜索：3.4、杭州 FES、ZLIVE、雅迪联动、浮波柚叶、兑换码",
    aiBriefTitle: "AI 情报速报（按需触发 · 30 分钟缓存防重）",
    aiBriefBtn: "生成一句话速报",
    aiBriefLoading: "正在提炼中...",
    aiModelPrefix: "模型：",
    aiCacheHitTag: " · 命中缓存 (0 Token)",
    aiLiveTag: " · 实时提炼",
    groupEvents: "线下与联动活动",
    groupMerch: "官方周边与联名商品",
    groupNews: "官方与社区资讯",
    groupCodes: "可用兑换码",
    actionPhotos: "看多图 →",
    actionDetail: "商品详情 →",
    actionRead: "阅读 →",
    actionCopy: "复制",
    hubKicker: "MULTI-SOURCE COLLECTOR & POOL",
    hubTitle: "全平台信源、实时采集与号池接入",
    refresh5SourcesBtn: "立即刷新 5 大官方源",
    liveSourcesCardTitle: "5 大官方免号池直连源",
    liveSourcesCardDesc: "国服官网、国际官网、米游社官方、HoYoLAB 官方与日服专属源每 15 分钟自动去重抓取（自动过滤例行水公告）。",
    llmCardTitle: "LLM 号池调度 (server/llm.mjs)",
    llmEnrichBtn: "AI 批量提炼",
    llmEnrichingBtn: "提炼中...",
    llmStatusDesc: (cached, today, limit) =>
      `已落盘缓存 ${cached} 条摘要（0 重复计费）· 今日调用 ${today}/${limit} 次`,
    llmNotConfigured: "预留 LLM / X / B站号池轮换与 429 自动退避，填入 server/pool.json 即刻生效。",
    apiCardTitle: "标准 API & RSS 出口",
    sourceMatrixTitle: "监控信源矩阵",
    modeLive: "实时在线",
    modePool: "待接入号池",
    modeRss: "RSS 通道",
    bookmarksKicker: "BOOKMARKS",
    bookmarksTitle: (n) => `我的本地收藏 (${n})`,
    noBookmarks: "暂无收藏资讯。点击任意资讯卡片右上角的书签图标即可保存在本地浏览器中。",
    toastCodeCopied: (code) => `已复制兑换码：${code}`,
    toastBookmarked: "已加入本地收藏",
    toastUnbookmarked: "已取消收藏",
    toastWished: "已加入周边心愿单",
    toastUnwished: "已移出周边心愿单",
    toastShareCopied: "已复制标题与原文链接",
    toastSynced: (n) => `已实时同步 ${n} 条官方最新资讯`,
  },

  ja: {
    docTitle: "Zzone · ゼンレスゾーンゼロ 総合リアルタイム情報ハブ",
    brandTag: "ゼンゼロ v2",
    brandSub: "公式ニュース・イベント・グッズ集約",
    nav: { home: "トップ", feed: "ニュース", events: "イベント", merch: "グッズ", hub: "ソース" },
    syncing: "同期中...",
    livePrefix: "LIVE ·",
    codesBtn: "交換コード",
    searchAria: "サイト横断検索",
    searchTitle: "横断検索 (⌘K / /)",
    bookmarkTitle: "ソース・ブックマーク",
    themeToLight: "ライトモードに切替",
    themeToDark: "ダークモードに切替",
    codesBarBadge: "有効な交換コード",
    codesBarHint: "クリックでコピー",
    codesBarMore: "詳細・入力ページ",
    codesModalTitle: "ゼンレスゾーンゼロ 有効な交換コード一覧",
    codesActiveSuffix: "件有効",
    officialRedeemBtn: "公式交換ページ",
    copyOneClick: "コピー",
    expiringBadge: "まもなく終了",
    permanentLabel: "常設",
    deadlinePrefix: "期限",
    expiredSectionTitle: "期限切れ（アーカイブ）",
    expiredPrefix: "終了",
    codesFootNote: "ヒント：ゲーム内「その他 → 交換コード」または右上の公式交換ページより入力してください。",
    heroV34Tag: "まもなく配信 · Ver.3.4",
    heroV34Date: "2026/12/02 正式リリース",
    heroV34Title:
      "Ver.3.4「ついには長き、日の終わり」：初の結使・虚狩り「サンブリンガー」登場＆コラボS級「ロビン」無料配布",
    heroV34Summary:
      "12月2日リリース！ログインで『崩壊：スターレイル』コラボS級限定エージェント「ロビン」＆カスタムドライバディスク無料獲得、さらに暗号化マスターテープ×10＋ボンプチケット×10＋ポリクローム×2,320＋新ボンプ「パム」！",
    heroV34Cta: "Ver.3.4 特典・予告番組まとめを見る",
    heroFesTag: "まもなく開幕 · 公式大型フェス",
    heroFesCta: "杭州 FES 2026 公式ビジュアルを見る",
    heroZliveTag: "まもなく開演 · Zenless LIVE 2026",
    heroZliveCta: "ZLIVE 2026 公演・チケット詳細を見る",
    heroCollabTag: "最新コラボ · まもなく開催",
    heroCollabCta: "コラボポップアップ・限定グッズを見る",
    dualCountdownTitle: "大型イベント カウントダウン",
    cdTabFes: "杭州 FES",
    cdTabV34: "Ver.3.4",
    cdFesTitle: "2026 杭州 FES「布夢カーニバル」& Zenless LIVE",
    cdFesSub: "杭州大会展中心 ホール 4/5/6",
    cdV34Title: "Ver.3.4「ついには長き、日の終わり」配信＆ロビン配布",
    cdV34Sub: "結使・虚狩り「サンブリンガー」＋ポリクローム×2,320",
    cdUnits: ["日", "時", "分", "秒"],
    multiSourceTitle: "公式マルチソース リアルタイム集約",
    poolStatusLink: "ソース状況 →",
    homeUpcomingKicker: "UPCOMING ONLY · FES · ZLIVE · COLLABS",
    homeUpcomingTitle: "まもなく開催：FES・ZLIVE・最新コラボ",
    viewAllEvents: "全イベントを見る",
    officialMajorBadge: "公式大型",
    fanEventBadge: "ファン企画",
    photosCount: (n) => `画像 ${n} 枚`,
    homeMerchKicker: "LATEST MERCH & COLLAB GEAR",
    homeMerchTitle: "最新公式グッズ・コラボ商品",
    enterMerchLink: (n) => `グッズ一覧を見る (${n} 点)`,
    viewMultiPhoto: "詳細画像を見る →",
    homeNewsKicker: "HIGH-PRIORITY OFFICIAL UPDATES",
    homeNewsTitle: "重要なお知らせ・最新バージョン情報",
    allNewsLink: (n) => `ニュース全 ${n} 件`,
    feedKicker: "MULTI-SOURCE LIVE FEED",
    feedTitle: "リアルタイム公式ニュース集約",
    refreshOfficialBtn: "公式最新情報を取得",
    refreshingBtn: "同期中...",
    feedPlaceholder: "バージョン、エージェント、イベントで絞り込み...",
    allSourcesOpt: "すべてのソース",
    sortPriority: "重要・新着優先",
    sortLatest: "新着順",
    sortHeat: "注目順",
    allChannels: "すべて",
    noMatchingNews: "該当するニュースが見つかりません。条件を変更してお試しください。",
    heatLabel: "注目度",
    sourcesMentioned: (n) => `${n} 件の関連ソース`,
    daysLeft: (d) => `残り ${d} 日`,
    eventsKicker: "FES · ZLIVE · COLLAB · FAN ONLY",
    eventsTitle: "公式大型イベント・コラボ・同人即売会",
    exportIcsBtn: "カレンダー出力 (.ics)",
    submitEventBtn: "イベント情報を投稿",
    annualBadge: "年間最大級 · まもなく開幕",
    browseGalleryBtn: (n) => `公式ギャラリー ${n} 枚・見どころを見る`,
    ticketEntryBtn: "チケット詳細",
    fesCountdownLabel: "杭州 FES 2026 開幕まで",
    fesCountdownSub: "ホール 4/5/6 にて没入型エリアを展開、毎晩 17:30 より Zenless LIVE 2026 を同時開催。",
    allTypesCount: (n) => `すべて (${n})`,
    officialEventsFilter: (n) => `公式イベント・コラボ (${n})`,
    fanEventsFilter: (n) => `非公式・同人イベント (${n})`,
    activeEventsTab: (n) => `開催予定・開催中 (${n})`,
    pastEventsTab: (n) => `過去のイベント (${n})`,
    allSubTypes: "全カテゴリー",
    noActiveEvents: "該当する開催予定イベントはありません。",
    pastArchiveTitle: (n) => `過去のイベントアーカイブ（終了済み ${n} 件）`,
    pastArchiveSub: "武漢歓楽谷×Yadeaコラボ、KFCコラボ、Z・COMBO、東京 Signal Lost DJ Live など",
    expandPastBtn: "過去のイベントを開く",
    collapsePastBtn: "閉じる",
    pastArchiveHeader: "終了済みの公式大型コラボ・ライブアーカイブ（新しい順）：",
    noPastEvents: "該当する過去のイベントはありません。",
    badgeOfficial: "公式イベント",
    badgeUnofficial: "ファン / 同人",
    statusUpcoming: "まもなく開催",
    statusOpen: "受付・販売中",
    statusPast: "終了済み",
    detailAndGalleryBtn: "詳細・ギャラリー",
    officialOrTicketLink: "公式・チケット",
    highlightsTitle: "注目ポイント・見どころ",
    addToCalendarBtn: "カレンダーに追加 (.ics)",
    visitOfficialLinkBtn: "公式サイト・チケットへ",
    submitModalTitle: "公式・ファンイベント情報の投稿",
    merchKicker: "OFFICIAL MERCH · MULTI-IMAGE CATALOG",
    merchTitle: "公式ストア・三Z STUDIO・コラボグッズ",
    checkMerchBtn: "新着グッズを確認",
    checkingMerchBtn: "確認中...",
    merchBannerTitle: "バージョン連動＆定期新作・全商品マルチ画像カタログ",
    merchBannerSub: (time) => `30分ごとに新作を自動チェック · 最終確認 ${time}`,
    allCadence: (n) => `すべて (${n})`,
    wishOnly: (n) => `欲しい物リスト (${n})`,
    wishBudgetPrefix: "リスト合計目安",
    allMerchCat: "全カテゴリー",
    noMerchMatch: "該当するグッズがありません。",
    cutoffDaysLeft: (d) => `締切まで ${d} 日`,
    shipDatePrefix: "発送予定",
    releaseDatePrefix: "発売",
    merchDetailBtn: "詳細画像を見る",
    wishedLabel: "登録済み",
    wishAddLabel: "欲しい物",
    specsTitle: "仕様・特典ポイント",
    channelsTitle: "公式販売チャネル",
    goBuyBtn: "公式ストア・詳細へ",
    galleryIndex: (i, total) => `${i} / ${total} 枚目`,
    longImageProgress: (shown, total) => `縦長詳細画像 · ${shown} / ${total} セクション表示中`,
    prevImg: "前へ",
    nextImg: "次へ",
    fullImageBtn: "原寸表示",
    expandNextSection: (next, total) => `次のセクションを展開 (${next} / ${total})`,
    expandFullLongBtn: "縦長画像をすべて展開",
    longCollapsedStatus: (isFull, shown, total) =>
      `${isFull ? "全セクション展開済み" : `第 1〜${shown} セクション表示中`}（全 ${total} 節）`,
    continueExpandBtn: "さらに展開",
    collapseToFirstBtn: "第1節に戻す",
    longBadge: "縦長",
    takeawaysTitle: "重要ポイントまとめ",
    sourcePrefix: "ソース：",
    viewOriginalBtn: "公式原文を読む",
    searchPlaceholder: "ニュース、FES・コラボ、フィギュア・グッズ、交換コードを検索...",
    hotKeywordsTitle: "注目キーワード",
    hotKeywords: ["Ver.3.4", "サンブリンガー", "ロビン", "杭州 FES", "ZLIVE", "浮波柚葉", "星見雅", "交換コード"],
    searchTip: "スペース区切りで複数キーワード検索可能",
    noSearchHits: (q) => `「${q}」に一致する情報が見つかりませんでした`,
    searchTryHint: "例：Ver.3.4、サンブリンガー、ロビン、FES、浮波柚葉、交換コード",
    aiBriefTitle: "AI 速報サマリー（クリック時のみ実行・30分キャッシュ）",
    aiBriefBtn: "AI で要約する",
    aiBriefLoading: "要約を生成中...",
    aiModelPrefix: "モデル：",
    aiCacheHitTag: " · キャッシュヒット (0 Token)",
    aiLiveTag: " · リアルタイム要約",
    groupEvents: "イベント・コラボ",
    groupMerch: "公式グッズ",
    groupNews: "公式ニュース",
    groupCodes: "有効な交換コード",
    actionPhotos: "画像を見る →",
    actionDetail: "商品詳細 →",
    actionRead: "読む →",
    actionCopy: "コピー",
    hubKicker: "MULTI-SOURCE COLLECTOR & POOL",
    hubTitle: "マルチソース監視・自動取得・プール管理",
    refresh5SourcesBtn: "公式ソースを今すぐ同期",
    liveSourcesCardTitle: "公式ダイレクト接続ソース",
    liveSourcesCardDesc: "中国公式・国際公式・米遊社・HoYoLAB・日本公式から15分ごとに自動取得＆重複排除。",
    llmCardTitle: "LLM プール制御 (server/llm.mjs)",
    llmEnrichBtn: "AI 一括要約",
    llmEnrichingBtn: "処理中...",
    llmStatusDesc: (cached, today, limit) =>
      `キャッシュ済み ${cached} 件（重複課金ゼロ）· 本日 ${today}/${limit} 回`,
    llmNotConfigured: "server/pool.json に LLM / X / Bilibili プールを設定すると即時有効化されます。",
    apiCardTitle: "標準 API & RSS 出力",
    sourceMatrixTitle: "監視ソースマトリクス",
    modeLive: "リアルタイム接続",
    modePool: "プール待機",
    modeRss: "RSS フィード",
    bookmarksKicker: "BOOKMARKS",
    bookmarksTitle: (n) => `ローカルブックマーク (${n})`,
    noBookmarks: "保存されたニュースはありません。各カードのブックマークアイコンから保存できます。",
    toastCodeCopied: (code) => `交換コードをコピーしました：${code}`,
    toastBookmarked: "ブックマークに追加しました",
    toastUnbookmarked: "ブックマークを解除しました",
    toastWished: "欲しい物リストに追加しました",
    toastUnwished: "欲しい物リストから削除しました",
    toastShareCopied: "タイトルと公式URLをコピーしました",
    toastSynced: (n) => `日本語公式ニュースを ${n} 件同期しました`,
  },

  ko: {
    docTitle: "Zzone · 젠레스 존 제로 통합 실시간 정보 허브",
    brandTag: "젠존제 v2",
    brandSub: "뉴스 · 오프라인 행사 · 굿즈 모아보기",
    nav: { home: "홈", feed: "뉴스", events: "행사", merch: "굿즈", hub: "소스" },
    syncing: "동기화 중...",
    livePrefix: "실시간 ·",
    codesBtn: "리딤코드",
    searchAria: "통합 검색",
    searchTitle: "전체 검색 (⌘K / /)",
    bookmarkTitle: "소스 및 북마크",
    themeToLight: "라이트 모드로 전환",
    themeToDark: "다크 모드로 전환",
    codesBarBadge: "사용 가능 리딤코드",
    codesBarHint: "클릭하여 복사",
    codesBarMore: "전체 보기 · 입력",
    codesModalTitle: "젠레스 존 제로 사용 가능 리딤코드",
    codesActiveSuffix: "개 유효",
    officialRedeemBtn: "공식 교환 페이지",
    copyOneClick: "복사",
    expiringBadge: "마감 임박",
    permanentLabel: "상시 유효",
    deadlinePrefix: "마감",
    expiredSectionTitle: "만료된 코드 (아카이브)",
    expiredPrefix: "만료",
    codesFootNote: "안내: 게임 내 [더보기 → 리딤코드] 또는 우측 상단 공식 교환 페이지에서 입력할 수 있습니다.",
    heroV34Tag: "출시 임박 · 3.4 버전",
    heroV34Date: "2026/12/02 정식 출시",
    heroV34Title:
      "3.4 버전 「긴 나날의 끝자락」: 최초 결사 공허 사냥꾼 「태양을 가져온 자」 등장 & 콜라보 S급 「로빈」 무료 지급",
    heroV34Summary:
      "12월 2일 정식 업데이트! 로그인 시 〈붕괴: 스타레일〉 콜라보 S급 에이전트 「로빈」 및 커스텀 디스크 세트 무료 증정, 출석 시 기밀 마스터 테이프×10 + Bangboo 티켓×10 + 폴리크롬×2,320 + 신규 Bangboo 「폼폼」!",
    heroV34Cta: "3.4 혜택 및 특별 방송 정리 보기",
    heroFesTag: "개막 임박 · 연례 대형 FES",
    heroFesCta: "항저우 FES 2026 공식 이미지 보기",
    heroZliveTag: "공연 임박 · Zenless LIVE 2026",
    heroZliveCta: "ZLIVE 2026 공연 및 티켓 정보 보기",
    heroCollabTag: "최신 콜라보 · 오픈 예정",
    heroCollabCta: "콜라보 팝업 및 한정 굿즈 보기",
    dualCountdownTitle: "주요 대형 일정 카운트다운",
    cdTabFes: "항저우 FES",
    cdTabV34: "3.4 버전",
    cdFesTitle: "2026 항저우 FES 「꿈의 카니발」 & Zenless LIVE",
    cdFesSub: "항저우 국제엑스포센터 4/5/6관",
    cdV34Title: "3.4 「긴 나날의 끝자락」 출시 · 로빈 무료 지급",
    cdV34Sub: "결사 공허 사냥꾼 「태양을 가져온 자」 + 폴리크롬 2,320",
    cdUnits: ["일", "시간", "분", "초"],
    multiSourceTitle: "공식 멀티 소스 실시간 취합",
    poolStatusLink: "소스 상태 →",
    homeUpcomingKicker: "UPCOMING ONLY · FES · ZLIVE · COLLABS",
    homeUpcomingTitle: "예정된 대형 행사: FES · ZLIVE · 최신 콜라보",
    viewAllEvents: "전체 행사 보기",
    officialMajorBadge: "공식 대형",
    fanEventBadge: "팬 행사",
    photosCount: (n) => `이미지 ${n}장`,
    homeMerchKicker: "LATEST MERCH & COLLAB GEAR",
    homeMerchTitle: "신규 공식 굿즈 & 콜라보 상품",
    enterMerchLink: (n) => `굿즈 카탈로그 (${n}종)`,
    viewMultiPhoto: "상세 이미지 보기 →",
    homeNewsKicker: "HIGH-PRIORITY OFFICIAL UPDATES",
    homeNewsTitle: "핵심 공지 및 주요 버전 소식",
    allNewsLink: (n) => `뉴스 전체 ${n}건`,
    feedKicker: "MULTI-SOURCE LIVE FEED",
    feedTitle: "실시간 공식 뉴스 통합 피드",
    refreshOfficialBtn: "최신 공식 소식 새로고침",
    refreshingBtn: "동기화 중...",
    feedPlaceholder: "버전, 에이전트, 이벤트 키워드 필터링...",
    allSourcesOpt: "전체 출처",
    sortPriority: "중요 · 최신순",
    sortLatest: "최신순",
    sortHeat: "인기순",
    allChannels: "전체 채널",
    noMatchingNews: "조건에 맞는 뉴스가 없습니다. 검색어나 필터를 조정해 보세요.",
    heatLabel: "관심도",
    sourcesMentioned: (n) => `${n}개 소스 언급`,
    daysLeft: (d) => `${d}일 남음`,
    eventsKicker: "FES · ZLIVE · COLLAB · FAN ONLY",
    eventsTitle: "공식 대형 오프라인 행사 · 콜라보 · 온리전",
    exportIcsBtn: "일정 캘린더 내보내기 (.ics)",
    submitEventBtn: "행사 제보하기",
    annualBadge: "연례 최대 행사 · 개막 임박",
    browseGalleryBtn: (n) => `공식 이미지 ${n}장 및 핵심 정보 보기`,
    ticketEntryBtn: "티켓 상세",
    fesCountdownLabel: "항저우 FES 개막 카운트다운",
    fesCountdownSub: "4/5/6관 몰입형 전시 구성, 매일 밤 17:30 Zenless LIVE 2026 콘서트 동시 개최.",
    allTypesCount: (n) => `전체 유형 (${n})`,
    officialEventsFilter: (n) => `공식 대형 행사 & 콜라보 (${n})`,
    fanEventsFilter: (n) => `비공식 / 동인 온리전 (${n})`,
    activeEventsTab: (n) => `개최 예정 / 진행 중 (${n})`,
    pastEventsTab: (n) => `지난 행사 (${n})`,
    allSubTypes: "전체 세부 유형",
    noActiveEvents: "현재 필터에 해당하는 예정 행사가 없습니다.",
    pastArchiveTitle: (n) => `지난 행사 아카이브 (종료 ${n}건)`,
    pastArchiveSub: "우한 해피밸리×야디 콜라보, KFC 콜라보, Z·COMBO, 도쿄 Signal Lost DJ Live 등",
    expandPastBtn: "지난 행사 펼치기",
    collapsePastBtn: "접기",
    pastArchiveHeader: "종료된 과거 공식 대형 콜라보 및 공연 기록 (최신순):",
    noPastEvents: "해당하는 지난 행사가 없습니다.",
    badgeOfficial: "공식 행사",
    badgeUnofficial: "팬 / 동인",
    statusUpcoming: "개최 예정",
    statusOpen: "예매 / 접수 중",
    statusPast: "종료됨",
    detailAndGalleryBtn: "상세 및 이미지",
    officialOrTicketLink: "공식 / 예매",
    highlightsTitle: "핵심 포인트 및 현장 정보",
    addToCalendarBtn: "캘린더에 추가 (.ics)",
    visitOfficialLinkBtn: "공식 / 예매 페이지 이동",
    submitModalTitle: "오프라인 / 팬 행사 제보",
    merchKicker: "OFFICIAL MERCH · MULTI-IMAGE CATALOG",
    merchTitle: "공식 굿즈 · 삼Z STUDIO · 콜라보 신상",
    checkMerchBtn: "신상 업데이트 확인",
    checkingMerchBtn: "확인 중...",
    merchBannerTitle: "버전 신상 + 정기 신상 · 전체 상품 상세 이미지 아카이브",
    merchBannerSub: (time) => `30분마다 신상 자동 점검 · 최근 확인 ${time}`,
    allCadence: (n) => `전체 신상 (${n})`,
    wishOnly: (n) => `위시리스트 (${n})`,
    wishBudgetPrefix: "위시리스트 예상 합계",
    allMerchCat: "전체 분류",
    noMerchMatch: "조건에 맞는 굿즈가 없습니다.",
    cutoffDaysLeft: (d) => `예약 마감 ${d}일 전`,
    shipDatePrefix: "출시 예정",
    releaseDatePrefix: "공개",
    merchDetailBtn: "상세 이미지 보기",
    wishedLabel: "찜 완료",
    wishAddLabel: "찜하기",
    specsTitle: "사양 및 특전 포인트",
    channelsTitle: "공식 판매처",
    goBuyBtn: "공식 스토어 / 안내 보기",
    galleryIndex: (i, total) => `${i} / ${total}번째 이미지`,
    longImageProgress: (shown, total) => `세로 상세 이미지 · ${shown} / ${total} 구간 표시 중`,
    prevImg: "이전",
    nextImg: "다음",
    fullImageBtn: "원본 보기",
    expandNextSection: (next, total) => `다음 구간 펼치기 (${next} / ${total})`,
    expandFullLongBtn: "전체 세로 이미지 펼치기",
    longCollapsedStatus: (isFull, shown, total) =>
      `${isFull ? "전체 이미지 표시 중" : `1 ~ ${shown} 구간 표시 중`} (총 ${total}구간)`,
    continueExpandBtn: "다음 구간 계속 보기",
    collapseToFirstBtn: "1구간으로 접기",
    longBadge: "세로",
    takeawaysTitle: "핵심 요약",
    sourcePrefix: "출처: ",
    viewOriginalBtn: "공식 원문 보기",
    searchPlaceholder: "공식 뉴스, FES/콜라보, 피규어/굿즈, 리딤코드 검색...",
    hotKeywordsTitle: "인기 검색어",
    hotKeywords: ["3.4", "태양을 가져온 자", "로빈", "항저우 FES", "ZLIVE", "우키나미 유즈하", "호시미 미야비", "리딤코드"],
    searchTip: "공백으로 여러 키워드를 조합해 검색할 수 있습니다",
    noSearchHits: (q) => `「${q}」와 일치하는 항목을 찾지 못했습니다`,
    searchTryHint: "예: 3.4, 태양을 가져온 자, 로빈, FES, 우키나미 유즈하, 리딤코드",
    aiBriefTitle: "AI 핵심 요약 (클릭 시 실행 · 30분 캐시)",
    aiBriefBtn: "AI 한눈에 요약",
    aiBriefLoading: "요약 생성 중...",
    aiModelPrefix: "모델: ",
    aiCacheHitTag: " · 캐시 적중 (0 Token)",
    aiLiveTag: " · 실시간 요약",
    groupEvents: "오프라인 행사 & 콜라보",
    groupMerch: "공식 굿즈 & 콜라보 상품",
    groupNews: "공식 뉴스",
    groupCodes: "사용 가능 리딤코드",
    actionPhotos: "이미지 보기 →",
    actionDetail: "상세 보기 →",
    actionRead: "읽기 →",
    actionCopy: "복사",
    hubKicker: "MULTI-SOURCE COLLECTOR & POOL",
    hubTitle: "멀티 소스 수집 엔진 및 풀 상태",
    refresh5SourcesBtn: "공식 소스 즉시 동기화",
    liveSourcesCardTitle: "공식 다이렉트 수집 소스",
    liveSourcesCardDesc: "한국 공식·글로벌·중국·일본 공식 및 HoYoLAB에서 15분마다 자동 수집 및 중복 제거.",
    llmCardTitle: "LLM 풀 스케줄러 (server/llm.mjs)",
    llmEnrichBtn: "AI 일괄 요약",
    llmEnrichingBtn: "처리 중...",
    llmStatusDesc: (cached, today, limit) =>
      `디스크 캐시 ${cached}건 (중복 과금 없음) · 금일 ${today}/${limit}회`,
    llmNotConfigured: "server/pool.json에 LLM / X / Bilibili 풀을 연결하면 즉시 활성화됩니다.",
    apiCardTitle: "표준 API & RSS 출력",
    sourceMatrixTitle: "모니터링 소스 목록",
    modeLive: "실시간 연결",
    modePool: "풀 대기",
    modeRss: "RSS 피드",
    bookmarksKicker: "BOOKMARKS",
    bookmarksTitle: (n) => `로컬 북마크 (${n})`,
    noBookmarks: "저장된 뉴스가 없습니다. 카드 우측 상단 북마크 아이콘으로 저장할 수 있습니다.",
    toastCodeCopied: (code) => `리딤코드가 복사되었습니다: ${code}`,
    toastBookmarked: "북마크에 추가되었습니다",
    toastUnbookmarked: "북마크에서 해제되었습니다",
    toastWished: "위시리스트에 추가되었습니다",
    toastUnwished: "위시리스트에서 제거되었습니다",
    toastShareCopied: "제목과 공식 링크가 복사되었습니다",
    toastSynced: (n) => `한국어 공식 소식 ${n}건을 동기화했습니다`,
  },

  en: {
    docTitle: "Zzone · Zenless Zone Zero Real-Time News, Events & Merch Hub",
    brandTag: "ZZZ v2",
    brandSub: "News · Events · Merch Hub",
    nav: { home: "Discover", feed: "News", events: "Events", merch: "Merch", hub: "Sources" },
    syncing: "Syncing...",
    livePrefix: "LIVE ·",
    codesBtn: "Codes",
    searchAria: "Global Search",
    searchTitle: "Global Search (⌘K / /)",
    bookmarkTitle: "Sources & Bookmarks",
    themeToLight: "Switch to Light Mode",
    themeToDark: "Switch to Dark Mode",
    codesBarBadge: "Active Codes",
    codesBarHint: "Click to copy",
    codesBarMore: "All Details & Redeem",
    codesModalTitle: "Zenless Zone Zero Active Redeem Codes",
    codesActiveSuffix: "active",
    officialRedeemBtn: "Official Redeem Site",
    copyOneClick: "Copy",
    expiringBadge: "Ending Soon",
    permanentLabel: "Permanent",
    deadlinePrefix: "Ends",
    expiredSectionTitle: "Recently Expired (Archive)",
    expiredPrefix: "Expired",
    codesFootNote: "Tip: Redeem in-game via More → Redemption Code, or use the official web redemption link above.",
    heroV34Tag: "UPCOMING · Version 3.4",
    heroV34Date: "Launches 2026/12/02",
    heroV34Title:
      'Version 3.4 "The Finality of the Day": First Enchainer Void Hunter Sunbringer & Free Crossover S-Rank Robin',
    heroV34Summary:
      'Launches Dec 2! Log in to claim free Honkai: Star Rail crossover S-Rank Agent Robin + custom Drive Discs, plus Encrypted Master Tape ×10, Boopon ×10, Polychrome ×2,320, and free Bangboo Pom-Pom.',
    heroV34Cta: "View Ver. 3.4 Benefits & Intel Report",
    heroFesTag: "UPCOMING · Annual ZZZ FES",
    heroFesCta: "View Hangzhou FES 2026 Official Gallery",
    heroZliveTag: "UPCOMING · Zenless LIVE 2026",
    heroZliveCta: "View ZLIVE 2026 Concert & Tickets",
    heroCollabTag: "LATEST COLLAB · Opening Soon",
    heroCollabCta: "View Collab Pop-Up & Limited Merch",
    dualCountdownTitle: "Major Milestone Countdowns",
    cdTabFes: "Hangzhou FES",
    cdTabV34: "Ver. 3.4",
    cdFesTitle: "2026 Hangzhou FES & Zenless LIVE Concert",
    cdFesSub: "Hangzhou Grand Convention Center Halls 4/5/6",
    cdV34Title: 'Ver. 3.4 "The Finality of the Day" · Free S-Rank Robin',
    cdV34Sub: "Void Hunter Sunbringer + Polychrome ×2,320 + 10 Pulls",
    cdUnits: ["Days", "Hrs", "Min", "Sec"],
    multiSourceTitle: "Official Multi-Source Live Feed",
    poolStatusLink: "Sources →",
    homeUpcomingKicker: "UPCOMING ONLY · FES · ZLIVE · LATEST COLLABS",
    homeUpcomingTitle: "Coming Up: Annual FES, ZLIVE & Latest Collabs",
    viewAllEvents: "All Events",
    officialMajorBadge: "Official",
    fanEventBadge: "Fan Event",
    photosCount: (n) => `${n} Photos`,
    homeMerchKicker: "LATEST MERCH & COLLAB GEAR",
    homeMerchTitle: "Latest Official Merch & Collab Drops",
    enterMerchLink: (n) => `Browse Merch (${n})`,
    viewMultiPhoto: "Gallery & Specs →",
    homeNewsKicker: "HIGH-PRIORITY OFFICIAL UPDATES",
    homeNewsTitle: "Priority Announcements & Version News",
    allNewsLink: (n) => `All ${n} Updates`,
    feedKicker: "MULTI-SOURCE LIVE FEED",
    feedTitle: "Real-Time Official News Aggregator",
    refreshOfficialBtn: "Sync Official Feeds",
    refreshingBtn: "Syncing...",
    feedPlaceholder: "Filter by version, Agent, event, or keyword...",
    allSourcesOpt: "All Sources",
    sortPriority: "Priority",
    sortLatest: "Latest",
    sortHeat: "Hot",
    allChannels: "All",
    noMatchingNews: "No matching updates found. Try clearing keywords or switching source.",
    heatLabel: "Heat",
    sourcesMentioned: (n) => `${n} sources`,
    daysLeft: (d) => `${d}d left`,
    eventsKicker: "FES · ZLIVE · COLLAB · FAN ONLY",
    eventsTitle: "Official Conventions, Brand Collabs & Fan Events",
    exportIcsBtn: "Export Calendar (.ics)",
    submitEventBtn: "Submit Event Tip",
    annualBadge: "Annual Flagship · Opening Soon",
    browseGalleryBtn: (n) => `View ${n} Official Images & Highlights`,
    ticketEntryBtn: "Ticket Details",
    fesCountdownLabel: "Hangzhou FES Opening Countdown",
    fesCountdownSub: "3 immersive exhibition halls plus nightly Zenless LIVE 2026 concerts at 17:30.",
    allTypesCount: (n) => `All (${n})`,
    officialEventsFilter: (n) => `Official & Collabs (${n})`,
    fanEventsFilter: (n) => `Fan Only & Live (${n})`,
    activeEventsTab: (n) => `Upcoming & Active (${n})`,
    pastEventsTab: (n) => `Past Events (${n})`,
    allSubTypes: "All Categories",
    noActiveEvents: "No active events match your current filters.",
    pastArchiveTitle: (n) => `Past Events Archive (${n} Ended)`,
    pastArchiveSub: "Includes Wuhan Happy Valley × Yadea, KFC Collab, Z·COMBO Pop-Up & Tokyo Signal Lost Live",
    expandPastBtn: "Show Past Events",
    collapsePastBtn: "Hide Past Events",
    pastArchiveHeader: "Concluded official collaborations and live concerts (newest first):",
    noPastEvents: "No past events match your current filters.",
    badgeOfficial: "Official",
    badgeUnofficial: "Fan Event",
    statusUpcoming: "Upcoming",
    statusOpen: "Tickets Open",
    statusPast: "Ended",
    detailAndGalleryBtn: "Photos & Details",
    officialOrTicketLink: "Official / Tickets",
    highlightsTitle: "Key Highlights",
    addToCalendarBtn: "Add to Calendar (.ics)",
    visitOfficialLinkBtn: "Open Official / Ticket Page",
    submitModalTitle: "Submit Official or Fan Event",
    merchKicker: "OFFICIAL MERCH · MULTI-IMAGE CATALOG",
    merchTitle: "Official Merch, ZZZ Studio & Collab Gear",
    checkMerchBtn: "Check New Drops",
    checkingMerchBtn: "Checking...",
    merchBannerTitle: "Version Drops + Regular Releases · Full Multi-Image Catalog",
    merchBannerSub: (time) => `Checked every 30 min · Last checked ${time}`,
    allCadence: (n) => `All Drops (${n})`,
    wishOnly: (n) => `Wishlist (${n})`,
    wishBudgetPrefix: "Wishlist Est.",
    allMerchCat: "All Categories",
    noMerchMatch: "No merch matches your current filters.",
    cutoffDaysLeft: (d) => `Closes in ${d}d`,
    shipDatePrefix: "Est. Ship",
    releaseDatePrefix: "Announced",
    merchDetailBtn: "Photos & Specs",
    wishedLabel: "Saved",
    wishAddLabel: "Wishlist",
    specsTitle: "Specifications & Highlights",
    channelsTitle: "Official Sales Channels",
    goBuyBtn: "Open Official Store / Info",
    galleryIndex: (i, total) => `Image ${i} / ${total}`,
    longImageProgress: (shown, total) => `Long Infographic · ${shown} / ${total} sections`,
    prevImg: "Prev",
    nextImg: "Next",
    fullImageBtn: "Full Size",
    expandNextSection: (next, total) => `Expand Next Section (${next} / ${total})`,
    expandFullLongBtn: "Expand Full Image",
    longCollapsedStatus: (isFull, shown, total) =>
      `${isFull ? "Full infographic shown" : `Sections 1–${shown} shown`} (${total} total)`,
    continueExpandBtn: "Expand Next Section",
    collapseToFirstBtn: "Collapse to Top",
    longBadge: "LONG",
    takeawaysTitle: "Key Takeaways",
    sourcePrefix: "Source: ",
    viewOriginalBtn: "Read Official Post",
    searchPlaceholder: "Search news, FES/collabs, figures/merch, redeem codes...",
    hotKeywordsTitle: "Trending Keywords",
    hotKeywords: ["3.4", "Sunbringer", "Robin", "Hangzhou FES", "ZLIVE", "Yuzuha", "Miyabi", "Codes"],
    searchTip: "Combine multiple keywords with spaces (e.g., Hangzhou FES)",
    noSearchHits: (q) => `No direct matches found for "${q}"`,
    searchTryHint: "Try searching: 3.4, Sunbringer, Robin, FES, Yuzuha, Codes",
    aiBriefTitle: "AI Quick Briefing (On-demand · 30m cache)",
    aiBriefBtn: "Generate AI Summary",
    aiBriefLoading: "Summarizing...",
    aiModelPrefix: "Model: ",
    aiCacheHitTag: " · Cached (0 tokens)",
    aiLiveTag: " · Live summary",
    groupEvents: "Events & Collabs",
    groupMerch: "Official Merch & Collabs",
    groupNews: "Official News",
    groupCodes: "Active Redeem Codes",
    actionPhotos: "Gallery →",
    actionDetail: "Details →",
    actionRead: "Read →",
    actionCopy: "Copy",
    hubKicker: "MULTI-SOURCE COLLECTOR & POOL",
    hubTitle: "Multi-Source Feeds, Live Collector & Pool",
    refresh5SourcesBtn: "Sync Official Feeds Now",
    liveSourcesCardTitle: "Live Direct Official Feeds",
    liveSourcesCardDesc: "Auto-syncs CN/Global/JP official sites, Miyoushe & HoYoLAB every 15 min with deduplication.",
    llmCardTitle: "LLM Pool Scheduler (server/llm.mjs)",
    llmEnrichBtn: "AI Batch Enrich",
    llmEnrichingBtn: "Enriching...",
    llmStatusDesc: (cached, today, limit) =>
      `${cached} summaries cached on disk (0 repeat cost) · Today ${today}/${limit}`,
    llmNotConfigured: "Configure server/pool.json to activate LLM / X / Bilibili pooling.",
    apiCardTitle: "Standard API & RSS Endpoints",
    sourceMatrixTitle: "Monitored Source Matrix",
    modeLive: "LIVE",
    modePool: "Pool Ready",
    modeRss: "RSS Feed",
    bookmarksKicker: "BOOKMARKS",
    bookmarksTitle: (n) => `Local Bookmarks (${n})`,
    noBookmarks: "No saved items yet. Click the bookmark icon on any card to save locally.",
    toastCodeCopied: (code) => `Copied code: ${code}`,
    toastBookmarked: "Saved to bookmarks",
    toastUnbookmarked: "Removed from bookmarks",
    toastWished: "Added to merch wishlist",
    toastUnwished: "Removed from merch wishlist",
    toastShareCopied: "Copied title & official link",
    toastSynced: (n) => `Synced ${n} live English official updates`,
  },
};

export const CAT_LABELS: Record<AppLang, Record<NewsCategory, string>> = {
  zh: { banner: "卡池与调频", event: "限时活动", agent: "代理人情报", patch: "版本与公告", collab: "联动与跨界", media: "影像与音乐", guide: "攻略与评测", code: "福利与兑换码" },
  ja: { banner: "変調・ガチャ", event: "イベント", agent: "エージェント", patch: "バージョン・お知らせ", collab: "コラボ", media: "映像・音楽", guide: "攻略", code: "特典・コード" },
  ko: { banner: "변조", event: "이벤트", agent: "에이전트", patch: "버전 · 공지", collab: "콜라보", media: "영상 · 음악", guide: "공략", code: "혜택 · 코드" },
  en: { banner: "Signal Search", event: "Events", agent: "Agents", patch: "Updates", collab: "Collabs", media: "Media", guide: "Guides", code: "Rewards" },
};

export const EVENT_TYPE_LABELS: Record<AppLang, Record<OfflineEventType, string>> = {
  zh: { fes: "FES 嘉年华", concert: "演唱会 / ZLIVE", collab_offline: "大型品牌联动", popup: "主题快闪店", fan_only: "同人 Only 展", fan_live: "同人演出 / 派对" },
  ja: { fes: "FES フェス", concert: "ライブ / ZLIVE", collab_offline: "大型コラボ", popup: "ポップアップ", fan_only: "オンリー即売会", fan_live: "ファンライブ" },
  ko: { fes: "FES 페스티벌", concert: "콘서트 / ZLIVE", collab_offline: "대형 콜라보", popup: "팝업스토어", fan_only: "온리전", fan_live: "팬 라이브" },
  en: { fes: "FES Expo", concert: "Concert / ZLIVE", collab_offline: "Major Collab", popup: "Pop-Up Store", fan_only: "Fan Only Expo", fan_live: "Fan Live / Party" },
};

export const MERCH_CADENCE_LABELS: Record<AppLang, Record<MerchCadence, string>> = {
  zh: { version_drop: "版本同步上新", daily_drop: "日常定期上新", collab_drop: "跨界品牌联名", fes_drop: "FES / 线下场贩" },
  ja: { version_drop: "Ver.連動新作", daily_drop: "定期新作", collab_drop: "ブランドコラボ", fes_drop: "FES 会場限定" },
  ko: { version_drop: "버전 연동 신상", daily_drop: "정기 신상", collab_drop: "브랜드 콜라보", fes_drop: "FES 현장 한정" },
  en: { version_drop: "Version Drop", daily_drop: "Regular Drop", collab_drop: "Brand Collab", fes_drop: "FES Exclusive" },
};

export const MERCH_CAT_LABELS: Record<AppLang, Record<MerchCategory, string>> = {
  zh: { figure: "典藏手办", bangboo: "邦布 / 盲盒", collab_merch: "跨界联名", goods: "徽章 / 立牌", apparel: "潮酷服饰 / 外设", fes_limited: "FES 限定" },
  ja: { figure: "フィギュア", bangboo: "ボンプ・ブラインド", collab_merch: "コラボ商品", goods: "アクスタ・缶バッジ", apparel: "アパレル・デバイス", fes_limited: "FES 限定" },
  ko: { figure: "피규어", bangboo: "Bangboo · 블라인드", collab_merch: "콜라보 상품", goods: "아크릴 · 배지", apparel: "어패럴 · 기기", fes_limited: "FES 한정" },
  en: { figure: "Figures", bangboo: "Bangboo & Blindbox", collab_merch: "Collab Gear", goods: "Stands & Badges", apparel: "Apparel & Tech", fes_limited: "FES Limited" },
};

export const MERCH_STATUS_LABELS: Record<AppLang, Record<MerchSaleStatus, string>> = {
  zh: { presale: "预售中", in_stock: "现货热卖", coming_soon: "即将发售", ending_soon: "截单临近" },
  ja: { presale: "予約受付中", in_stock: "販売中", coming_soon: "まもなく発売", ending_soon: "予約締切間近" },
  ko: { presale: "예약 판매 중", in_stock: "판매 중", coming_soon: "출시 예정", ending_soon: "예약 마감 임박" },
  en: { presale: "Pre-Order", in_stock: "In Stock", coming_soon: "Coming Soon", ending_soon: "Ending Soon" },
};

export const PLATFORM_LABELS: Record<AppLang, Partial<Record<SourcePlatformKey, string>>> = {
  zh: {},
  ja: {
    "zzz-cn": "中国公式",
    hoyoverse: "国際公式",
    "zzz-jp": "日本公式",
    miyoushe: "米遊社公式",
    hoyolab: "HoYoLAB",
    x: "公式 X",
    bilibili: "Bilibili公式",
    youtube: "YouTube",
    weibo: "Weibo公式",
    tmall: "Tmall公式店",
    douyin: "Douyin公式店",
    apex: "フィギュア公式",
    hpoi: "Hpoi",
    cpp: "CPP同人",
    ticket: "チケット",
    xhs: "Red/TapTap",
    fan: "ファン企画",
  },
  ko: {
    "zzz-cn": "중국 공식",
    hoyoverse: "글로벌 공식",
    "zzz-jp": "일본 공식",
    miyoushe: "미유사 공식",
    hoyolab: "HoYoLAB",
    x: "공식 X",
    bilibili: "Bilibili 공식",
    youtube: "YouTube",
    weibo: "웨이보 공식",
    tmall: "Tmall 공식샵",
    douyin: "도우인 공식샵",
    apex: "피규어 제조사",
    hpoi: "Hpoi",
    cpp: "CPP 동인",
    ticket: "티켓 예매",
    xhs: "샤오홍슈/Tap",
    fan: "팬 기획",
  },
  en: {
    "zzz-cn": "CN Official",
    hoyoverse: "Official",
    "zzz-jp": "JP Official",
    miyoushe: "Miyoushe",
    hoyolab: "HoYoLAB",
    x: "Official X",
    bilibili: "Bilibili",
    youtube: "YouTube",
    weibo: "Weibo",
    tmall: "Tmall Official",
    douyin: "Douyin Shop",
    apex: "Figure Maker",
    hpoi: "Hpoi DB",
    cpp: "CPP Fan",
    ticket: "Ticketing",
    xhs: "XHS / TapTap",
    fan: "Fan Project",
  },
};

export interface LangContextValue {
  lang: AppLang;
  setLang: (next: AppLang) => void;
  t: UiDict;
}

export const LangContext = createContext<LangContextValue>({
  lang: "zh",
  setLang: () => {},
  t: UI_DICT.zh,
});

export function useI18n() {
  return useContext(LangContext);
}
