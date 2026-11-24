import type { DeadlineItem } from "../industry/types";

const WEEK_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const WEEK_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function formatMD(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}.${day}`;
}

export function formatSlashMD(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}/${day}`;
}

export function formatHM(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function formatDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getWeekdayEn(iso: string): string {
  return WEEK_EN[new Date(iso).getDay()] ?? "MON";
}

export function getWeekdayZh(iso: string): string {
  return WEEK_ZH[new Date(iso).getDay()] ?? "周一";
}

export interface CountdownParts {
  expired: boolean;
  urgent48h: boolean;
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function getCountdown(targetIso: string, nowMs: number = Date.now()): CountdownParts {
  const targetMs = new Date(targetIso).getTime();
  const diff = targetMs - nowMs;
  if (Number.isNaN(diff) || diff <= 0) {
    return { expired: true, urgent48h: false, totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return {
    expired: false,
    urgent48h: diff <= 48 * 3600 * 1000,
    totalMs: diff,
    days,
    hours,
    minutes,
    seconds,
  };
}

export function relativeHoursText(iso: string, nowMs: number = Date.now()): string {
  const diffMin = Math.floor((nowMs - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d === 1) return "昨天";
  if (d < 7) return `${d} 天前`;
  return formatSlashMD(iso);
}

/**
 * Export deadlines to a real RFC 5545 .ics calendar file for Apple Calendar / Google Calendar / Mobile
 */
export function downloadDeadlinesIcs(deadlines: DeadlineItem[], filename = "zlesszone-deadlines.ics") {
  const fmtUtc = (iso: string) => {
    const d = new Date(iso);
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  };
  const nowStamp = fmtUtc(new Date().toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zlesszone//Inter-Knot Hot//ZH",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:绳网热讯 · 绝区零截止雷达",
  ];
  for (const item of deadlines) {
    const start = new Date(item.at);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${item.id}@zlesszone.local`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART:${fmtUtc(start.toISOString())}`);
    lines.push(`DTEND:${fmtUtc(end.toISOString())}`);
    lines.push(`SUMMARY:[绝区零] ${item.title.replace(/[,;]/g, " ")}`);
    lines.push(
      `DESCRIPTION:${item.subtitle.replace(/\n/g, " ")}${item.rewardHint ? ` | 奖励: ${item.rewardHint}` : ""}`
    );
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
