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
import { formatHM, formatSlashMD, getCountdown } from "../lib/time";
import { ImageGallery } from "../components/ImageGallery";
import { SourceBadge } from "../components/SourceIcon";

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
  const [cadence, setCadence] = useState<MerchCadence | "all">("all");
  const [category, setCategory] = useState<MerchCategory | "all">("all");
  const [onlyWish, setOnlyWish] = useState(false);
  const [selected, setSelected] = useState<MerchItem | null>(null);

  useEffect(() => {
    if (!initialMerchId) return;
    const found = items.find((m) => m.id === initialMerchId);
    if (found) setSelected(found);
    onClearInitialMerch?.();
  }, [initialMerchId, items, onClearInitialMerch]);

  const filtered = useMemo(() => {
    return items.filter((m) => {
      if (cadence !== "all" && m.cadence !== cadence) return false;
      if (category !== "all" && m.category !== category) return false;
      if (onlyWish && !wishlist.has(m.id)) return false;
      return true;
    });
  }, [items, cadence, category, onlyWish, wishlist]);

  const wishTotal = useMemo(
    () => items.filter((m) => wishlist.has(m.id)).reduce((sum, m) => sum + m.priceNum, 0),
    [items, wishlist]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="section-head" style={{ marginBottom: 0 }}>
        <div className="section-title-group">
          <span className="section-kicker">OFFICIAL MERCH · MULTI-IMAGE CATALOG</span>
          <h1 className="section-title">米游铺、三Z旗舰店与联名周边上新</h1>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={onCheckMerch}
          disabled={isChecking}
        >
          <RefreshCw size={14} className={isChecking ? "spin" : ""} />
          {isChecking ? "正在巡检周边..." : "立即检查官方上新"}
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
          background:
            "radial-gradient(45% 120% at 0% 50%, var(--brand-soft), transparent 70%), var(--surface)",
          borderColor: "var(--brand-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "var(--brand-soft)",
              border: "1px solid var(--brand-border)",
              display: "grid",
              placeItems: "center",
              color: "var(--brand-text)",
              flexShrink: 0,
            }}
          >
            <Store size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800 }}>
              全渠道定期巡检：版本同步 + 日常突击上新 + 雅迪/外设等跨界联名商品
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>
              数据源：绝区零中国官网「新品情报」· 米游铺 · 天猫三Z官方旗舰店 · 抖音周边店 ｜ 上次巡检{" "}
              {formatSlashMD(lastCheckedAt)} {formatHM(lastCheckedAt)}
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
          种草心愿单 ({wishlist.size}){wishTotal > 0 ? ` · 约 ¥${wishTotal}` : ""}
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
            全部上新 ({items.length})
          </button>
          {(["fes_drop", "version_drop", "daily_drop", "collab_drop"] as MerchCadence[]).map((k) => (
            <button
              key={k}
              type="button"
              className={`chip ${cadence === k ? "brand-active" : ""}`}
              onClick={() => setCadence(k)}
            >
              {MERCH_CADENCE_META[k].label} ({items.filter((m) => m.cadence === k).length})
            </button>
          ))}
        </div>

        <div className="chip-scroll">
          <button
            type="button"
            className={`chip ${category === "all" ? "active" : ""}`}
            onClick={() => setCategory("all")}
          >
            全部品类
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
              {MERCH_CAT_META[k].label}
            </button>
          ))}
        </div>
      </div>

      {/* Merch Grid — Crisp Real Official Photos on EVERY Card */}
      {filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: 42, color: "var(--text-3)" }}>
          当前筛选下暂无周边记录，试试切换品类或取消「仅看种草心愿单」。
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
                <div className="merch-photo-wrap" onClick={() => setSelected(item)}>
                  <img src={item.coverUrl} alt={item.name} loading="lazy" />
                  <div className="merch-photo-scrim" />

                  <div className="media-overlay-top">
                    <span className="cat-pill">
                      <span className="cat-dot" style={{ "--cc": catMeta.color } as React.CSSProperties} />
                      {catMeta.label}
                    </span>
                    <span
                      className="cat-pill"
                      style={{ borderColor: hexAlpha(stMeta.color, 0.55) }}
                    >
                      <span className="cat-dot" style={{ "--cc": stMeta.color } as React.CSSProperties} />
                      {stMeta.label}
                    </span>
                  </div>

                  <div className="merch-photo-bottom">
                    <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.86)", fontWeight: 600 }}>
                      {item.characterOrFaction}
                    </span>
                    <span className="photo-count-pill">
                      <Images size={11} /> {item.gallery.length} 张详图
                    </span>
                  </div>
                </div>

                <div style={{ padding: "15px 18px 18px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                    <span className={`cadence-pill ${cadMeta.cssClass}`}>{cadMeta.label}</span>
                    {item.sourcePlatforms.slice(0, 2).map((sp) => (
                      <SourceBadge key={sp} platform={sp} />
                    ))}
                  </div>

                  <h3 style={{ margin: 0 }}>
                    <button
                      type="button"
                      className="news-title"
                      onClick={() => setSelected(item)}
                    >
                      {item.name}
                    </button>
                  </h3>

                  <p className="news-excerpt">{item.summary}</p>

                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginTop: 2 }}>
                    <span className="merch-price">{item.priceText}</span>
                    {cutoffCd && !cutoffCd.expired ? (
                      <span className="mono" style={{ fontSize: 11, color: "var(--rose)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Clock size={11} /> 截单剩 {cutoffCd.days} 天
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
                      {wished ? "已种草" : "加入心愿单"}
                    </button>

                    <button
                      type="button"
                      className="ghost-link"
                      style={{ fontSize: 12, padding: "4px 8px" }}
                      onClick={() => setSelected(item)}
                    >
                      多图详情 ({item.gallery.length}) →
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
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="modal-sheet" style={{ width: "min(880px, 100%)" }}>
            <div className="modal-head">
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                <span className={`cadence-pill ${MERCH_CADENCE_META[selected.cadence].cssClass}`}>
                  {MERCH_CADENCE_META[selected.cadence].label}
                </span>
                {selected.sourcePlatforms.map((sp) => (
                  <SourceBadge key={sp} platform={sp} />
                ))}
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="关闭商品详情"
                onClick={() => setSelected(null)}
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
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>官方参考售价</span>
                  <strong className="merch-price" style={{ fontSize: 18 }}>
                    {selected.priceText}
                  </strong>
                </div>
                <div className="voice-bubble">
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>上新与开售时间</span>
                  <strong style={{ fontSize: 13 }}>{selected.releaseDate}</strong>
                </div>
                <div className="voice-bubble">
                  <span style={{ fontSize: 11.5, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <PackageCheck size={12} /> 发货 / 提货说明
                  </span>
                  <strong style={{ fontSize: 13 }}>{selected.shipDate || "以官方店铺公告为准"}</strong>
                </div>
              </div>

              <div className="takeaway-box">
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800 }}>
                  <Sparkles size={14} color="var(--brand-text)" /> 商品参数、配置与特典明细
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

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {selected.channels.map((ch) => (
                  <span key={ch} className="faction-pill">
                    <ShoppingBag size={12} color="var(--brand-text)" />
                    {ch}
                  </span>
                ))}
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
                  {wishlist.has(selected.id) ? "已加入心愿单" : "加入种草心愿单"}
                </button>
                <a href={selected.buyUrl} target="_blank" rel="noreferrer" className="btn-primary">
                  查看官方发售公告 <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
