import React, { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Calendar,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Images,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { EVENT_TYPE_LABELS, useI18n, type AppLang } from "../lib/i18n";
import type { OfflineEvent, OfflineEventType } from "../industry/types";
import { isEventPast, partitionAndSortEvents } from "../lib/ranking";
import { downloadDeadlinesIcs } from "../lib/time";
import { ImageGallery } from "../components/ImageGallery";
import { LiveCountdownGrid } from "../components/LiveCountdownGrid";
import { SourceBadge } from "../components/SourceIcon";

const EVENT_MODAL_COPY: Record<
  AppLang,
  {
    venue: string;
    ticket: string;
    organizer: string;
    closeDetail: string;
    closeSubmit: string;
    exportedIcs: (n: number) => string;
    requiredWarn: string;
    submittedOk: string;
    nameLabel: string;
    namePlaceholder: string;
    cityLabel: string;
    cityPlaceholder: string;
    dateLabel: string;
    natureLabel: string;
    natureFan: string;
    natureOfficial: string;
    categoryLabel: string;
    venuePlaceholder: string;
    orgPlaceholder: string;
    descLabel: string;
    descPlaceholder: string;
    cancel: string;
    submit: string;
    defaultSub: (city: string) => string;
    defaultVenue: string;
    defaultTicket: string;
    defaultDesc: string;
  }
> = {
  zh: {
    venue: "举办地点",
    ticket: "票务与参与状态",
    organizer: "主办：",
    closeDetail: "关闭活动详情",
    closeSubmit: "关闭投稿窗口",
    exportedIcs: (n) => `已导出 ${n} 场即将举办的活动至日历文件 (.ics)`,
    requiredWarn: "请至少填写活动名称和举办城市",
    submittedOk: "已收录该活动线索并实时展示在列表中",
    nameLabel: "活动名称 *",
    namePlaceholder: "例如：2026 成都绝区零冬季同人 Only 展",
    cityLabel: "城市 *",
    cityPlaceholder: "例如：杭州 / 武汉 / 上海 / 东京",
    dateLabel: "开始日期",
    natureLabel: "活动性质",
    natureFan: "非官方 / 同人企划",
    natureOfficial: "官方活动 / 品牌联动",
    categoryLabel: "活动分类",
    venuePlaceholder: "例如：杭州大会展中心 / 武汉欢乐谷",
    orgPlaceholder: "例如：某某同人企划组",
    descLabel: "活动简介与亮点",
    descPlaceholder: "可填写摊位规模、开票方式、联动内容等...",
    cancel: "取消",
    submit: "提交并立即收录",
    defaultSub: (c) => `${c} 绝区零线下交流与同人活动`,
    defaultVenue: "待公布场馆",
    defaultTicket: "社区投稿 · 待核验票务",
    defaultDesc: "由绳匠通过 Zzone 活动线索入口提交。",
  },
  ja: {
    venue: "開催会場",
    ticket: "チケット・参加方法",
    organizer: "主催：",
    closeDetail: "詳細を閉じる",
    closeSubmit: "投稿ウィンドウを閉じる",
    exportedIcs: (n) => `開催予定イベント ${n} 件をカレンダー(.ics)に書き出しました`,
    requiredWarn: "イベント名と開催都市を入力してください",
    submittedOk: "イベント情報を登録し、一覧に反映しました",
    nameLabel: "イベント名 *",
    namePlaceholder: "例：2026 東京 ゼンレスゾーンゼロ ファンオンリー即売会",
    cityLabel: "開催都市 *",
    cityPlaceholder: "例：東京 / 大阪 / 杭州 / 上海",
    dateLabel: "開始日",
    natureLabel: "区分",
    natureFan: "非公式・ファン企画",
    natureOfficial: "公式イベント・コラボ",
    categoryLabel: "カテゴリー",
    venuePlaceholder: "例：秋葉原 / 東京ビッグサイト",
    orgPlaceholder: "例：実行委員会",
    descLabel: "概要・見どころ",
    descPlaceholder: "サークル数、チケット情報、コラボ内容など...",
    cancel: "キャンセル",
    submit: "投稿して即時反映",
    defaultSub: (c) => `${c} ゼンレスゾーンゼロ オフライン・ファンイベント`,
    defaultVenue: "会場後日発表",
    defaultTicket: "コミュニティ投稿・確認中",
    defaultDesc: "プロキシより Zzone 経由で投稿されたイベント情報です。",
  },
  ko: {
    venue: "개최 장소",
    ticket: "티켓 및 참여 안내",
    organizer: "주최: ",
    closeDetail: "상세 닫기",
    closeSubmit: "제보 창 닫기",
    exportedIcs: (n) => `예정된 행사 ${n}건을 캘린더(.ics)로 내보냈습니다`,
    requiredWarn: "행사명과 개최 도시를 입력해 주세요",
    submittedOk: "행사 제보가 등록되어 목록에 바로 반영되었습니다",
    nameLabel: "행사명 *",
    namePlaceholder: "예: 2026 서울 젠레스 존 제로 온리전",
    cityLabel: "개최 도시 *",
    cityPlaceholder: "예: 서울 / 부산 / 항저우 / 도쿄",
    dateLabel: "시작일",
    natureLabel: "행사 성격",
    natureFan: "비공식 / 동인 기획",
    natureOfficial: "공식 행사 / 브랜드 콜라보",
    categoryLabel: "분류",
    venuePlaceholder: "예: SETEC / 킨텍스",
    orgPlaceholder: "예: 행사 추진위원회",
    descLabel: "행사 소개 및 포인트",
    descPlaceholder: "부스 규모, 예매 일정, 콜라보 내용 등을 입력...",
    cancel: "취소",
    submit: "제보 및 즉시 등록",
    defaultSub: (c) => `${c} 젠레스 존 제로 오프라인 / 팬 행사`,
    defaultVenue: "장소 추후 공개",
    defaultTicket: "커뮤니티 제보 · 확인 중",
    defaultDesc: "로프꾼이 Zzone 행사 제보로 등록한 일정입니다.",
  },
  en: {
    venue: "Venue",
    ticket: "Tickets & Entry",
    organizer: "Organizer: ",
    closeDetail: "Close event details",
    closeSubmit: "Close submission dialog",
    exportedIcs: (n) => `Exported ${n} upcoming events to calendar (.ics)`,
    requiredWarn: "Please enter at least the event name and city",
    submittedOk: "Event tip submitted and added to the live list",
    nameLabel: "Event Name *",
    namePlaceholder: "e.g. 2026 ZZZ Winter Fan Expo",
    cityLabel: "City *",
    cityPlaceholder: "e.g. Hangzhou / Tokyo / Seoul / LA",
    dateLabel: "Start Date",
    natureLabel: "Affiliation",
    natureFan: "Unofficial / Fan Project",
    natureOfficial: "Official / Brand Collab",
    categoryLabel: "Category",
    venuePlaceholder: "e.g. Convention Center Hall 4",
    orgPlaceholder: "e.g. Fan Committee",
    descLabel: "Summary & Highlights",
    descPlaceholder: "Booth scale, ticketing info, collab highlights...",
    cancel: "Cancel",
    submit: "Submit & Publish",
    defaultSub: (c) => `${c} Zenless Zone Zero offline & fan event`,
    defaultVenue: "Venue TBA",
    defaultTicket: "Community Tip · Pending Verification",
    defaultDesc: "Submitted by a Proxy via the Zzone event tip portal.",
  },
};

interface EventsViewProps {
  events: OfflineEvent[];
  initialEventId?: string | null;
  onClearInitialEvent?: () => void;
  onSubmitEvent: (ev: OfflineEvent) => void;
  onNotify: (msg: string) => void;
}

type OfficialFilter = "all" | "official" | "unofficial";
type StatusFilter = "active" | "archive";
type TypeFilter = "all" | OfflineEventType;

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  initialEventId,
  onClearInitialEvent,
  onSubmitEvent,
  onNotify,
}) => {
  const { lang, t } = useI18n();
  const modalCopy = EVENT_MODAL_COPY[lang];
  const typeLabels = EVENT_TYPE_LABELS[lang];

  const [officialFilter, setOfficialFilter] = useState<OfficialFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [showPastSection, setShowPastSection] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);

  const selectedEvent = useMemo(
    () => (selectedEventId ? events.find((e) => e.id === selectedEventId) ?? null : null),
    [events, selectedEventId]
  );

  useEffect(() => {
    if (!initialEventId) return;
    const found = events.find((e) => e.id === initialEventId);
    if (found) setSelectedEventId(found.id);
    onClearInitialEvent?.();
  }, [initialEventId, events, onClearInitialEvent]);

  const [formTitle, setFormTitle] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formVenue, setFormVenue] = useState("");
  const [formDate, setFormDate] = useState("2026-12-20");
  const [formOrg, setFormOrg] = useState("");
  const [formOfficial, setFormOfficial] = useState(false);
  const [formType, setFormType] = useState<OfflineEventType>("fan_only");
  const [formDesc, setFormDesc] = useState("");

  const { active: allActiveEvents, past: allPastEvents } = useMemo(
    () => partitionAndSortEvents(events),
    [events]
  );

  const featuredEvent = allActiveEvents[0] ?? events[0];

  const applyCommonFilters = (list: OfflineEvent[]) =>
    list.filter((e) => {
      if (officialFilter === "official" && !e.official) return false;
      if (officialFilter === "unofficial" && e.official) return false;
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      return true;
    });

  const activeFiltered = useMemo(() => {
    const list = applyCommonFilters(allActiveEvents);
    // Avoid duplicating the featured spotlight event right underneath itself in the default unfiltered view
    if (
      featuredEvent &&
      officialFilter === "all" &&
      typeFilter === "all" &&
      list.length > 1
    ) {
      return list.filter((e) => e.id !== featuredEvent.id);
    }
    return list;
  }, [allActiveEvents, featuredEvent, officialFilter, typeFilter]);

  const pastFiltered = useMemo(
    () => applyCommonFilters(allPastEvents),
    [allPastEvents, officialFilter, typeFilter]
  );

  const exportEventIcs = (list: OfflineEvent[]) => {
    const mapped = list
      .filter((e) => !isEventPast(e))
      .map((e) => ({
        id: e.id,
        title: `${e.official ? `[${t.badgeOfficial}]` : `[${t.badgeUnofficial}]`} ${e.title}`,
        subtitle: `${e.city} · ${e.venue} | ${e.subtitle}`,
        kind: "event_end" as const,
        at: e.startAt,
        timezoneLabel: "UTC+8",
        factionId: "new-eridu",
        rewardHint: e.ticketStatus,
      }));
    downloadDeadlinesIcs(mapped, "zzone-offline-events.ics");
    onNotify(modalCopy.exportedIcs(mapped.length));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCity.trim()) {
      onNotify(modalCopy.requiredWarn);
      return;
    }
    const defaultImg =
      "https://fastcdn.hoyoverse.com/content-v2/nap/167369/22818f42207fbeae8dcb93c649a3cfc0_5203235106970544581.png";
    const created: OfflineEvent = {
      id: `ev-user-${Date.now()}`,
      title: formTitle.trim(),
      subtitle: formDesc.trim() || modalCopy.defaultSub(formCity.trim()),
      official: formOfficial,
      organizer: formOrg.trim() || (formOfficial ? t.badgeOfficial : t.badgeUnofficial),
      type: formType,
      status: "upcoming",
      city: formCity.trim(),
      venue: formVenue.trim() || modalCopy.defaultVenue,
      dateRange: formDate.replace(/-/g, "."),
      startAt: `${formDate}T10:00:00+08:00`,
      ticketStatus: modalCopy.defaultTicket,
      accent: formOfficial ? "#ff5a1f" : "#a78bfa",
      coverUrl: defaultImg,
      gallery: [defaultImg],
      sourcePlatform: formOfficial ? "zzz-cn" : "fan",
      highlights: [
        `${modalCopy.venue}: ${formCity.trim()} · ${formVenue.trim() || modalCopy.defaultVenue}`,
        `${modalCopy.organizer}${formOrg.trim() || t.badgeUnofficial}`,
      ],
      description: formDesc.trim() || modalCopy.defaultDesc,
      sourceUrl: "https://www.miyoushe.com/zzz/",
    };

    try {
      await fetch("/api/v1/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "event", item: created }),
      });
    } catch {
      // ignore
    }

    onSubmitEvent(created);
    setShowSubmit(false);
    setFormTitle("");
    setFormCity("");
    setFormVenue("");
    setFormOrg("");
    setFormDesc("");
    onNotify(modalCopy.submittedOk);
  };

  const officialCount = allActiveEvents.filter((e) => e.official).length;
  const fanCount = allActiveEvents.filter((e) => !e.official).length;

  const renderEventCard = (ev: OfflineEvent, isPastCard = false) => {
    return (
      <article
        key={ev.id}
        className="event-card"
        style={isPastCard ? { opacity: 0.86 } : undefined}
      >
        <div
          className="merch-photo-wrap"
          style={{ aspectRatio: "16 / 9" }}
          onClick={() => setSelectedEventId(ev.id)}
        >
          <img src={ev.coverUrl} alt={ev.title} loading="lazy" />
          <div className="merch-photo-scrim" />

          <div className="media-overlay-top">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {ev.official ? (
                <span className="badge-official">
                  <ShieldCheck size={12} /> {t.badgeOfficial}
                </span>
              ) : (
                <span className="badge-unofficial">
                  <Users size={12} /> {t.badgeUnofficial}
                </span>
              )}
              <span className="badge-status">{typeLabels[ev.type]}</span>
            </div>
            <span className="badge-status">
              {isPastCard
                ? t.statusPast
                : ev.status === "upcoming"
                ? t.statusUpcoming
                : t.statusOpen}
            </span>
          </div>

          <div className="merch-photo-bottom">
            <span className="mono" style={{ fontSize: 12, color: "rgba(255,255,255,0.92)", fontWeight: 700 }}>
              {ev.city} · {ev.dateRange}
            </span>
            {ev.gallery.length > 1 && (
              <span className="photo-count-pill">
                <Images size={11} /> {t.photosCount(ev.gallery.length)}
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SourceBadge platform={ev.sourcePlatform} />
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>{ev.organizer}</span>
          </div>

          <h3
            style={{ margin: 0, fontSize: 17.5, fontWeight: 900, lineHeight: 1.35, cursor: "pointer" }}
            onClick={() => setSelectedEventId(ev.id)}
          >
            {ev.title}
          </h3>

          <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>
            {ev.subtitle}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12.5, color: "var(--text-2)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <MapPin size={13} color="var(--brand-text)" />
              {ev.venue}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Ticket size={13} color="var(--gold-text)" />
              {ev.ticketStatus}
            </span>
          </div>

          <div
            style={{
              marginTop: "auto",
              paddingTop: 12,
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              style={{ height: 32, padding: "0 13px", fontSize: 12 }}
              onClick={() => setSelectedEventId(ev.id)}
            >
              {t.detailAndGalleryBtn}
            </button>
            <a
              href={ev.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="ghost-link"
              style={{ fontSize: 12 }}
            >
              {t.officialOrTicketLink} <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      {/* Header */}
      <div className="section-head" style={{ marginBottom: 0 }}>
        <div className="section-title-group">
          <h1 className="section-title">{t.eventsTitle}</h1>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => exportEventIcs(events)}
          >
            <CalendarPlus size={15} /> {t.exportIcsBtn}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowSubmit(true)}
          >
            <Plus size={15} /> {t.submitEventBtn}
          </button>
        </div>
      </div>

      {/* Featured Event Spotlight: Hangzhou 2026 FES */}
      {featuredEvent && (
        <section className="event-hero-banner" aria-label={featuredEvent.title}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              <span className="badge-official">
                <ShieldCheck size={13} /> {t.annualBadge}
              </span>
              <SourceBadge platform={featuredEvent.sourcePlatform} />
              <span className="faction-pill">
                <MapPin size={12} color="var(--brand-text)" />
                {featuredEvent.city} · {featuredEvent.dateRange}
              </span>
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "clamp(22px, 2.4vw, 30px)",
                fontWeight: 900,
                lineHeight: 1.28,
                cursor: "pointer",
              }}
              onClick={() => setSelectedEventId(featuredEvent.id)}
            >
              {featuredEvent.title}
            </h2>

            <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)", lineHeight: 1.65 }}>
              {featuredEvent.subtitle}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13, color: "var(--text-2)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <MapPin size={14} color="var(--brand-text)" />
                {featuredEvent.venue}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Ticket size={14} color="var(--gold-text)" />
                {featuredEvent.ticketStatus}
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, paddingTop: 4 }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setSelectedEventId(featuredEvent.id)}
              >
                {t.browseGalleryBtn(featuredEvent.gallery.length)}
              </button>
              <a
                href={featuredEvent.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                {t.ticketEntryBtn} <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div
            className="panel"
            style={{
              background: "var(--glass)",
              backdropFilter: "blur(14px)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--brand-text)" }}>
                {t.fesCountdownLabel}
              </span>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                11/27 09:30
              </span>
            </div>
            <LiveCountdownGrid targetIso={featuredEvent.startAt} />
            <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.55 }}>
              {t.fesCountdownSub}
            </div>
          </div>
        </section>
      )}

      {/* Multi-Axis Filters */}
      <div className="panel" style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="toolbar-row">
          <div className="chip-scroll">
            <button
              type="button"
              className={`chip ${officialFilter === "all" ? "brand-active" : ""}`}
              onClick={() => setOfficialFilter("all")}
            >
              {t.allTypesCount(statusFilter === "active" ? allActiveEvents.length : allPastEvents.length)}
            </button>
            <button
              type="button"
              className={`chip ${officialFilter === "official" ? "brand-active" : ""}`}
              onClick={() => setOfficialFilter("official")}
            >
              <ShieldCheck size={13} /> {t.officialEventsFilter(officialCount)}
            </button>
            <button
              type="button"
              className={`chip ${officialFilter === "unofficial" ? "brand-active" : ""}`}
              onClick={() => setOfficialFilter("unofficial")}
            >
              <Users size={13} /> {t.fanEventsFilter(fanCount)}
            </button>
          </div>

          <div className="chip-scroll">
            <button
              type="button"
              className={`chip ${statusFilter === "active" ? "active" : ""}`}
              onClick={() => setStatusFilter("active")}
            >
              {t.activeEventsTab(allActiveEvents.length)}
            </button>
            <button
              type="button"
              className={`chip ${statusFilter === "archive" ? "active" : ""}`}
              onClick={() => setStatusFilter("archive")}
            >
              <Archive size={12} /> {t.pastEventsTab(allPastEvents.length)}
            </button>
          </div>
        </div>

        <div className="chip-scroll">
          {(["all", "fes", "concert", "collab_offline", "popup", "fan_only", "fan_live"] as TypeFilter[]).map((tf) => (
            <button
              key={tf}
              type="button"
              className={`chip ${typeFilter === tf ? "active" : ""}`}
              onClick={() => setTypeFilter(tf)}
            >
              {tf === "all" ? t.allSubTypes : typeLabels[tf]}
            </button>
          ))}
        </div>
      </div>

      {/* Primary View: High-Priority Active/Upcoming Events ONLY, or Past Archive Tab */}
      {statusFilter === "active" ? (
        <>
          {activeFiltered.length === 0 ? (
            <div className="panel" style={{ textAlign: "center", padding: 40, color: "var(--text-3)" }}>
              {t.noActiveEvents}
            </div>
          ) : (
            <div className="grid-2">
              {activeFiltered.map((ev) => renderEventCard(ev, false))}
            </div>
          )}

          {/* Dedicated Collapsible Past Events Archive at the Bottom */}
          {pastFiltered.length > 0 && (
            <section style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 16 }}>
              <button
                type="button"
                className="panel"
                onClick={() => setShowPastSection((v) => !v)}
                style={{
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  width: "100%",
                  textAlign: "left",
                  borderStyle: "dashed",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Archive size={16} color="var(--text-3)" />
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-1)" }}>
                      {t.pastArchiveTitle(pastFiltered.length)}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                      {t.pastArchiveSub}
                    </div>
                  </div>
                </div>
                <span
                  className="btn-secondary"
                  style={{ height: 32, padding: "0 12px", fontSize: 12, flexShrink: 0 }}
                >
                  {showPastSection ? (
                    <>
                      {t.collapsePastBtn} <ChevronUp size={14} />
                    </>
                  ) : (
                    <>
                      {t.expandPastBtn} <ChevronDown size={14} />
                    </>
                  )}
                </span>
              </button>

              {showPastSection && (
                <div className="grid-2">
                  {pastFiltered.map((ev) => renderEventCard(ev, true))}
                </div>
              )}
            </section>
          )}
        </>
      ) : (
        <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 13, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 7 }}>
            <Archive size={14} />
            {t.pastArchiveHeader}
          </div>
          {pastFiltered.length === 0 ? (
            <div className="panel" style={{ textAlign: "center", padding: 40, color: "var(--text-3)" }}>
              {t.noPastEvents}
            </div>
          ) : (
            <div className="grid-2">
              {pastFiltered.map((ev) => renderEventCard(ev, true))}
            </div>
          )}
        </section>
      )}

      {/* Multi-Image Event Detail Modal */}
      {selectedEvent && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={selectedEvent.title}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEventId(null);
          }}
        >
          <div className="modal-sheet" style={{ width: "min(860px, 100%)" }}>
            <div className="modal-head">
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                {selectedEvent.official ? (
                  <span className="badge-official">{t.badgeOfficial}</span>
                ) : (
                  <span className="badge-unofficial">{t.badgeUnofficial}</span>
                )}
                <SourceBadge platform={selectedEvent.sourcePlatform} />
                <span className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>
                  {selectedEvent.city} · {selectedEvent.dateRange}
                </span>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label={modalCopy.closeDetail}
                onClick={() => setSelectedEventId(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <h2 style={{ margin: 0, fontSize: 23, fontWeight: 900 }}>{selectedEvent.title}</h2>

              <ImageGallery images={selectedEvent.gallery} alt={selectedEvent.title} />

              <div className="grid-2" style={{ gap: 10 }}>
                <div className="voice-bubble">
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{modalCopy.venue}</span>
                  <strong style={{ fontSize: 13.5 }}>{selectedEvent.venue}</strong>
                </div>
                <div className="voice-bubble">
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{modalCopy.ticket}</span>
                  <strong style={{ fontSize: 13.5 }}>{selectedEvent.ticketStatus}</strong>
                </div>
              </div>

              <div className="takeaway-box">
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800 }}>
                  <Sparkles size={14} color="var(--brand-text)" /> {t.highlightsTitle}
                </div>
                <ul>
                  {selectedEvent.highlights.map((h, i) => (
                    <li key={i} style={{ fontSize: 13.5, color: "var(--text-2)" }}>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.8, color: "var(--text-2)" }}>
                {selectedEvent.description}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                  paddingTop: 12,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Calendar size={13} /> {modalCopy.organizer}{selectedEvent.organizer}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  {!isEventPast(selectedEvent) && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => exportEventIcs([selectedEvent])}
                    >
                      <CalendarPlus size={14} /> {t.addToCalendarBtn}
                    </button>
                  )}
                  <a href={selectedEvent.sourceUrl} target="_blank" rel="noreferrer" className="btn-primary">
                    {t.visitOfficialLinkBtn} <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community Event Submission Modal */}
      {showSubmit && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={t.submitModalTitle}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSubmit(false);
          }}
        >
          <div className="modal-sheet" style={{ width: "min(560px, 100%)" }}>
            <div className="modal-head">
              <strong style={{ fontSize: 16 }}>{t.submitModalTitle}</strong>
              <button
                type="button"
                className="icon-btn"
                aria-label={modalCopy.closeSubmit}
                onClick={() => setShowSubmit(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form className="modal-body" onSubmit={handleSubmit}>
              <label className="field-group">
                {modalCopy.nameLabel}
                <input
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={modalCopy.namePlaceholder}
                />
              </label>

              <div className="grid-2" style={{ gap: 12 }}>
                <label className="field-group">
                  {modalCopy.cityLabel}
                  <input
                    required
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder={modalCopy.cityPlaceholder}
                  />
                </label>
                <label className="field-group">
                  {modalCopy.dateLabel}
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </label>
              </div>

              <div className="grid-2" style={{ gap: 12 }}>
                <label className="field-group">
                  {modalCopy.natureLabel}
                  <select
                    value={formOfficial ? "official" : "unofficial"}
                    onChange={(e) => setFormOfficial(e.target.value === "official")}
                  >
                    <option value="unofficial">{modalCopy.natureFan}</option>
                    <option value="official">{modalCopy.natureOfficial}</option>
                  </select>
                </label>
                <label className="field-group">
                  {modalCopy.categoryLabel}
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as OfflineEventType)}
                  >
                    <option value="fan_only">{typeLabels.fan_only}</option>
                    <option value="fan_live">{typeLabels.fan_live}</option>
                    <option value="fes">{typeLabels.fes}</option>
                    <option value="concert">{typeLabels.concert}</option>
                    <option value="collab_offline">{typeLabels.collab_offline}</option>
                    <option value="popup">{typeLabels.popup}</option>
                  </select>
                </label>
              </div>

              <div className="grid-2" style={{ gap: 12 }}>
                <label className="field-group">
                  {modalCopy.venue}
                  <input
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    placeholder={modalCopy.venuePlaceholder}
                  />
                </label>
                <label className="field-group">
                  {modalCopy.organizer.replace(/[:：\s]+$/, "")}
                  <input
                    value={formOrg}
                    onChange={(e) => setFormOrg(e.target.value)}
                    placeholder={modalCopy.orgPlaceholder}
                  />
                </label>
              </div>

              <label className="field-group">
                {modalCopy.descLabel}
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder={modalCopy.descPlaceholder}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowSubmit(false)}>
                  {modalCopy.cancel}
                </button>
                <button type="submit" className="btn-primary">
                  {modalCopy.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
