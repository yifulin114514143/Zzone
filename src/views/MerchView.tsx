import React, { useEffect, useMemo, useState } from "react";
import {
  Clock,
  ExternalLink,
  Heart,
  Images,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import {
  MERCH_CADENCE_META,
  MERCH_CAT_META,
  MERCH_STATUS_META,
} from "../industry/merch";
import type { MerchCadence, MerchCategory, MerchItem } from "../industry/types";
import { hexAlpha } from "../lib/color";
import {
  MERCH_CADENCE_LABELS,
  MERCH_CAT_LABELS,
  MERCH_STATUS_LABELS,
  useI18n,
  type AppLang,
} from "../lib/i18n";
import { sortMerchByPriority } from "../lib/ranking";
import { formatHM, formatSlashMD, getCountdown } from "../lib/time";
import { ImageGallery } from "../components/ImageGallery";
import { SourceBadge } from "../components/SourceIcon";

const MERCH_DETAIL_COPY: Record<
  AppLang,
  {
    closeDetail: string;
    refPrice: string;
    releaseLabel: string;
    shipLabel: string;
    shipFallback: string;
    wishBtnAdded: string;
    wishBtnAdd: string;
  }
> = {
  zh: {
    closeDetail: "关闭商品详情",
    refPrice: "官方参考售价",
    releaseLabel: "上新与开售时间",
    shipLabel: "发货 / 提货说明",
    shipFallback: "以官方店铺公告为准",
    wishBtnAdded: "已加入心愿单",
    wishBtnAdd: "加入种草心愿单",
  },
  ja: {
    closeDetail: "商品詳細を閉じる",
    refPrice: "公式参考価格",
    releaseLabel: "発表・発売時期",
    shipLabel: "発送予定・受取案内",
    shipFallback: "公式ストアの案内に準拠",
    wishBtnAdded: "欲しい物リスト登録済",
    wishBtnAdd: "欲しい物リストに追加",
  },
  ko: {
    closeDetail: "상품 상세 닫기",
    refPrice: "공식 참고 가격",
    releaseLabel: "공개 및 판매 일정",
    shipLabel: "발송 / 수령 안내",
    shipFallback: "공식 스토어 공지 기준",
    wishBtnAdded: "위시리스트에 담김",
    wishBtnAdd: "위시리스트에 추가",
  },
  en: {
    closeDetail: "Close merch details",
    refPrice: "Official Reference Price",
    releaseLabel: "Announcement / Sale Window",
    shipLabel: "Est. Shipping / Pickup",
    shipFallback: "Subject to official store notice",
    wishBtnAdded: "In Wishlist",
    wishBtnAdd: "Add to Wishlist",
  },
};

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
  const detailCopy = MERCH_DETAIL_COPY[lang];
  const cadenceLabels = MERCH_CADENCE_LABELS[lang];
  const catLabels = MERCH_CAT_LABELS[lang];
  const statusLabels = MERCH_STATUS_LABELS[lang];

  const [cadence, setCadence] = useState<MerchCadence | "all">("all");
  const [category, setCategory] = useState<MerchCategory | "all">("all");
  const [onlyWish, setOnlyWish] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => (selectedId ? items.find((m) => m.id === selectedId) ?? null : null),
    [items, selectedId]
  );

  useEffect(() => {
    if (!initialMerchId) return;
    const found = items.find((m) => m.id === initialMerchId);
    if (found) setSelectedId(found.id);
    onClearInitialMerch?.();
  }, [initialMerchId, items, onClearInitialMerch]);

  const filtered = useMemo(() => {
    const list = items.filter((m) => {
      if (cadence !== "all" && m.cadence !== cadence) return false;
      if (category !== "all" && m.category !== category) return false;
      if (onlyWish && !wishlist.has(m.id)) return false;
      return true;
    });
    return sortMerchByPriority(list);
  }, [items, cadence, category, onlyWish, wishlist]);

  const wishTotal = useMemo(
    () => items.filter((m) => wishlist.has(m.id)).reduce((sum, m) => sum + m.priceNum, 0),
    [items, wishlist]
  );

  const checkedTimeLabel = `${formatSlashMD(lastCheckedAt)} ${formatHM(lastCheckedAt)}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="section-head" style={{ marginBottom: 0 }}>
        <div className="section-title-group">
          <h1 className="section-title">{t.merchTitle}</h1>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={onCheckMerch}
          disabled={isChecking}
        >
          <RefreshCw size={14} className={isChecking ? "spin" : ""} />
          {isChecking ? t.checkingMerchBtn : t.checkMerchBtn}
        </button>
      </div>

      {/* Periodic Merch Monitor Status Banner */}
      <div
        className="panel"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          padding: "14px 18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              display: "grid",
              placeItems: "center",
              color: "var(--text-2)",
              flexShrink: 0,
            }}
          >
            <Store size={17} />
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800 }}>
              {t.merchBannerTitle}
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>
              {t.merchBannerSub(checkedTimeLabel)}
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`wish-btn ${onlyWish ? "wished" : ""}`}
          style={{ height: 36, padding: "0 14px" }}
          onClick={() => setOnlyWish((v) => !v)}
        >
          <Heart size={14} fill={onlyWish ? "currentColor" : "none"} />
          {t.wishOnly(wishlist.size)}
          {wishTotal > 0 ? ` · ${t.wishBudgetPrefix} ¥${wishTotal}` : ""}
        </button>
      </div>

      {/* Filters */}
      <div className="panel" style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="chip-scroll">
          <button
            type="button"
            className={`chip ${cadence === "all" ? "brand-active" : ""}`}
            onClick={() => setCadence("all")}
          >
            {t.allCadence(items.length)}
          </button>
          {(["fes_drop", "version_drop", "daily_drop", "collab_drop"] as MerchCadence[]).map((k) => (
            <button
              key={k}
              type="button"
              className={`chip ${cadence === k ? "brand-active" : ""}`}
              onClick={() => setCadence(k)}
            >
              {cadenceLabels[k]} ({items.filter((m) => m.cadence === k).length})
            </button>
          ))}
        </div>

        <div className="chip-scroll">
          <button
            type="button"
            className={`chip ${category === "all" ? "active" : ""}`}
            onClick={() => setCategory("all")}
          >
            {t.allMerchCat}
          </button>
          {(
            ["figure", "collab_merch", "bangboo", "goods", "apparel", "fes_limited"] as MerchCategory[]
          ).map((k) => (
            <button
              key={k}
              type="button"
              className={`chip ${category === k ? "active" : ""}`}
              onClick={() => setCategory(k)}
            >
              {catLabels[k]}
            </button>
          ))}
        </div>
      </div>

      {/* Merch Grid — Crisp Real Official Photos on EVERY Card */}
      {filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: 42, color: "var(--text-3)" }}>
          {t.noMerchMatch}
        </div>
      ) : (
        <div className="merch-grid">
          {filtered.map((item) => {
            const catMeta = MERCH_CAT_META[item.category];
            const cadMeta = MERCH_CADENCE_META[item.cadence];
            const stMeta = MERCH_STATUS_META[item.saleStatus];
            const wished = wishlist.has(item.id);
            const cutoffCd = item.cutoffAt ? getCountdown(item.cutoffAt) : null;

            return (
              <article key={item.id} className="merch-card">
                <div className="merch-photo-wrap" onClick={() => setSelectedId(item.id)}>
                  <img src={item.coverUrl} alt={item.name} loading="lazy" />
                  <div className="merch-photo-scrim" />

                  <div className="media-overlay-top">
                    <span className="cat-pill">
                      <span className="cat-dot" style={{ "--cc": catMeta.color } as React.CSSProperties} />
                      {catLabels[item.category]}
                    </span>
                    <span
                      className="cat-pill"
                      style={{ borderColor: hexAlpha(stMeta.color, 0.55) }}
                    >
                      <span className="cat-dot" style={{ "--cc": stMeta.color } as React.CSSProperties} />
                      {statusLabels[item.saleStatus]}
                    </span>
                  </div>

                  <div className="merch-photo-bottom">
                    <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.86)", fontWeight: 600 }}>
                      {item.characterOrFaction}
                    </span>
                    <span className="photo-count-pill">
                      <Images size={11} /> {t.photosCount(item.gallery.length)}
                    </span>
                  </div>
                </div>

                <div style={{ padding: "15px 18px 18px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                    <span className={`cadence-pill ${cadMeta.cssClass}`}>{cadenceLabels[item.cadence]}</span>
                    {item.sourcePlatforms.slice(0, 2).map((sp) => (
                      <SourceBadge key={sp} platform={sp} />
                    ))}
                  </div>

                  <h3 style={{ margin: 0 }}>
                    <button
                      type="button"
                      className="news-title"
                      onClick={() => setSelectedId(item.id)}
                    >
                      {item.name}
                    </button>
                  </h3>

                  <p className="news-excerpt">{item.summary}</p>

                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginTop: 2 }}>
                    <span className="merch-price">{item.priceText}</span>
                    {cutoffCd && !cutoffCd.expired ? (
                      <span className="mono" style={{ fontSize: 11, color: "var(--rose)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Clock size={11} /> {t.cutoffDaysLeft(cutoffCd.days)}
                      </span>
                    ) : (
                      <span className="faction-pill">
                        <span className="faction-dot" style={{ "--fc": item.accent } as React.CSSProperties} />
                        {item.characterOrFaction}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: 11,
                      borderTop: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <button
                      type="button"
                      className={`wish-btn ${wished ? "wished" : ""}`}
                      onClick={() => onToggleWish(item.id)}
                    >
                      <Heart size={13} fill={wished ? "currentColor" : "none"} />
                      {wished ? t.wishedLabel : t.wishAddLabel}
                    </button>

                    <button
                      type="button"
                      className="ghost-link"
                      style={{ fontSize: 12, padding: "4px 8px" }}
                      onClick={() => setSelectedId(item.id)}
                    >
                      {t.merchDetailBtn} ({item.gallery.length}) →
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* E-Commerce Grade Multi-Image Merch Detail Modal */}
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
          <div className="modal-sheet" style={{ width: "min(880px, 100%)" }}>
            <div className="modal-head">
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                <span className={`cadence-pill ${MERCH_CADENCE_META[selected.cadence].cssClass}`}>
                  {cadenceLabels[selected.cadence]}
                </span>
                {selected.sourcePlatforms.map((sp) => (
                  <SourceBadge key={sp} platform={sp} />
                ))}
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label={detailCopy.closeDetail}
                onClick={() => setSelectedId(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>
                {selected.series} · {selected.characterOrFaction}
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, lineHeight: 1.32 }}>
                {selected.name}
              </h2>

              {/* Multi-Image Interactive Gallery */}
              <ImageGallery images={selected.gallery} alt={selected.name} />

              <div className="grid-3" style={{ gap: 10 }}>
                <div className="voice-bubble">
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{detailCopy.refPrice}</span>
                  <strong className="merch-price" style={{ fontSize: 18 }}>
                    {selected.priceText}
                  </strong>
                </div>
                <div className="voice-bubble">
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{detailCopy.releaseLabel}</span>
                  <strong style={{ fontSize: 13 }}>{selected.releaseDate}</strong>
                </div>
                <div className="voice-bubble">
                  <span style={{ fontSize: 11.5, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <PackageCheck size={12} /> {detailCopy.shipLabel}
                  </span>
                  <strong style={{ fontSize: 13 }}>{selected.shipDate || detailCopy.shipFallback}</strong>
                </div>
              </div>

              <div className="takeaway-box">
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800 }}>
                  <Sparkles size={14} color="var(--brand-text)" /> {t.specsTitle}
                </div>
                <ul>
                  {selected.specs.map((sp, i) => (
                    <li key={i} style={{ fontSize: 13.5, color: "var(--text-2)" }}>
                      {sp}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ fontSize: 14.5, lineHeight: 1.82, color: "var(--text-2)" }}>
                {selected.detailIntro}
              </div>

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
                  {wishlist.has(selected.id) ? detailCopy.wishBtnAdded : detailCopy.wishBtnAdd}
                </button>
                <a href={selected.buyUrl} target="_blank" rel="noreferrer" className="btn-primary">
                  {t.goBuyBtn} <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
