import React, { useEffect, useState } from "react";
import { getCountdown } from "../lib/time";

export const LiveCountdownGrid: React.FC<{ targetIso: string }> = ({ targetIso }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const cd = getCountdown(targetIso, now);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="cd-grid" aria-label="实时倒计时">
      <div className="cd-box">
        <span className="cd-num">{pad(cd.days)}</span>
        <span className="cd-lbl">天</span>
      </div>
      <div className="cd-box">
        <span className="cd-num">{pad(cd.hours)}</span>
        <span className="cd-lbl">时</span>
      </div>
      <div className="cd-box">
        <span className="cd-num">{pad(cd.minutes)}</span>
        <span className="cd-lbl">分</span>
      </div>
      <div className="cd-box">
        <span className="cd-num" style={{ color: cd.urgent48h ? "var(--brand-text)" : "var(--gold-text)" }}>
          {pad(cd.seconds)}
        </span>
        <span className="cd-lbl">秒</span>
      </div>
    </div>
  );
};
