export type NavTab = "home" | "feed" | "events" | "merch" | "hub";

export type NewsCategory =
  | "banner"
  | "event"
  | "agent"
  | "patch"
  | "collab"
  | "media"
  | "guide"
  | "code";

export type DeadlineKind =
  | "banner_end"
  | "event_end"
  | "reset"
  | "version_launch"
  | "discount_end"
  | "prereg_end"
  | "code_end";

export type SourceTier = "official" | "media" | "community";

export type SourcePlatformKey =
  | "zzz-cn"
  | "hoyoverse"
  | "zzz-jp"
  | "miyoushe"
  | "hoyolab"
  | "x"
  | "bilibili"
  | "youtube"
  | "weibo"
  | "tmall"
  | "douyin"
  | "apex"
  | "hpoi"
  | "cpp"
  | "ticket"
  | "xhs"
  | "taptap"
  | "nga"
  | "reddit"
  | "fan";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  body: string;
  takeaways: string[];
  category: NewsCategory;
  tags: string[];
  source: string;
  sourcePlatform: SourcePlatformKey;
  sourceTier: SourceTier;
  sourceCount: number;
  publishedAt: string;
  heat: number;
  isPick: boolean;
  isLiveOfficial?: boolean;
  coverUrl?: string;
  gallery?: string[];
  originalUrl: string;
  deadlineAt?: string;
  deadlineLabel?: string;
}

export interface DeadlineItem {
  id: string;
  title: string;
  subtitle: string;
  kind: DeadlineKind;
  at: string;
  timezoneLabel: string;
  factionId?: string;
  newsId?: string;
  rewardHint?: string;
}

export interface RedeemCode {
  code: string;
  rewards: string;
  region: "国服 / 国际服通用" | "国际服 / 亚服" | "国服米游社";
  expiresAt: string;
  status: "active" | "expiring" | "expired";
  note: string;
}

/* ---- Offline & Fan Events ---- */
export type OfflineEventType = "fes" | "concert" | "collab_offline" | "popup" | "fan_only" | "fan_live";
export type OfflineEventStatus = "upcoming" | "open" | "archive";

export interface OfflineEvent {
  id: string;
  title: string;
  subtitle: string;
  official: boolean;
  organizer: string;
  type: OfflineEventType;
  status: OfflineEventStatus;
  city: string;
  venue: string;
  dateRange: string;
  startAt: string;
  endAt?: string;
  ticketStatus: string;
  accent: string;
  coverUrl: string;
  gallery: string[];
  sourcePlatform: SourcePlatformKey;
  highlights: string[];
  description: string;
  sourceUrl: string;
}

/* ---- Official & Periodic Merch Drops ---- */
export type MerchCategory = "figure" | "bangboo" | "collab_merch" | "goods" | "apparel" | "fes_limited";
export type MerchCadence = "version_drop" | "daily_drop" | "collab_drop" | "fes_drop";
export type MerchSaleStatus = "presale" | "in_stock" | "coming_soon" | "ending_soon";

export interface MerchItem {
  id: string;
  name: string;
  series: string;
  category: MerchCategory;
  cadence: MerchCadence;
  saleStatus: MerchSaleStatus;
  priceText: string;
  priceNum: number;
  releaseDate: string;
  shipDate?: string;
  cutoffAt?: string;
  channels: string[];
  sourcePlatforms: SourcePlatformKey[];
  characterOrFaction: string;
  factionId?: string;
  coverUrl: string;
  gallery: string[];
  accent: string;
  specs: string[];
  summary: string;
  detailIntro: string;
  buyUrl: string;
  updatedAt: string;
}
