import type { RedeemCode } from "./types";

export const REDEEM_CODES: RedeemCode[] = [
  {
    code: "ZENLESSGIFT",
    rewards: "菲林 ×50 · 正式调查员记录 ×2 · 变频音擎电源 ×3 · 邦布算法模块 ×1",
    region: "国服 / 国际服通用",
    expiresAt: "PERMANENT",
    status: "active",
    note: "长期常驻迎新码，未领取过的新老绳匠均可使用。",
  },
  {
    code: "ZZZ34FINALITY",
    rewards: "菲林 ×60 · 丁尼 ×6,666",
    region: "国服 / 国际服通用",
    expiresAt: "2026-12-15T23:59:59+08:00",
    status: "active",
    note: "3.4「长日终尽」版本预热纪念兑换码，版本开启后仍可补兑。",
  },
  {
    code: "NEWWORLD34",
    rewards: "菲林 ×50 · 资深调查员记录 ×3",
    region: "国际服 / 亚服",
    expiresAt: "2026-12-02T23:59:59+08:00",
    status: "expiring",
    note: "第三季纪念回顾「新世界前夜」海外社区口令，3.4 上线当日失效。",
  },
  {
    code: "SUNBRINGER34",
    rewards: "菲林 ×300 · 资深调查员记录 ×2 · 音擎能源模块 ×3 · 丁尼 ×30,000",
    region: "国服 / 国际服通用",
    expiresAt: "2026-11-22T23:59:59+08:00",
    status: "expired",
    note: "3.4 前瞻特别节目 300 菲林限时口令（官方已于 11/22 23:59 截止，归档备查）。",
  },
];
