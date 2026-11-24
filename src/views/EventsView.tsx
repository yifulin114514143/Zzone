import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarPlus,
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
import { OFFLINE_EVENT_TYPE_META } from "../industry/offlineEvents";
import type { OfflineEvent, OfflineEventType } from "../industry/types";
import { downloadDeadlinesIcs } from "../lib/time";
import { ImageGallery } from "../components/ImageGallery";
import { LiveCountdownGrid } from "../components/LiveCountdownGrid";
import { SourceBadge } from "../components/SourceIcon";

interface EventsViewProps {
  events: OfflineEvent[];
  initialEventId?: string | null;
  onClearInitialEvent?: () => void;
  onSubmitEvent: (ev: OfflineEvent) => void;
  onNotify: (msg: string) => void;
}

type OfficialFilter = "all" | "official" | "unofficial";
type StatusFilter = "all" | "active" | "archive";
type TypeFilter = "all" | OfflineEventType;

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  initialEventId,
  onClearInitialEvent,
  onSubmitEvent,
  onNotify,
}) => {
  const [officialFilter, setOfficialFilter] = useState<OfficialFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selectedEvent, setSelectedEvent] = useState<OfflineEvent | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);

  useEffect(() => {
    if (!initialEventId) return;
    const found = events.find((e) => e.id === initialEventId);
    if (found) setSelectedEvent(found);
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

  const featuredEvent = events.find((e) => e.id === "ev-hz-fes-2026") ?? events[0];

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (officialFilter === "official" && !e.official) return false;
      if (officialFilter === "unofficial" && e.official) return false;
      if (statusFilter === "active" && e.status === "archive") return false;
      if (statusFilter === "archive" && e.status !== "archive") return false;
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      return true;
    });
  }, [events, officialFilter, statusFilter, typeFilter]);

  const exportEventIcs = (list: OfflineEvent[]) => {
    const mapped = list
      .filter((e) => e.status !== "archive")
      .map((e) => ({
        id: e.id,
        title: `${e.official ? "[官方]" : "[同人]"} ${e.title}`,
        subtitle: `${e.city} · ${e.venue} | ${e.subtitle}`,
        kind: "event_end" as const,
        at: e.startAt,
        timezoneLabel: "UTC+8",
        factionId: "new-eridu",
        rewardHint: e.ticketStatus,
      }));
    downloadDeadlinesIcs(mapped, "zzone-offline-events.ics");
    onNotify(`已导出 ${mapped.length} 场即将举办的活动至日历文件 (.ics)`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCity.trim()) {
      onNotify("请至少填写活动名称和举办城市");
      return;
    }
    const defaultImg =
      "https://fastcdn.hoyoverse.com/content-v2/nap/167369/22818f42207fbeae8dcb93c649a3cfc0_5203235106970544581.png";
    const created: OfflineEvent = {
      id: `ev-user-${Date.now()}`,
      title: formTitle.trim(),
      subtitle: formDesc.trim() || `${formCity} 绝区零线下交流与同人活动`,
      official: formOfficial,
      organizer: formOrg.trim() || (formOfficial ? "官方渠道投稿" : "同人企划组投稿"),
      type: formType,
      status: "upcoming",
      city: formCity.trim(),
      venue: formVenue.trim() || "待公布场馆",
      dateRange: formDate.replace(/-/g, "."),
      startAt: `${formDate}T10:00:00+08:00`,
      ticketStatus: "社区投稿 · 待核验票务",
      accent: formOfficial ? "#ff5a1f" : "#a78bfa",
      coverUrl: defaultImg,
      gallery: [defaultImg],
      sourcePlatform: formOfficial ? "zzz-cn" : "fan",
      highlights: [
        `举办地点：${formCity.trim()} · ${formVenue.trim() || "待定"}`,
        `主办方：${formOrg.trim() || "玩家社区投稿"}`,
      ],
      description: formDesc.trim() || "由绳匠通过 Zzone 活动线索入口提交。",
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
    onNotify("已收录该活动线索并实时展示在列表中");
  };

  const officialCount = events.filter((e) => e.official).length;
  const fanCount = events.filter((e) => !e.official).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      {/* Header */}
      <div className="section-head" style={{ marginBottom: 0 }}>
        <div className="section-title-group">
          <span className="section-kicker">FES · ZLIVE · COLLAB · FAN ONLY</span>
          <h1 className="section-title">绝区零官方大型活动、品牌联动与同人展</h1>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => exportEventIcs(events)}
          >
            <CalendarPlus size={15} /> 导出近期活动日历
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowSubmit(true)}
          >
            <Plus size={15} /> 投稿官方/同人活动
          </button>
        </div>
      </div>

      {/* Featured Event Spotlight: Hangzhou 2026 FES */}
      {featuredEvent && (
        <section className="event-hero-banner" aria-label="近期重磅线下活动">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              <span className="badge-official">
                <ShieldCheck size={13} /> 年度重磅 · 即将开馆
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
              onClick={() => setSelectedEvent(featuredEvent)}
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
                onClick={() => setSelectedEvent(featuredEvent)}
              >
                浏览 {featuredEvent.gallery.length} 张官方情报图与亮点
              </button>
              <a
                href={featuredEvent.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                B站会员购详情 <ExternalLink size={14} />
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
                距离杭州 FES 开馆倒计时
              </span>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                11/27 09:30
              </span>
            </div>
            <LiveCountdownGrid targetIso={featuredEvent.startAt} />
            <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.55 }}>
              4/5/6号三馆实景搭建，每晚 17:30 同期上演 Zenless LIVE 2026 FES 专场音乐会。
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
              全部活动 ({events.length})
            </button>
            <button
              type="button"
              className={`chip ${officialFilter === "official" ? "brand-active" : ""}`}
              onClick={() => setOfficialFilter("official")}
            >
              <ShieldCheck size={13} /> 官方大型活动 & 联动 ({officialCount})
            </button>
            <button
              type="button"
              className={`chip ${officialFilter === "unofficial" ? "brand-active" : ""}`}
              onClick={() => setOfficialFilter("unofficial")}
            >
              <Users size={13} /> 非官方 / 同人 Only & Live ({fanCount})
            </button>
          </div>

          <div className="chip-scroll">
            <button
              type="button"
              className={`chip ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              全部时间
            </button>
            <button
              type="button"
              className={`chip ${statusFilter === "active" ? "active" : ""}`}
              onClick={() => setStatusFilter("active")}
            >
              即将开启 / 进行中
            </button>
            <button
              type="button"
              className={`chip ${statusFilter === "archive" ? "active" : ""}`}
              onClick={() => setStatusFilter("archive")}
            >
              往期归档（欢乐谷/雅迪/KFC/东京等）
            </button>
          </div>
        </div>

        <div className="chip-scroll">
          {(["all", "fes", "concert", "collab_offline", "popup", "fan_only", "fan_live"] as TypeFilter[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${typeFilter === t ? "active" : ""}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === "all" ? "全部类型" : OFFLINE_EVENT_TYPE_META[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid with Crisp Real Photos */}
      <div className="grid-2">
        {filtered.map((ev) => {
          const typeMeta = OFFLINE_EVENT_TYPE_META[ev.type];
          return (
            <article key={ev.id} className="event-card">
              <div
                className="merch-photo-wrap"
                style={{ aspectRatio: "16 / 9" }}
                onClick={() => setSelectedEvent(ev)}
              >
                <img src={ev.coverUrl} alt={ev.title} loading="lazy" />
                <div className="merch-photo-scrim" />

                <div className="media-overlay-top">
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {ev.official ? (
                      <span className="badge-official">
                        <ShieldCheck size={12} /> 官方活动
                      </span>
                    ) : (
                      <span className="badge-unofficial">
                        <Users size={12} /> 非官方 / 同人
                      </span>
                    )}
                    <span className="badge-status">{typeMeta.label}</span>
                  </div>
                  <span className="badge-status">
                    {ev.status === "upcoming"
                      ? "即将开启"
                      : ev.status === "open"
                      ? "报名 / 开票中"
                      : "往期档案"}
                  </span>
                </div>

                <div className="merch-photo-bottom">
                  <span className="mono" style={{ fontSize: 12, color: "rgba(255,255,255,0.92)", fontWeight: 700 }}>
                    {ev.city} · {ev.dateRange}
                  </span>
                  {ev.gallery.length > 1 && (
                    <span className="photo-count-pill">
                      <Images size={11} /> {ev.gallery.length} 张官图
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
                  onClick={() => setSelectedEvent(ev)}
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
                    onClick={() => setSelectedEvent(ev)}
                  >
                    多图与活动详情
                  </button>
                  <a
                    href={ev.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ghost-link"
                    style={{ fontSize: 12 }}
                  >
                    官方/购票入口 <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Multi-Image Event Detail Modal */}
      {selectedEvent && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={selectedEvent.title}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEvent(null);
          }}
        >
          <div className="modal-sheet" style={{ width: "min(860px, 100%)" }}>
            <div className="modal-head">
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                {selectedEvent.official ? (
                  <span className="badge-official">官方活动</span>
                ) : (
                  <span className="badge-unofficial">非官方 / 同人活动</span>
                )}
                <SourceBadge platform={selectedEvent.sourcePlatform} />
                <span className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>
                  {selectedEvent.city} · {selectedEvent.dateRange}
                </span>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="关闭活动详情"
                onClick={() => setSelectedEvent(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <h2 style={{ margin: 0, fontSize: 23, fontWeight: 900 }}>{selectedEvent.title}</h2>

              <ImageGallery images={selectedEvent.gallery} alt={selectedEvent.title} />

              <div className="grid-2" style={{ gap: 10 }}>
                <div className="voice-bubble">
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>举办地点</span>
                  <strong style={{ fontSize: 13.5 }}>{selectedEvent.venue}</strong>
                </div>
                <div className="voice-bubble">
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>票务与参与状态</span>
                  <strong style={{ fontSize: 13.5 }}>{selectedEvent.ticketStatus}</strong>
                </div>
              </div>

              <div className="takeaway-box">
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800 }}>
                  <Sparkles size={14} color="var(--brand-text)" /> 现场看点与内容
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
                  paddingTop: 12,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Calendar size={13} /> 主办：{selectedEvent.organizer}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  {selectedEvent.status !== "archive" && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => exportEventIcs([selectedEvent])}
                    >
                      <CalendarPlus size={14} /> 加入日历
                    </button>
                  )}
                  <a href={selectedEvent.sourceUrl} target="_blank" rel="noreferrer" className="btn-primary">
                    前往查看 <ExternalLink size={14} />
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
          aria-label="提交线下活动线索"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSubmit(false);
          }}
        >
          <div className="modal-sheet" style={{ width: "min(560px, 100%)" }}>
            <div className="modal-head">
              <strong style={{ fontSize: 16 }}>提交绝区零线下 / 同人活动线索</strong>
              <button
                type="button"
                className="icon-btn"
                aria-label="关闭投稿窗口"
                onClick={() => setShowSubmit(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form className="modal-body" onSubmit={handleSubmit}>
              <label className="field-group">
                活动名称 *
                <input
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="例如：2026 成都绝区零冬季同人 Only 展"
                />
              </label>

              <div className="grid-2" style={{ gap: 12 }}>
                <label className="field-group">
                  城市 *
                  <input
                    required
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="例如：杭州 / 武汉 / 上海 / 东京"
                  />
                </label>
                <label className="field-group">
                  开始日期
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </label>
              </div>

              <div className="grid-2" style={{ gap: 12 }}>
                <label className="field-group">
                  活动性质
                  <select
                    value={formOfficial ? "official" : "unofficial"}
                    onChange={(e) => setFormOfficial(e.target.value === "official")}
                  >
                    <option value="unofficial">非官方 / 同人企划</option>
                    <option value="official">官方活动 / 品牌联动</option>
                  </select>
                </label>
                <label className="field-group">
                  活动分类
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as OfflineEventType)}
                  >
                    <option value="fan_only">同人 Only 展</option>
                    <option value="fan_live">同人演出 / 派对</option>
                    <option value="fes">FES 嘉年华</option>
                    <option value="concert">演唱会 / ZLIVE</option>
                    <option value="collab_offline">大型品牌联动</option>
                    <option value="popup">主题快闪店</option>
                  </select>
                </label>
              </div>

              <div className="grid-2" style={{ gap: 12 }}>
                <label className="field-group">
                  举办场馆
                  <input
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    placeholder="例如：杭州大会展中心 / 武汉欢乐谷"
                  />
                </label>
                <label className="field-group">
                  主办方
                  <input
                    value={formOrg}
                    onChange={(e) => setFormOrg(e.target.value)}
                    placeholder="例如：某某同人企划组"
                  />
                </label>
              </div>

              <label className="field-group">
                活动简介与亮点
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="可填写摊位规模、开票方式、联动内容等..."
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowSubmit(false)}>
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  提交并立即收录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
