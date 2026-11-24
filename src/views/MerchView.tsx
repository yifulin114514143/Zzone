import React, { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Globe,
  Heart,
  Images,
  Info,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Tag,
  X,
} from "lucide-react";
import {
  MERCH_CADENCE_META,
  MERCH_CAT_META,
  MERCH_STATUS_META,
} from "../industry/merch";
import type { MerchCategory, MerchItem, MerchLine } from "../industry/types";
import { hexAlpha } from "../lib/color";
import {
  MERCH_CADENCE_LABELS,
  MERCH_CAT_LABELS,
  MERCH_STATUS_LABELS,
  useI18n,
  type AppLang,
} from "../lib/i18n";
import { partitionAndSortMerch } from "../lib/ranking";
import { formatHM, formatSlashMD, getCountdown } from "../lib/time";
import { ImageGallery } from "../components/ImageGallery";
import { SourceBadge } from "../components/SourceIcon";

type MerchTabMode = "active" | "archive";
type RegionFilter = "all" | "cn" | "overseas";
type MerchSortMode = "default" | "newest" | "price_asc" | "price_desc";

interface LiveAttrGroup {
  name: string;
  options: string[];
  total: number;
}

interface LiveDetailPayload {
  goodsId: string;
  gallery: string[];
  specs: string[];
  attrGroups: LiveAttrGroup[];
  notices: string[];
}

const PAGE_SIZE = 24;

const MERCH_VIEW_COPY: Record<
  AppLang,
  {
    closeDetail: string;
    refPrice: string;
    releaseLabel: string;
    shipLabel: string;
    shipFallback: string;
    wishBtnAdded: string;
    wishBtnAdd: string;
    lineGameTitle: string;
    lineGameSub: string;
    lineCollabTitle: string;
    lineCollabSub: string;
    statActive: (n: number) => string;
    statArchive: (n: number) => string;
    searchPlaceholderGame: string;
    searchPlaceholderCollab: string;
    activeTab: (n: number) => string;
    archiveTab: (n: number) => string;
    sortDefault: string;
    sortNewest: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    regionAll: string;
    regionCn: string;
    regionOverseas: string;
    soldOutBadge: string;
    globalBadge: string;
    jpBadge: string;
    featuredHeading: string;
    featuredDesc: string;
    catalogHeading: string;
    catalogDesc: string;
    collabActiveHeading: string;
    collabActiveDesc: string;
    archiveBarTitleGame: (n: number) => string;
    archiveBarSubGame: string;
    archiveBarTitleCollab: (n: number) => string;
    archiveBarSubCollab: string;
    expandArchive: string;
    collapseArchive: string;
    viewAllArchive: (n: number) => string;
    archiveHeaderGame: string;
    archiveHeaderCollab: string;
    noArchiveMatch: string;
    showingCount: (shown: number, total: number) => string;
    loadMore: (step: number) => string;
    loadingDetail: string;
    attrSectionTitle: string;
    moreOptionsSuffix: (n: number) => string;
    noticeTitle: string;
    goMiHoYoGiftBtn: string;
    goOfficialBtn: string;
    syncFoot: (shopTotal: number, time: string) => string;
    shortPhotos: (n: number) => string;
    wishAriaAdd: string;
    wishAriaRemove: string;
    resetFilters: string;
  }
> = {
  zh: {
    closeDetail: "关闭商品详情",
    refPrice: "官方参考价",
    releaseLabel: "上架 / 发售时间",
    shipLabel: "供应与发货",
    shipFallback: "以官方店铺公告为准",
    wishBtnAdded: "已在心愿单",
    wishBtnAdd: "加入心愿单",
    lineGameTitle: "游戏周边",
    lineGameSub: "手办雕像 · 三Z STUDIO · 谷子立牌 · 邦布 · FES 场贩",
    lineCollabTitle: "品牌联动",
    lineCollabSub: "雅迪 · 飞智 · 闪魂 · 泡泡玛特 · KFC · GiGO 等国内外联名",
    statActive: (n) => `在售 ${n}`,
    statArchive: (n) => `往期 ${n}`,
    searchPlaceholderGame: "搜索角色、系列或商品名（如：星见雅、立牌、邦布、键盘）",
    searchPlaceholderCollab: "搜索联名品牌或角色（如：雅迪、飞智、闪魂、泡泡玛特、GiGO）",
    activeTab: (n) => `在售 / 预售 (${n})`,
    archiveTab: (n) => `往期 / 售罄 (${n})`,
    sortDefault: "默认推荐",
    sortNewest: "最新上架",
    sortPriceAsc: "价格从低到高",
    sortPriceDesc: "价格从高到低",
    regionAll: "全部地区",
    regionCn: "国内",
    regionOverseas: "日区与海外",
    soldOutBadge: "已售罄",
    globalBadge: "全球同步",
    jpBadge: "日区限定",
    featuredHeading: "精选专题与旗舰新品",
    featuredDesc: "近期重点手办、FES 场贩与三Z STUDIO 多图档案",
    catalogHeading: "米游铺官方目录",
    catalogDesc: "1:1 官方棚拍实图 · 点击查看多图详览与全部款式",
    collabActiveHeading: "当前在售与即将开启",
    collabActiveDesc: "国内外品牌跨界联名实体商品与限定景品",
    archiveBarTitleGame: (n) => `往期截单与售罄归档（${n} 款）`,
    archiveBarSubGame: "含官方原声黑胶、星见雅 1/7 与粘土人、艾莲 1/7、狡兔屋初代 1/7 及官店售罄单品",
    archiveBarTitleCollab: (n) => `往期品牌联动归档（${n} 款）`,
    archiveBarSubCollab: "含 KFC、日本寿司郎、万代 SHF、泡泡玛特、荷美尔、茶百道、芬达、盖世小鸡、日本全家与麦当劳",
    expandArchive: "展开预览",
    collapseArchive: "收起",
    viewAllArchive: (n) => `查看全部 ${n} 款往期归档`,
    archiveHeaderGame: "已截单或售罄的游戏官方周边与手办档案，按发售时间由近到远排列。",
    archiveHeaderCollab: "已收官的国内外品牌跨界联名实体周边档案，按联动时间由近到远排列。",
    noArchiveMatch: "当前筛选条件下没有对应的往期周边。",
    showingCount: (shown, total) => `已展示 ${shown} / ${total} 款`,
    loadMore: (step) => `加载更多 (+${step} 款)`,
    loadingDetail: "正在拉取米游铺官方多图与款式规格...",
    attrSectionTitle: "可选款式与规格",
    moreOptionsSuffix: (n) => `共 ${n} 款`,
    noticeTitle: "官方购前提示",
    goMiHoYoGiftBtn: "前往米游铺选购",
    goOfficialBtn: "查看官方购买 / 情报页",
    syncFoot: (shopTotal, time) => `米游铺官店同步 ${shopTotal} 款 · ${time} 更新`,
    shortPhotos: (n) => `${n} 图`,
    wishAriaAdd: "加入心愿单",
    wishAriaRemove: "移出心愿单",
    resetFilters: "重置筛选条件",
  },
  ja: {
    closeDetail: "商品詳細を閉じる",
    refPrice: "公式参考価格",
    releaseLabel: "発売・掲載時期",
    shipLabel: "在庫・発送案内",
    shipFallback: "公式ストアの案内に準拠",
    wishBtnAdded: "リスト登録済",
    wishBtnAdd: "欲しい物に追加",
    lineGameTitle: "公式ゲームグッズ",
    lineGameSub: "フィギュア・三Z STUDIO・アクスタ・ボンプ・FES 物販",
    lineCollabTitle: "ブランドコラボ",
    lineCollabSub: "GiGO・スシロー・POP MART・Flydigi・Yadea 等の提携グッズ",
    statActive: (n) => `販売中 ${n}`,
    statArchive: (n) => `過去 ${n}`,
    searchPlaceholderGame: "キャラ・シリーズ・商品名を検索（星見雅、エレン、ボンプ等）",
    searchPlaceholderCollab: "コラボブランドを検索（GiGO、スシロー、POP MART、Yadea等）",
    activeTab: (n) => `販売・予約中 (${n})`,
    archiveTab: (n) => `過去・売切 (${n})`,
    sortDefault: "おすすめ順",
    sortNewest: "新着順",
    sortPriceAsc: "価格が安い順",
    sortPriceDesc: "価格が高い順",
    regionAll: "全地域",
    regionCn: "中国",
    regionOverseas: "日本・海外",
    soldOutBadge: "売切",
    globalBadge: "グローバル",
    jpBadge: "日本限定",
    featuredHeading: "注目の新作・ハイライト",
    featuredDesc: "大型フィギュア・FES 会場限定・三Z STUDIO 公式ギャラリー",
    catalogHeading: "miHoYoGift 公式カタログ",
    catalogDesc: "正方形公式カット · クリックで詳細画像とバリエーションを表示",
    collabActiveHeading: "販売中・開催予定のコラボグッズ",
    collabActiveDesc: "国内外ブランドとのタイアップ製品・限定プライズ",
    archiveBarTitleGame: (n) => `予約終了・売切アーカイブ（${n} 点）`,
    archiveBarSubGame: "公式LPレコード、星見雅 1/7・ねんどろいど、邪兎屋 1/7 および売切グッズ",
    archiveBarTitleCollab: (n) => `過去のブランドコラボアーカイブ（${n} 点）`,
    archiveBarSubCollab: "KFC、スシロー、S.H.Figuarts、POP MART、茶百道、ファミマ、マクドナルド等",
    expandArchive: "プレビューを開く",
    collapseArchive: "閉じる",
    viewAllArchive: (n) => `全 ${n} 点の過去アーカイブを見る`,
    archiveHeaderGame: "予約終了・完売済みの公式ゲームグッズ（新しい順）",
    archiveHeaderCollab: "終了済みの国内外ブランドコラボグッズ（新しい順）",
    noArchiveMatch: "条件に合う過去グッズはありません。",
    showingCount: (shown, total) => `${shown} / ${total} 点表示中`,
    loadMore: (step) => `さらに読み込む (+${step})`,
    loadingDetail: "公式ストアから詳細画像とバリエーションを取得中...",
    attrSectionTitle: "バリエーション・仕様",
    moreOptionsSuffix: (n) => `全 ${n} 種`,
    noticeTitle: "公式ストア案内",
    goMiHoYoGiftBtn: "miHoYoGift で見る",
    goOfficialBtn: "公式ページ・購入先へ",
    syncFoot: (shopTotal, time) => `miHoYoGift ${shopTotal} 点同期 · ${time} 更新`,
    shortPhotos: (n) => `${n} 枚`,
    wishAriaAdd: "欲しい物リストに追加",
    wishAriaRemove: "欲しい物リストから削除",
    resetFilters: "条件をリセット",
  },
  ko: {
    closeDetail: "상품 상세 닫기",
    refPrice: "공식 참고 가격",
    releaseLabel: "출시 / 등록 일자",
    shipLabel: "재고 및 발송 안내",
    shipFallback: "공식 스토어 공지 기준",
    wishBtnAdded: "위시리스트 담김",
    wishBtnAdd: "위시리스트 추가",
    lineGameTitle: "공식 게임 굿즈",
    lineGameSub: "피규어 · 삼Z STUDIO · 아크릴 · Bangboo · FES 한정",
    lineCollabTitle: "브랜드 콜라보",
    lineCollabSub: "GiGO · 스시로 · 팝마트 · 플라이디지 · 야디 등 협업 굿즈",
    statActive: (n) => `판매 중 ${n}`,
    statArchive: (n) => `지난 ${n}`,
    searchPlaceholderGame: "캐릭터, 시리즈, 상품명 검색 (호시미 미야비, 엘렌, Bangboo 등)",
    searchPlaceholderCollab: "콜라보 브랜드 검색 (GiGO, 스시로, 팝마트, 야디, KFC 등)",
    activeTab: (n) => `판매 · 예약 중 (${n})`,
    archiveTab: (n) => `지난 · 품절 (${n})`,
    sortDefault: "추천순",
    sortNewest: "최신순",
    sortPriceAsc: "낮은 가격순",
    sortPriceDesc: "높은 가격순",
    regionAll: "전체 지역",
    regionCn: "중국",
    regionOverseas: "일본 · 해외",
    soldOutBadge: "품절",
    globalBadge: "글로벌",
    jpBadge: "일본 한정",
    featuredHeading: "주요 신상 · 하이라이트",
    featuredDesc: "대표 피규어, FES 현장 한정, 삼Z STUDIO 상세 아카이브",
    catalogHeading: "miHoYoGift 공식 카탈로그",
    catalogDesc: "정방형 공식 상품 컷 · 클릭하여 상세 이미지 및 옵션 확인",
    collabActiveHeading: "판매 중 · 오픈 예정 콜라보",
    collabActiveDesc: "국내외 브랜드 협업 실물 제품 및 한정 경품",
    archiveBarTitleGame: (n) => `지난 마감 · 품절 아카이브 (${n}종)`,
    archiveBarSubGame: "공식 바이닐 LP, 호시미 미야비 1/7·넨도로이드, 교토옥 1/7 및 품절 굿즈",
    archiveBarTitleCollab: (n) => `지난 브랜드 콜라보 아카이브 (${n}종)`,
    archiveBarSubCollab: "KFC, 스시로, 반다이 SHF, 팝마트, 차바이따오, 패밀리마트, 맥도날드 등",
    expandArchive: "미리보기 펼치기",
    collapseArchive: "접기",
    viewAllArchive: (n) => `전체 ${n}종 아카이브 보기`,
    archiveHeaderGame: "예약 마감 및 품절된 공식 게임 굿즈 기록 (최신순)",
    archiveHeaderCollab: "종료된 국내외 브랜드 콜라보 굿즈 기록 (최신순)",
    noArchiveMatch: "조건에 맞는 지난 굿즈가 없습니다.",
    showingCount: (shown, total) => `${shown} / ${total}종 표시 중`,
    loadMore: (step) => `더 보기 (+${step}종)`,
    loadingDetail: "공식 스토어에서 상세 이미지와 옵션을 불러오는 중...",
    attrSectionTitle: "선택 가능한 옵션",
    moreOptionsSuffix: (n) => `총 ${n}종`,
    noticeTitle: "공식 구매 안내",
    goMiHoYoGiftBtn: "miHoYoGift에서 보기",
    goOfficialBtn: "공식 스토어 / 안내 이동",
    syncFoot: (shopTotal, time) => `miHoYoGift ${shopTotal}종 연동 · ${time} 업데이트`,
    shortPhotos: (n) => `${n}장`,
    wishAriaAdd: "위시리스트에 추가",
    wishAriaRemove: "위시리스트에서 제거",
    resetFilters: "필터 초기화",
  },
  en: {
    closeDetail: "Close merch details",
    refPrice: "Official Price",
    releaseLabel: "Release / Listed",
    shipLabel: "Availability & Shipping",
    shipFallback: "Subject to official store notice",
    wishBtnAdded: "In Wishlist",
    wishBtnAdd: "Add to Wishlist",
    lineGameTitle: "Game Merch",
    lineGameSub: "Figures · ZZZ Studio · Stands & Badges · Bangboo · FES Drops",
    lineCollabTitle: "Brand Collabs",
    lineCollabSub: "Yadea · Flydigi · POP MART · GiGO · KFC · Sushiro & more",
    statActive: (n) => `Active ${n}`,
    statArchive: (n) => `Past ${n}`,
    searchPlaceholderGame: "Search character, series, or item (Miyabi, Ellen, Bangboo, Figure)...",
    searchPlaceholderCollab: "Search collab brand or character (Yadea, Flydigi, POP MART, GiGO)...",
    activeTab: (n) => `Available (${n})`,
    archiveTab: (n) => `Past & Sold Out (${n})`,
    sortDefault: "Featured",
    sortNewest: "Newest",
    sortPriceAsc: "Price: Low to High",
    sortPriceDesc: "Price: High to Low",
    regionAll: "All Regions",
    regionCn: "China",
    regionOverseas: "JP & Global",
    soldOutBadge: "Sold Out",
    globalBadge: "Global",
    jpBadge: "JP Only",
    featuredHeading: "Featured Highlights",
    featuredDesc: "Flagship figures, FES exclusives & ZZZ Studio multi-photo dossiers",
    catalogHeading: "miHoYoGift Full Catalog",
    catalogDesc: "Square studio shots · Click any item to load full gallery & variants",
    collabActiveHeading: "Active & Upcoming Collabs",
    collabActiveDesc: "Cross-brand physical products, hardware & regional tie-up exclusives",
    archiveBarTitleGame: (n) => `Closed & Sold-Out Archive (${n})`,
    archiveBarSubGame: "Official OST Vinyl, Miyabi 1/7 & Nendoroid, Ellen 1/7, Cunning Hares 1/7 & sold-out goods",
    archiveBarTitleCollab: (n) => `Past Brand Collabs (${n})`,
    archiveBarSubCollab: "KFC, Sushiro JP, Bandai SHF, POP MART, Hormel, ChaPanda, Fanta, FamilyMart & McDonald's",
    expandArchive: "Preview Archive",
    collapseArchive: "Hide",
    viewAllArchive: (n) => `View all ${n} archived items`,
    archiveHeaderGame: "Closed pre-orders & sold-out official game merchandise (newest first).",
    archiveHeaderCollab: "Concluded domestic & overseas brand collaboration goods (newest first).",
    noArchiveMatch: "No archived merch matches your current filters.",
    showingCount: (shown, total) => `Showing ${shown} of ${total}`,
    loadMore: (step) => `Load +${step} More`,
    loadingDetail: "Loading full gallery & variant specs from miHoYoGift...",
    attrSectionTitle: "Available Variants",
    moreOptionsSuffix: (n) => `${n} total`,
    noticeTitle: "Official Store Notice",
    goMiHoYoGiftBtn: "View on miHoYoGift",
    goOfficialBtn: "Open Official Store / Info",
    syncFoot: (shopTotal, time) => `${shopTotal} items synced · Updated ${time}`,
    shortPhotos: (n) => `${n} pics`,
    wishAriaAdd: "Add to wishlist",
    wishAriaRemove: "Remove from wishlist",
    resetFilters: "Reset filters",
  },
};

function getItemSortTime(item: MerchItem): number {
  const m = (item.releaseDate || "").match(/(20\d{2})[-./年](\d{1,2})(?:[-./月](\d{1,2}))?/);
  if (m) {
    const ts = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3] || 15)).getTime();
    if (!Number.isNaN(ts)) return ts;
  }
  const upd = new Date(item.updatedAt).getTime();
  return Number.isNaN(upd) ? 0 : upd;
}

function formatShortReleaseDate(item: MerchItem): string {
  const m = (item.releaseDate || "").match(/(20\d{2})[-./年](\d{1,2})(?:[-./月](\d{1,2}))?/);
  if (m) {
    return `${m[1].slice(2)}/${String(m[2]).padStart(2, "0")}`;
  }
  return item.releaseDate.slice(0, 10);
}

interface MerchViewProps {
  items: MerchItem[];
  wishlist: Set<string>;
  lastCheckedAt: string;
  isChecking: boolean;
  initialMerchId?: string | null;
  onClearInitialMerch?: () => void;
  onCheckMerch: () => void;
  onToggleWish: (id: string) => void;
}

export const MerchView: React.FC<MerchViewProps> = ({
  items,
  wishlist,
  lastCheckedAt,
  isChecking,
  initialMerchId,
  onClearInitialMerch,
  onCheckMerch,
  onToggleWish,
}) => {
  const { lang, t } = useI18n();
  const copy = MERCH_VIEW_COPY[lang];
  const cadenceLabels = MERCH_CADENCE_LABELS[lang];
  const catLabels = MERCH_CAT_LABELS[lang];
  const statusLabels = MERCH_STATUS_LABELS[lang];

  const [merchLine, setMerchLine] = useState<MerchLine>("game");
  const [tabMode, setTabMode] = useState<MerchTabMode>("active");
  const [category, setCategory] = useState<MerchCategory | "all">("all");
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [sortMode, setSortMode] = useState<MerchSortMode>("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyWish, setOnlyWish] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [showArchiveDrawer, setShowArchiveDrawer] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [liveDetail, setLiveDetail] = useState<LiveDetailPayload | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const selected = useMemo(
    () => (selectedId ? items.find((m) => m.id === selectedId) ?? null : null),
    [items, selectedId]
  );

  // Support ESC key to close detail modal
  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  // Auto-switch to the target item's merchLine when opened via Home or Global Search
  useEffect(() => {
    if (!initialMerchId) return;
    const found = items.find((m) => m.id === initialMerchId);
    if (found) {
      setMerchLine(found.merchLine === "collab" ? "collab" : "game");
      setSelectedId(found.id);
    }
    onClearInitialMerch?.();
  }, [initialMerchId, items, onClearInitialMerch]);

  // Reset pagination whenever filters or sort change
  useEffect(() => {
    setVisibleLimit(PAGE_SIZE);
  }, [merchLine, tabMode, category, regionFilter, sortMode, searchQuery, onlyWish]);

  // On-demand fetch full official gallery & structured variants when opening a miHoYoGift item
  useEffect(() => {
    setLiveDetail(null);
    if (!selected?.mihoyogiftId) return;
    let cancelled = false;
    setLoadingDetail(true);
    fetch(`/api/v1/merch/detail?goods_id=${encodeURIComponent(selected.mihoyogiftId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.ok) {
          setLiveDetail({
            goodsId: d.goodsId,
            gallery: Array.isArray(d.gallery) ? d.gallery : [],
            specs: Array.isArray(d.specs) ? d.specs : [],
            attrGroups: Array.isArray(d.attrGroups) ? d.attrGroups : [],
            notices: Array.isArray(d.notices) ? d.notices : [],
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected?.id, selected?.mihoyogiftId]);

  const gameItems = useMemo(
    () => items.filter((m) => m.merchLine !== "collab"),
    [items]
  );
  const collabItems = useMemo(
    () => items.filter((m) => m.merchLine === "collab"),
    [items]
  );
  const liveShopCount = useMemo(
    () => items.filter((m) => Boolean(m.mihoyogiftId)).length,
    [items]
  );

  const gamePartition = useMemo(() => partitionAndSortMerch(gameItems), [gameItems]);
  const collabPartition = useMemo(() => partitionAndSortMerch(collabItems), [collabItems]);

  const { active: allActiveMerch, archived: allArchivedMerch } =
    merchLine === "game" ? gamePartition : collabPartition;

  const normalizedTerms = useMemo(
    () =>
      searchQuery
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean),
    [searchQuery]
  );

  const matchesNonCatFilters = (m: MerchItem) => {
    if (regionFilter === "cn" && m.region && m.region !== "cn") return false;
    if (regionFilter === "overseas" && m.region !== "global" && m.region !== "jp") return false;
    if (onlyWish && !wishlist.has(m.id)) return false;
    if (normalizedTerms.length > 0) {
      const hay = `${m.name} ${m.series} ${m.characterOrFaction} ${m.summary} ${m.channels.join(" ")}`.toLowerCase();
      if (!normalizedTerms.every((term) => hay.includes(term))) return false;
    }
    return true;
  };

  const applySort = (list: MerchItem[]): MerchItem[] => {
    if (sortMode === "default") return list;
    const next = [...list];
    if (sortMode === "newest") {
      next.sort((a, b) => getItemSortTime(b) - getItemSortTime(a));
    } else if (sortMode === "price_asc") {
      next.sort((a, b) => (a.priceNum || 0) - (b.priceNum || 0));
    } else if (sortMode === "price_desc") {
      next.sort((a, b) => (b.priceNum || 0) - (a.priceNum || 0));
    }
    return next;
  };

  const activePreCat = useMemo(
    () => allActiveMerch.filter(matchesNonCatFilters),
    [allActiveMerch, regionFilter, onlyWish, wishlist, normalizedTerms]
  );
  const archivedPreCat = useMemo(
    () => allArchivedMerch.filter(matchesNonCatFilters),
    [allArchivedMerch, regionFilter, onlyWish, wishlist, normalizedTerms]
  );

  // Live per-category counts for the currently selected status tab
  const currentTabBase = tabMode === "active" ? activePreCat : archivedPreCat;
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: currentTabBase.length };
    for (const m of currentTabBase) {
      counts[m.category] = (counts[m.category] || 0) + 1;
    }
    return counts;
  }, [currentTabBase]);

  const activeFiltered = useMemo(() => {
    const list = category === "all" ? activePreCat : activePreCat.filter((m) => m.category === category);
    return applySort(list);
  }, [activePreCat, category, sortMode]);

  const archivedFiltered = useMemo(() => {
    const list = category === "all" ? archivedPreCat : archivedPreCat.filter((m) => m.category === category);
    return applySort(list);
  }, [archivedPreCat, category, sortMode]);

  const wishTotal = useMemo(
    () => items.filter((m) => wishlist.has(m.id)).reduce((sum, m) => sum + m.priceNum, 0),
    [items, wishlist]
  );

  const checkedTimeLabel = `${formatSlashMD(lastCheckedAt)} ${formatHM(lastCheckedAt)}`;

  const categoryChoices: MerchCategory[] =
    merchLine === "game"
      ? ["figure", "goods", "bangboo", "apparel", "fes_limited"]
      : ["collab_merch", "figure", "bangboo"];

  // In default Game Merch -> Active view (no search / default sort / not wishlist-only),
  // present curated multi-photo highlights cleanly above the 4-col square miHoYoGift catalog.
  const useSplitGameShowcase =
    merchLine === "game" &&
    tabMode === "active" &&
    sortMode === "default" &&
    normalizedTerms.length === 0 &&
    !onlyWish;

  const curatedActive = useMemo(
    () => (useSplitGameShowcase ? activeFiltered.filter((m) => !m.mihoyogiftId) : []),
    [useSplitGameShowcase, activeFiltered]
  );
  const catalogActive = useMemo(
    () => (useSplitGameShowcase ? activeFiltered.filter((m) => Boolean(m.mihoyogiftId)) : []),
    [useSplitGameShowcase, activeFiltered]
  );

  const hasActiveFilters =
    category !== "all" || regionFilter !== "all" || onlyWish || normalizedTerms.length > 0;

  const resetAllFilters = () => {
    setCategory("all");
    setRegionFilter("all");
    setOnlyWish(false);
    setSearchQuery("");
    setSortMode("default");
  };

  /** Editorial 16:10 showcase card for curated multi-photo drops & brand collabs */
  const renderEditorialCard = (item: MerchItem, isArchivedCard = false) => {
    const catMeta = MERCH_CAT_META[item.category];
    const stMeta = MERCH_STATUS_META[item.saleStatus];
    const wished = wishlist.has(item.id);
    const cutoffCd = item.cutoffAt && !isArchivedCard ? getCountdown(item.cutoffAt) : null;
    const statusText = item.soldOut ? copy.soldOutBadge : statusLabels[item.saleStatus];

    // Only surface a top-left highlight pill when it adds real distinction
    const topLeftPill =
      item.cadence === "fes_drop"
        ? cadenceLabels.fes_drop
        : item.cadence === "version_drop"
        ? cadenceLabels.version_drop
        : item.region === "jp"
        ? copy.jpBadge
        : catLabels[item.category];

    return (
      <article
        key={item.id}
        className="merch-card"
        style={isArchivedCard ? { opacity: 0.88 } : undefined}
      >
        <div className="merch-photo-wrap" onClick={() => setSelectedId(item.id)}>
          <img src={item.coverUrl} alt={item.name} loading="lazy" />
          <div className="merch-photo-scrim" />

          <div className="media-overlay-top">
            <span className="cat-pill">
              <span className="cat-dot" style={{ "--cc": catMeta.color } as React.CSSProperties} />
              {topLeftPill}
            </span>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                className="cat-pill"
                style={{ borderColor: hexAlpha(stMeta.color, 0.5) }}
              >
                <span className="cat-dot" style={{ "--cc": stMeta.color } as React.CSSProperties} />
                {statusText}
              </span>
              <button
                type="button"
                className={`merch-heart-fab ${wished ? "wished" : ""}`}
                aria-label={wished ? copy.wishAriaRemove : copy.wishAriaAdd}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWish(item.id);
                }}
              >
                <Heart size={13.5} fill={wished ? "currentColor" : "none"} />
              </button>
            </div>
          </div>

          {item.gallery.length > 1 && (
            <div className="merch-photo-bottom" style={{ justifyContent: "flex-end" }}>
              <span className="photo-count-pill">
                <Images size={11} /> {copy.shortPhotos(item.gallery.length)}
              </span>
            </div>
          )}
        </div>

        <div className="merch-card-body">
          <div className="merch-card-kicker">
            <span className="merch-card-series">{item.characterOrFaction}</span>
            {item.region === "global" && (
              <span className="merch-card-region">
                <Globe size={10} /> {copy.globalBadge}
              </span>
            )}
            {item.region === "jp" && (
              <span className="merch-card-region">
                <Globe size={10} /> {copy.jpBadge}
              </span>
            )}
          </div>

          <h3 style={{ margin: 0 }}>
            <button
              type="button"
              className="news-title"
              style={{ fontSize: 15 }}
              onClick={() => setSelectedId(item.id)}
            >
              {item.name}
            </button>
          </h3>

          <p className="news-excerpt">{item.summary}</p>

          <div className="merch-card-foot">
            <span className="merch-price" style={{ fontSize: 17.5, whiteSpace: "nowrap" }}>
              {item.priceText}
            </span>
            {cutoffCd && !cutoffCd.expired ? (
              <span className="mono" style={{ fontSize: 11, color: "var(--rose)", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", flexShrink: 0 }}>
                <Clock size={11} /> {t.cutoffDaysLeft(cutoffCd.days)}
              </span>
            ) : (
              <span className="mono" style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", flexShrink: 0 }}>
                {formatShortReleaseDate(item)}
              </span>
            )}
          </div>
        </div>
      </article>
    );
  };

  /** Clean 1:1 square studio catalog card for miHoYoGift live SKUs */
  const renderSquareSkuCard = (item: MerchItem, isArchivedCard = false) => {
    const stMeta = MERCH_STATUS_META[item.saleStatus];
    const wished = wishlist.has(item.id);
    const showCornerBadge = item.soldOut || item.saleStatus === "presale" || item.category === "fes_limited";
    const cornerLabel = item.soldOut
      ? copy.soldOutBadge
      : item.category === "fes_limited"
      ? catLabels.fes_limited
      : statusLabels[item.saleStatus];

    const kickerText =
      item.characterOrFaction && item.characterOrFaction !== item.series
        ? `${item.characterOrFaction} · ${item.series}`
        : item.series;

    return (
      <article
        key={item.id}
        className={`merch-sku-card ${isArchivedCard ? "is-archived" : ""}`}
      >
        <div className="merch-sku-media" onClick={() => setSelectedId(item.id)}>
          <img src={item.coverUrl} alt={item.name} loading="lazy" />

          <div className="merch-sku-overlay">
            {showCornerBadge ? (
              <span
                className="cat-pill"
                style={{ borderColor: hexAlpha(stMeta.color, 0.5) }}
              >
                <span className="cat-dot" style={{ "--cc": stMeta.color } as React.CSSProperties} />
                {cornerLabel}
              </span>
            ) : (
              <span />
            )}
            <button
              type="button"
              className={`merch-heart-fab ${wished ? "wished" : ""}`}
              aria-label={wished ? copy.wishAriaRemove : copy.wishAriaAdd}
              onClick={(e) => {
                e.stopPropagation();
                onToggleWish(item.id);
              }}
            >
              <Heart size={13} fill={wished ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        <div className="merch-sku-body" onClick={() => setSelectedId(item.id)}>
          <div className="merch-sku-series">{kickerText}</div>
          <h3 className="merch-sku-title">{item.name}</h3>
          <div className="merch-sku-foot">
            <span className="merch-sku-price">{item.priceText}</span>
            <span className="merch-sku-date">
              {item.soldOut ? copy.soldOutBadge : formatShortReleaseDate(item)}
            </span>
          </div>
        </div>
      </article>
    );
  };

  /** Unified renderer when mixing curated & square items (search, price sort, or archive tab) */
  const renderAdaptiveGrid = (list: MerchItem[], isArchivedGrid = false) => {
    const allSquare = list.length > 0 && list.every((m) => Boolean(m.mihoyogiftId));
    const hasSquare = list.some((m) => Boolean(m.mihoyogiftId));
    if (allSquare || (merchLine === "game" && hasSquare && list.length >= 6)) {
      return (
        <div className="merch-catalog-grid">
          {list.map((item) => renderSquareSkuCard(item, isArchivedGrid))}
        </div>
      );
    }
    return (
      <div className="merch-grid">
        {list.map((item) => renderEditorialCard(item, isArchivedGrid))}
      </div>
    );
  };

  const shownCatalogActive = catalogActive.slice(0, visibleLimit);
  const shownActiveUnified = activeFiltered.slice(0, visibleLimit);
  const shownArchived = archivedFiltered.slice(0, visibleLimit);

  const modalGallery =
    liveDetail && liveDetail.gallery.length > 0 ? liveDetail.gallery : selected?.gallery || [];
  const modalAttrGroups = liveDetail?.attrGroups || [];
  const modalNotices = liveDetail?.notices || [];
  const modalSpecs = selected?.specs || [];

  const modalMetaLine = selected
    ? selected.characterOrFaction && selected.characterOrFaction !== selected.series
      ? `${selected.series} · ${selected.characterOrFaction}`
      : selected.series
    : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Clean Page Header */}
      <div className="section-head" style={{ marginBottom: 0 }}>
        <div className="section-title-group">
          <h1 className="section-title">{t.merchTitle}</h1>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className={`wish-btn ${onlyWish ? "wished" : ""}`}
            style={{ height: 34, padding: "0 13px" }}
            onClick={() => setOnlyWish((v) => !v)}
          >
            <Heart size={13.5} fill={onlyWish ? "currentColor" : "none"} />
            {t.wishOnly(wishlist.size)}
            {wishTotal > 0 ? ` · ¥${wishTotal}` : ""}
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ height: 34, fontSize: 12.5 }}
            onClick={onCheckMerch}
            disabled={isChecking}
          >
            <RefreshCw size={13.5} className={isChecking ? "spin" : ""} />
            {isChecking ? t.checkingMerchBtn : t.checkMerchBtn}
          </button>
        </div>
      </div>

      {/* Primary Two-Track Separation: Game Merch vs Brand Collabs */}
      <div className="merch-track-tabs" role="tablist" aria-label={t.merchTitle}>
        <button
          type="button"
          role="tab"
          aria-selected={merchLine === "game"}
          className={`merch-track-card ${merchLine === "game" ? "is-active-game" : ""}`}
          onClick={() => {
            setMerchLine("game");
            setCategory("all");
            setShowArchiveDrawer(false);
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
            <div className="merch-track-icon">
              <Store size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="merch-track-title">{copy.lineGameTitle}</div>
              <div className="merch-track-sub">{copy.lineGameSub}</div>
            </div>
          </div>
          <div className="merch-track-stat">
            <span className="merch-track-num">{gameItems.length}</span>
            <span className="merch-track-breakdown">
              {copy.statActive(gamePartition.active.length)} · {copy.statArchive(gamePartition.archived.length)}
            </span>
          </div>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={merchLine === "collab"}
          className={`merch-track-card ${merchLine === "collab" ? "is-active-collab" : ""}`}
          onClick={() => {
            setMerchLine("collab");
            setCategory("all");
            setShowArchiveDrawer(false);
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
            <div className="merch-track-icon">
              <Tag size={17} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="merch-track-title">{copy.lineCollabTitle}</div>
              <div className="merch-track-sub">{copy.lineCollabSub}</div>
            </div>
          </div>
          <div className="merch-track-stat">
            <span className="merch-track-num">{collabItems.length}</span>
            <span className="merch-track-breakdown">
              {copy.statActive(collabPartition.active.length)} · {copy.statArchive(collabPartition.archived.length)}
            </span>
          </div>
        </button>
      </div>

      {/* Compact Unified Search, Status Switch, Sort & Category Filters */}
      <div className="panel merch-toolbar">
        <div className="merch-toolbar-top">
          <div className="search-input-wrap" style={{ flex: 1, maxWidth: 460 }}>
            <Search size={15} color="var(--text-3)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                merchLine === "game"
                  ? copy.searchPlaceholderGame
                  : copy.searchPlaceholderCollab
              }
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
                style={{ border: "none", background: "none", padding: 2, color: "var(--text-3)", display: "grid", placeItems: "center" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="merch-toolbar-controls">
            <div className="merch-seg-tabs">
              <button
                type="button"
                className={`merch-seg-btn ${tabMode === "active" ? "active" : ""}`}
                onClick={() => setTabMode("active")}
              >
                {copy.activeTab(allActiveMerch.length)}
              </button>
              <button
                type="button"
                className={`merch-seg-btn ${tabMode === "archive" ? "active-muted" : ""}`}
                onClick={() => setTabMode("archive")}
              >
                <Archive size={12} /> {copy.archiveTab(allArchivedMerch.length)}
              </button>
            </div>

            <label className="merch-sort-wrap">
              <ArrowUpDown size={13} color="var(--text-3)" />
              <select
                className="merch-sort-select"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as MerchSortMode)}
                aria-label="Sort"
              >
                <option value="default">{copy.sortDefault}</option>
                <option value="newest">{copy.sortNewest}</option>
                <option value="price_asc">{copy.sortPriceAsc}</option>
                <option value="price_desc">{copy.sortPriceDesc}</option>
              </select>
            </label>
          </div>
        </div>

        <div className="toolbar-row">
          <div className="chip-scroll">
            <button
              type="button"
              className={`chip ${category === "all" ? "active" : ""}`}
              onClick={() => setCategory("all")}
            >
              {t.allMerchCat}
              <span className="chip-count">{categoryCounts.all ?? 0}</span>
            </button>
            {categoryChoices.map((k) => {
              const count = categoryCounts[k] ?? 0;
              return (
                <button
                  key={k}
                  type="button"
                  className={`chip ${category === k ? "active" : ""}`}
                  style={count === 0 && category !== k ? { opacity: 0.48 } : undefined}
                  onClick={() => setCategory(k)}
                >
                  {catLabels[k]}
                  <span className="chip-count">{count}</span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flex: "1 1 auto",
            }}
          >
            <div className="chip-scroll">
              {(
                [
                  ["all", copy.regionAll],
                  ["cn", copy.regionCn],
                  ["overseas", copy.regionOverseas],
                ] as Array<[RegionFilter, string]>
              ).map(([rk, label]) => (
                <button
                  key={rk}
                  type="button"
                  className={`chip ${regionFilter === rk ? "active" : ""}`}
                  style={{ padding: "5px 11px", fontSize: 12 }}
                  onClick={() => setRegionFilter(rk)}
                >
                  {rk === "overseas" && <Globe size={11} />}
                  {label}
                </button>
              ))}
            </div>

            {liveShopCount > 0 && merchLine === "game" && (
              <span className="merch-sync-meta mono" style={{ marginLeft: "auto" }}>
                <span className="live-dot-quiet" />
                {copy.syncFoot(liveShopCount, checkedTimeLabel)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Primary Content Area */}
      {tabMode === "active" ? (
        <>
          {activeFiltered.length === 0 ? (
            <div className="panel" style={{ textAlign: "center", padding: "44px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <span style={{ color: "var(--text-3)", fontSize: 14 }}>{t.noMerchMatch}</span>
              {hasActiveFilters && (
                <button type="button" className="btn-secondary" onClick={resetAllFilters}>
                  {copy.resetFilters}
                </button>
              )}
            </div>
          ) : useSplitGameShowcase ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {/* Tier 1: Curated Editorial Multi-Photo Highlights */}
              {curatedActive.length > 0 && (
                <section>
                  <div className="merch-subhead">
                    <h2 className="merch-subhead-title">
                      {copy.featuredHeading}
                      <span className="merch-subhead-count">{curatedActive.length}</span>
                    </h2>
                    <span className="merch-subhead-desc">{copy.featuredDesc}</span>
                  </div>
                  <div className="merch-grid">
                    {curatedActive.map((item) => renderEditorialCard(item, false))}
                  </div>
                </section>
              )}

              {/* Tier 2: Full Official miHoYoGift 1:1 Square Catalog */}
              {catalogActive.length > 0 && (
                <section>
                  <div className="merch-subhead">
                    <h2 className="merch-subhead-title">
                      {copy.catalogHeading}
                      <span className="merch-subhead-count">{catalogActive.length}</span>
                    </h2>
                    <span className="merch-subhead-desc">{copy.catalogDesc}</span>
                  </div>

                  <div className="merch-catalog-grid">
                    {shownCatalogActive.map((item) => renderSquareSkuCard(item, false))}
                  </div>

                  {catalogActive.length > shownCatalogActive.length && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20 }}>
                      <span className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>
                        {copy.showingCount(shownCatalogActive.length, catalogActive.length)}
                      </span>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setVisibleLimit((v) => v + PAGE_SIZE)}
                      >
                        {copy.loadMore(Math.min(PAGE_SIZE, catalogActive.length - shownCatalogActive.length))}
                      </button>
                    </div>
                  )}
                </section>
              )}
            </div>
          ) : (
            <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {merchLine === "collab" && !hasActiveFilters && (
                <div className="merch-subhead" style={{ marginBottom: 0 }}>
                  <h2 className="merch-subhead-title">
                    {copy.collabActiveHeading}
                    <span className="merch-subhead-count">{activeFiltered.length}</span>
                  </h2>
                  <span className="merch-subhead-desc">{copy.collabActiveDesc}</span>
                </div>
              )}

              {renderAdaptiveGrid(shownActiveUnified, false)}

              {activeFiltered.length > shownActiveUnified.length && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 6 }}>
                  <span className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>
                    {copy.showingCount(shownActiveUnified.length, activeFiltered.length)}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setVisibleLimit((v) => v + PAGE_SIZE)}
                  >
                    {copy.loadMore(Math.min(PAGE_SIZE, activeFiltered.length - shownActiveUnified.length))}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Collapsible Past Archive Preview with Direct Full-Tab Jump */}
          {archivedFiltered.length > 0 && (
            <section className="panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Archive size={16} color="var(--text-3)" />
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 800 }}>
                      {merchLine === "game"
                        ? copy.archiveBarTitleGame(archivedFiltered.length)
                        : copy.archiveBarTitleCollab(archivedFiltered.length)}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                      {merchLine === "game" ? copy.archiveBarSubGame : copy.archiveBarSubCollab}
                    </div>
                  </div>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ height: 32, fontSize: 12 }}
                    onClick={() => setShowArchiveDrawer((v) => !v)}
                  >
                    {showArchiveDrawer ? (
                      <>
                        <ChevronUp size={14} /> {copy.collapseArchive}
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} /> {copy.expandArchive}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="ghost-link"
                    style={{ fontSize: 12 }}
                    onClick={() => {
                      setTabMode("archive");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    {copy.viewAllArchive(archivedFiltered.length)} <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              {showArchiveDrawer && (
                <>
                  {renderAdaptiveGrid(archivedFiltered.slice(0, 12), true)}
                  {archivedFiltered.length > 12 && (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setTabMode("archive");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        {copy.viewAllArchive(archivedFiltered.length)} <ArrowRight size={13.5} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </>
      ) : (
        <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>
            {merchLine === "game" ? copy.archiveHeaderGame : copy.archiveHeaderCollab}
          </div>
          {archivedFiltered.length === 0 ? (
            <div className="panel" style={{ textAlign: "center", padding: "44px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <span style={{ color: "var(--text-3)", fontSize: 14 }}>{copy.noArchiveMatch}</span>
              {hasActiveFilters && (
                <button type="button" className="btn-secondary" onClick={resetAllFilters}>
                  {copy.resetFilters}
                </button>
              )}
            </div>
          ) : (
            <>
              {renderAdaptiveGrid(shownArchived, true)}
              {archivedFiltered.length > shownArchived.length && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 6 }}>
                  <span className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>
                    {copy.showingCount(shownArchived.length, archivedFiltered.length)}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setVisibleLimit((v) => v + PAGE_SIZE)}
                  >
                    {copy.loadMore(Math.min(PAGE_SIZE, archivedFiltered.length - shownArchived.length))}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Multi-Image Merch Detail Modal */}
      {selected && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={selected.name}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
        >
          <div className="modal-sheet" style={{ width: "min(860px, 100%)" }}>
            <div className="modal-head">
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 7 }}>
                <span
                  className={`cadence-pill ${
                    selected.merchLine === "collab"
                      ? "cadence-daily"
                      : MERCH_CADENCE_META[selected.cadence].cssClass
                  }`}
                >
                  {selected.merchLine === "collab" ? copy.lineCollabTitle : copy.lineGameTitle}
                </span>
                <span
                  className="faction-pill"
                  style={{
                    borderColor: hexAlpha(MERCH_STATUS_META[selected.saleStatus].color, 0.45),
                  }}
                >
                  <span
                    className="cat-dot"
                    style={{ "--cc": MERCH_STATUS_META[selected.saleStatus].color } as React.CSSProperties}
                  />
                  {selected.soldOut ? copy.soldOutBadge : statusLabels[selected.saleStatus]}
                </span>
                {(selected.region === "global" || selected.region === "jp") && (
                  <span className="faction-pill">
                    <Globe size={11} />
                    {selected.region === "jp" ? copy.jpBadge : copy.globalBadge}
                  </span>
                )}
                {selected.sourcePlatforms.slice(0, 2).map((sp) => (
                  <SourceBadge key={sp} platform={sp} />
                ))}
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label={copy.closeDetail}
                onClick={() => setSelectedId(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div>
                <div className="mono" style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>
                  {modalMetaLine}
                </div>
                <h2 style={{ margin: 0, fontSize: 21, fontWeight: 900, lineHeight: 1.34 }}>
                  {selected.name}
                </h2>
              </div>

              {loadingDetail && (
                <div className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>
                  {copy.loadingDetail}
                </div>
              )}

              <ImageGallery images={modalGallery} alt={selected.name} />

              <div className="grid-3" style={{ gap: 10 }}>
                <div className="voice-bubble">
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{copy.refPrice}</span>
                  <strong className="merch-price" style={{ fontSize: 18 }}>
                    {selected.priceText}
                  </strong>
                </div>
                <div className="voice-bubble">
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{copy.releaseLabel}</span>
                  <strong style={{ fontSize: 13 }}>{selected.releaseDate}</strong>
                </div>
                <div className="voice-bubble">
                  <span style={{ fontSize: 11.5, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <PackageCheck size={12} /> {copy.shipLabel}
                  </span>
                  <strong style={{ fontSize: 13 }}>{selected.shipDate || copy.shipFallback}</strong>
                </div>
              </div>

              {/* Structured Variant Chips (live from miHoYoGift SKU detail) */}
              {modalAttrGroups.length > 0 && (
                <div className="merch-attr-panel">
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>
                    {copy.attrSectionTitle}
                  </div>
                  {modalAttrGroups.map((grp, idx) => (
                    <div key={`${grp.name}-${idx}`} className="merch-attr-group">
                      <div className="merch-attr-label">
                        <span>{grp.name}</span>
                        {grp.total > 1 && (
                          <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                            {copy.moreOptionsSuffix(grp.total)}
                          </span>
                        )}
                      </div>
                      <div className="merch-attr-chips">
                        {grp.options.map((opt) => (
                          <span key={opt} className="merch-attr-chip">
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Curated Specs & Bonus Highlights */}
              {modalSpecs.length > 0 && (
                <div className="takeaway-box">
                  <div style={{ fontSize: 13, fontWeight: 800 }}>
                    {t.specsTitle}
                  </div>
                  <ul>
                    {modalSpecs.map((sp, i) => (
                      <li key={i} style={{ fontSize: 13.5, color: "var(--text-2)" }}>
                        {sp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Official Store Notices (when returned by miHoYoGift) */}
              {modalNotices.length > 0 && (
                <div className="merch-notice-box">
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, color: "var(--gold-text)", marginBottom: 4 }}>
                    <Info size={13} /> {copy.noticeTitle}
                  </div>
                  {modalNotices.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}

              {selected.detailIntro && (
                <div style={{ fontSize: 14, lineHeight: 1.78, color: "var(--text-2)" }}>
                  {selected.detailIntro}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>
                  {t.channelsTitle}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {selected.channels.map((ch) => (
                    <span key={ch} className="faction-pill">
                      <ShoppingBag size={12} color="var(--brand-text)" />
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  paddingTop: 14,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <button
                  type="button"
                  className={`wish-btn ${wishlist.has(selected.id) ? "wished" : ""}`}
                  style={{ height: 38, padding: "0 15px" }}
                  onClick={() => onToggleWish(selected.id)}
                >
                  <Heart size={14} fill={wishlist.has(selected.id) ? "currentColor" : "none"} />
                  {wishlist.has(selected.id) ? copy.wishBtnAdded : copy.wishBtnAdd}
                </button>
                <a href={selected.buyUrl} target="_blank" rel="noreferrer" className="btn-primary">
                  {selected.mihoyogiftId ? copy.goMiHoYoGiftBtn : copy.goOfficialBtn} <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
