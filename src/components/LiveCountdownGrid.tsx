import React, { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";
import { getCountdown } from "../lib/time";

export const LiveCountdownGrid: React.FC<{ targetIso: string }> = ({ targetIso }) => {
  const { t } = useI18n();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const cd = getCountdown(targetIso, now);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="cd-grid" aria-label="Live Countdown">
      <div className="cd-box">
        <span className="cd-num">{pad(cd.days)}</span>
        <span className="cd-lbl">{t.cdUnits[0]}</span>
      </div>
      <div className="cd-box">
        <span className="cd-num">{pad(cd.hours)}</span>
        <span className="cd-lbl">{t.cdUnits[1]}</span>
      </div>
      <div className="cd-box">
        <span className="cd-num">{pad(cd.minutes)}</span>
        <span className="cd-lbl">{t.cdUnits[2]}</span>
      </div>
      <div className={`cd-box cd-box-sec ${cd.urgent48h ? "is-urgent" : ""}`}>
        <span className="cd-num" style={{ color: cd.urgent48h ? "var(--brand-text)" : "var(--gold-text)" }}>
          {pad(cd.seconds)}
        </span>
        <span className="cd-lbl">{t.cdUnits[3]}</span>
      </div>
    </div>
  );
};
