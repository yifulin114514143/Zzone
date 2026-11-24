import React from "react";
import type { SourcePlatformKey } from "../industry/types";
import { PLATFORM_LABELS, useI18n } from "../lib/i18n";

export const SOURCE_PLATFORM_META: Record<
  SourcePlatformKey,
  { name: string; short: string; color: string; bg: string }
> = {
  "zzz-cn": {
    name: "绝区零中国官网",
    short: "国服官网",
    color: "#ff5a1f",
    bg: "rgba(255, 90, 31, 0.14)",
  },
  hoyoverse: {
    name: "HoYoverse 国际官网",
    short: "国际官网",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.14)",
  },
  "zzz-jp": {
    name: "绝区零日服官网 · 日本专属",
    short: "日服官网",
    color: "#fb7185",
    bg: "rgba(251, 113, 133, 0.15)",
  },
  "zzz-kr": {
    name: "绝区零韩服官网 · 韩国专属",
    short: "韩服官网",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.15)",
  },
  "zzz-tw": {
    name: "绝区零繁中官网 · 港澳台",
    short: "繁中官网",
    color: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.15)",
  },
  miyoushe: {
    name: "米游社绝区零官方",
    short: "米游社",
    color: "#60a5fa",
    bg: "rgba(96, 165, 250, 0.15)",
  },
  hoyolab: {
    name: "HoYoLAB 官方社区",
    short: "HoYoLAB",
    color: "#818cf8",
    bg: "rgba(129, 140, 248, 0.15)",
  },
  x: {
    name: "X 绝区零官方",
    short: "X 官方",
    color: "#e2e8f0",
    bg: "rgba(148, 163, 184, 0.16)",
  },
  bilibili: {
    name: "Bilibili 绝区零官方",
    short: "B站官方",
    color: "#fb7299",
    bg: "rgba(251, 114, 153, 0.15)",
  },
  youtube: {
    name: "YouTube 官方频道",
    short: "YouTube",
    color: "#f43f5e",
    bg: "rgba(244, 63, 94, 0.15)",
  },
  weibo: {
    name: "微博 @绝区零 / @米游铺",
    short: "微博官方",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.15)",
  },
  naver: {
    name: "Naver Lounge 绝区零韩服官方",
    short: "Naver 韩服",
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.15)",
  },
  tmall: {
    name: "绝区零三Z官方旗舰店",
    short: "天猫三Z店",
    color: "#f43f5e",
    bg: "rgba(244, 63, 94, 0.15)",
  },
  douyin: {
    name: "绝区零周边旗舰店",
    short: "抖音周边店",
    color: "#f5b73b",
    bg: "rgba(245, 183, 59, 0.15)",
  },
  apex: {
    name: "APEX-TOYS / GSC / 万代官厂",
    short: "手办官厂",
    color: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.15)",
  },
  amiami: {
    name: "AmiAmi / Fantasy Village / GiGO",
    short: "日区周边/景品",
    color: "#fb7185",
    bg: "rgba(251, 113, 133, 0.15)",
  },
  hpoi: {
    name: "Hpoi 手办维基",
    short: "Hpoi 维基",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.14)",
  },
  cpp: {
    name: "CPP 无差别同人站",
    short: "CPP 同人",
    color: "#a78bfa",
    bg: "rgba(167, 139, 250, 0.15)",
  },
  comiket: {
    name: "Comiket / 赤ブー / 海外大型漫展",
    short: "海外漫展/同人",
    color: "#c084fc",
    bg: "rgba(192, 132, 252, 0.15)",
  },
  ticket: {
    name: "B站会员购 & 大麦网",
    short: "会员购/大麦",
    color: "#fb7185",
    bg: "rgba(251, 113, 133, 0.15)",
  },
  xhs: {
    name: "小红书 & TapTap",
    short: "小红书/Tap",
    color: "#f43f5e",
    bg: "rgba(244, 63, 94, 0.14)",
  },
  taptap: {
    name: "TapTap 绝区零专区",
    short: "TapTap",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.14)",
  },
  nga: {
    name: "NGA 绝区零社区",
    short: "NGA",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.14)",
  },
  reddit: {
    name: "Reddit r/ZZZ_Official",
    short: "Reddit",
    color: "#ff6b35",
    bg: "rgba(255, 107, 53, 0.14)",
  },
  fan: {
    name: "同人 / 玩家企划",
    short: "同人企划",
    color: "#a78bfa",
    bg: "rgba(167, 139, 250, 0.15)",
  },
};

export const SourceIcon: React.FC<{ platform: SourcePlatformKey; size?: number }> = ({
  platform,
  size = 14,
}) => {
  switch (platform) {
    case "x":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "bilibili":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 4l2.5 3M17 4l-2.5 3" />
          <rect x="3" y="7" width="18" height="13" rx="3.5" />
          <path d="M9 12v2.5M15 12v2.5" />
        </svg>
      );
    case "youtube":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
          <polygon points="10,9.5 15.5,12 10,14.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "miyoushe":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="4" />
          <path d="M7.5 15V9l4.5 4 4.5-4v6" />
        </svg>
      );
    case "zzz-cn":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 6h14L5 18h14" />
        </svg>
      );
    case "zzz-jp":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "hoyoverse":
    case "hoyolab":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3.6 9h16.8M3.6 15h16.8M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" />
        </svg>
      );
    case "tmall":
    case "douyin":
    case "apex":
    case "hpoi":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8h12l-1 12H7L6 8z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      );
    case "ticket":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" />
          <path d="M13 6v12" strokeDasharray="2 2" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8M12 8v8" />
        </svg>
      );
  }
};

export const SourceBadge: React.FC<{
  platform: SourcePlatformKey;
  label?: string;
}> = ({ platform, label }) => {
  const { lang } = useI18n();
  const meta = SOURCE_PLATFORM_META[platform] ?? SOURCE_PLATFORM_META["zzz-cn"];
  const localizedShort = PLATFORM_LABELS[lang]?.[platform] || meta.short;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 8px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        background: meta.bg,
        color: platform === "x" ? "var(--text-1)" : meta.color,
        border: `1px solid ${platform === "x" ? "var(--border-strong)" : meta.bg}`,
        whiteSpace: "nowrap",
      }}
    >
      <SourceIcon platform={platform} size={12} />
      {label || localizedShort}
    </span>
  );
};
