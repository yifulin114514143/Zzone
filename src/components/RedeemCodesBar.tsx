import React, { useEffect } from "react";
import { ArrowRight, Copy, ExternalLink, Ticket, X } from "lucide-react";
import { REDEEM_CODES } from "../industry/codes";
import { localizeCode } from "../industry/localizedData";
import { useI18n } from "../lib/i18n";
import { formatSlashMD } from "../lib/time";

interface RedeemCodesStripProps {
  onCopyCode: (code: string) => void;
  onOpenModal: () => void;
}

export const RedeemCodesStrip: React.FC<RedeemCodesStripProps> = ({
  onCopyCode,
  onOpenModal,
}) => {
  const { lang, t } = useI18n();
  const activeCodes = REDEEM_CODES.filter((c) => c.status !== "expired").map((c) =>
    localizeCode(c, lang)
  );
  if (activeCodes.length === 0) return null;

  return (
    <section className="codes-strip" aria-label={t.codesBarBadge}>
      <div className="codes-strip-label">
        <span className="codes-strip-badge">
          <Ticket size={14} />
          {t.codesBarBadge}
        </span>
        <span className="codes-strip-hint hide-sm">{t.codesBarHint}</span>
      </div>

      <div className="codes-strip-list">
        {activeCodes.map((c) => {
          const rewardShort = c.rewards.split("·")[0].trim();
          return (
            <button
              key={c.code}
              type="button"
              className="code-chip-btn"
              onClick={() => onCopyCode(c.code)}
              title={`${c.rewards} (${c.regionLabel})`}
            >
              <strong className="mono code-chip-code">{c.code}</strong>
              <span className="code-chip-reward">{rewardShort}</span>
              <Copy size={12} className="code-chip-copy" />
            </button>
          );
        })}
      </div>

      <button type="button" className="codes-strip-more" onClick={onOpenModal}>
        {t.codesBarMore} <ArrowRight size={13} />
      </button>
    </section>
  );
};

interface RedeemCodesModalProps {
  open: boolean;
  onClose: () => void;
  onCopyCode: (code: string) => void;
}

export const RedeemCodesModal: React.FC<RedeemCodesModalProps> = ({
  open,
  onClose,
  onCopyCode,
}) => {
  const { lang, t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const activeCodes = REDEEM_CODES.filter((c) => c.status !== "expired").map((c) =>
    localizeCode(c, lang)
  );
  const expiredCodes = REDEEM_CODES.filter((c) => c.status === "expired").map((c) =>
    localizeCode(c, lang)
  );

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={t.codesModalTitle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-sheet" style={{ width: "min(720px, 100%)" }}>
        <div className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Ticket size={17} color="var(--gold-text)" />
            <strong style={{ fontSize: 15.5 }}>
              {t.codesModalTitle} ({activeCodes.length} {t.codesActiveSuffix})
            </strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a
              href="https://zenless.hoyoverse.com/redemption"
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
              style={{ height: 32, padding: "0 12px", fontSize: 12 }}
            >
              {t.officialRedeemBtn} <ExternalLink size={12} />
            </a>
            <button
              type="button"
              className="icon-btn"
              style={{ width: 32, height: 32 }}
              aria-label="Close"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: "20px 22px 26px", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeCodes.map((c) => (
              <div key={c.code} className="code-modal-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className="mono" style={{ fontSize: 17, fontWeight: 900, color: "var(--brand-text)" }}>
                      {c.code}
                    </span>
                    <span className="code-region-tag">{c.regionLabel}</span>
                    {c.status === "expiring" && (
                      <span className="deadline-tag">{t.expiringBadge}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="mono" style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                      {c.expiresAt === "PERMANENT"
                        ? t.permanentLabel
                        : `${t.deadlinePrefix} ${formatSlashMD(c.expiresAt)}`}
                    </span>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ height: 32, padding: "0 13px", fontSize: 12 }}
                      onClick={() => onCopyCode(c.code)}
                    >
                      <Copy size={12} /> {t.copyOneClick}
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)" }}>{c.rewards}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>{c.note}</div>
              </div>
            ))}
          </div>

          {expiredCodes.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)" }}>
                {t.expiredSectionTitle}
              </div>
              {expiredCodes.map((c) => (
                <div key={c.code} className="code-modal-card expired">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span className="mono" style={{ fontSize: 14, fontWeight: 700, textDecoration: "line-through", color: "var(--text-3)" }}>
                      {c.code}
                    </span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                      {t.expiredPrefix} ({formatSlashMD(c.expiresAt)})
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{c.rewards}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 12, color: "var(--text-3)", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            {t.codesFootNote}
          </div>
        </div>
      </div>
    </div>
  );
};
