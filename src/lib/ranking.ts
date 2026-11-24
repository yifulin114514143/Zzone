import type { MerchItem, NewsItem, OfflineEvent } from "../industry/types";

/**
 * Determine whether an offline event has already ended (belongs in 往日活动)
 */
export function isEventPast(ev: OfflineEvent, nowMs = Date.now()): boolean {
  if (ev.status === "archive") return true;
  const endIso = ev.endAt;
  if (endIso) {
    const endMs = new Date(endIso).getTime();
    if (!Number.isNaN(endMs)) return endMs < nowMs;
  }
  const startMs = new Date(ev.startAt).getTime();
  if (!Number.isNaN(startMs)) {
    // Default 3-day grace window after startAt if endAt omitted
    return startMs + 3 * 86400_000 < nowMs;
  }
  return false;
}

/**
 * Compute importance + urgency score for active (upcoming/ongoing) events
 * Higher score = shown earlier
 */
function activeEventScore(ev: OfflineEvent, nowMs: number): number {
  let score = 0;

  // 1. Official & event scale importance
  if (ev.official) score += 500;
  if (ev.type === "fes") score += 260;
  else if (ev.type === "concert") score += 230;
  else if (ev.type === "collab_offline") score += 200;
  else if (ev.type === "popup") score += 160;
  else if (ev.type === "fan_live") score += 90;
  else score += 70;

  // 2. Time proximity (sooner upcoming or ongoing = much higher urgency)
  const startMs = new Date(ev.startAt).getTime();
  if (!Number.isNaN(startMs)) {
    const daysAway = (startMs - nowMs) / 86400_000;
    if (daysAway <= 0) {
      // Currently happening right now
      score += 180;
    } else if (daysAway <= 7) {
      score += 150 - daysAway * 6;
    } else if (daysAway <= 21) {
      score += 100 - daysAway * 2;
    } else {
      score += Math.max(10, 60 - daysAway);
    }
  }

  return score;
}

export function partitionAndSortEvents(events: OfflineEvent[], nowMs = Date.now()) {
  const active: OfflineEvent[] = [];
  const past: OfflineEvent[] = [];

  for (const ev of events) {
    if (isEventPast(ev, nowMs)) past.push(ev);
    else active.push(ev);
  }

  active.sort((a, b) => activeEventScore(b, nowMs) - activeEventScore(a, nowMs));
  past.sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
  );

  return { active, past };
}

/**
 * News importance + timeliness ranking:
 * - Major upcoming version, FES/ZLIVE, official collabs, merch drops & active deadlines go FIRST
 * - Birthday art, wallpapers, minor stage unlocks & expired notices automatically sink BELOW
 */
export function computeNewsPriorityScore(item: NewsItem, nowMs = Date.now()): number {
  const title = item.title || "";
  let score = 50;

  // 1. Deadline urgency or expiration check
  if (item.deadlineAt) {
    const dlMs = new Date(item.deadlineAt).getTime();
    if (!Number.isNaN(dlMs)) {
      const daysLeft = (dlMs - nowMs) / 86400_000;
      if (daysLeft < 0) {
        score -= 75; // Already expired -> push way down
      } else if (daysLeft <= 10) {
        score += 42 - daysLeft * 1.5; // Urgent active deadline
      } else {
        score += 18;
      }
    }
  }

  // 2. High-importance content signals (ZH / JA / KO / EN)
  if (/3\.4|长日终尽|ついには長き|긴 나날의 끝자락|Finality of the Day/i.test(title)) score += 52;
  if (/情报总览|福利速递|情報まとめ|特典速報|정보 일람|혜택 속보|Intel Report|Benefits Express/i.test(title))
    score += 40;
  if (/FES|LIVE|布梦嘉年华/i.test(title)) score += 55;
  if (/联动|星穹铁道|知更鸟|卡芙卡|雅迪|肯德基|DJMAX|Discord|コラボ|ロビン|カフカ|콜라보|로빈|카프카|Crossover|Collab|Robin|Kafka/i.test(title))
    score += 45;
  if (/新品情报|周边|米游币兑换中心|手办|グッズ|フィギュア|굿즈|피규어|Merch|Figure/i.test(title))
    score += 34;
  if (/调频统计工具|限时频段|时装展示|版本内容一览|养成指南|変調統計ツール|コスチューム|변조 통계 도구|Statistical Tool|Outfit/i.test(title))
    score += 30;
  if (/有奖活动|创作者活动|赢取|イベント|보상 이벤트|Prize Event|Creator/i.test(title)) score += 24;

  // 3. Low-timeliness / outdated pre-stream teasers & redundant promo clip demotion
  if (/前瞻讨论活动|版本PV|前瞻特别节目$/i.test(title.trim())) {
    score -= 22;
  }
  if (/倒计时\s*\d+\s*小时|前瞻特别节目预告|直播预告|即将开启[！!]?$|予告番組のお知らせ|특별 방송 예고|Special Program Announcement/i.test(title)) {
    score -= 78;
  }
  if (/生日快乐|壁纸分享|影像档案记录|ハッピーバースデー|壁紙配布|映像アーカイブ|생일 축하|배경화면|영상 파일|Happy Birthday|Wallpaper Sharing|Video Archive/i.test(title))
    score -= 45;
  if (/薪火之影|长明之影|未归档影像/.test(title)) score -= 24;
  if (/3\.3版本|Ver\.3\.3|3\.3 버전|Version 3\.3/i.test(title) && !/限时频段|时装|Outfit/i.test(title))
    score -= 18;

  // 4. Recency decay (fresh within 7 days gets boost; older than 14 days decays smoothly)
  const pubMs = new Date(item.publishedAt).getTime();
  if (!Number.isNaN(pubMs)) {
    const ageDays = Math.max(0, (nowMs - pubMs) / 86400_000);
    if (ageDays <= 7) {
      score += (7 - ageDays) * 3.5;
    } else if (ageDays <= 21) {
      score -= (ageDays - 7) * 1.5;
    } else {
      score -= 25 + Math.min(35, (ageDays - 21) * 0.8);
    }
  }

  // 5. Base heat tie-breaker
  score += (item.heat || 60) * 0.15;

  return score;
}

export function sortNewsByPriority(items: NewsItem[], nowMs = Date.now()): NewsItem[] {
  return [...items].sort(
    (a, b) => computeNewsPriorityScore(b, nowMs) - computeNewsPriorityScore(a, nowMs)
  );
}

/**
 * Extract canonical asset fingerprint from an image URL so cross-section duplicate covers
 * (even across fastcdn.mihoyo.com vs fastcdn.hoyoverse.com) are reliably detected.
 */
export function getCoverAssetKey(url?: string): string {
  if (!url) return "";
  const file = url.split("?")[0].split("/").pop() || "";
  const hashMatch = file.match(/^([a-f0-9]{24,40})_/i);
  return hashMatch ? hashMatch[1].toLowerCase() : file.toLowerCase();
}

/**
 * Group closely related announcements into visual/topic clusters so the Discover home page
 * never stacks 3–4 nearly identical Version 3.4 / livestream / event cards side by side.
 */
function getHomeTopicCluster(item: NewsItem): string {
  const t = item.title || "";
  if (/3\.4|长日终尽|ついには長き|긴 나날의 끝자락|Finality of the Day/i.test(t)) {
    if (/创作者|クリエイター|크리에이터|Creator/i.test(t)) return "v34-creator";
    if (/养成|育成|육성|Guide/i.test(t)) return "v34-guide";
    // Group 3.4 福利速递 / 情报总览 / 前瞻特别节目 / 3.4 PV / 前瞻讨论 into one visual cluster
    return "v34-headline";
  }
  if (/FES|LIVE|布梦嘉年华/i.test(t)) return "fes-zlive";
  if (/决战于黎明之前|夜明け前、決戦へ|여명 전의 결전|Final Battle Before Dawn|薪火之影|长明之影/i.test(t)) {
    return "dawn-battle";
  }
  if (/调频统计工具|変調統計ツール|변조 통계 도구|Signal Search Statistical Tool/i.test(t)) {
    return "signal-tool";
  }
  if (/赛维里安|セヴェリアン|세베리안|Severian/i.test(t)) {
    return /时装|コスチューム|코스튬|Outfit/i.test(t) ? "severian-outfit" : "severian-agent";
  }
  if (/3\.3|重返天空|空へ還る|하늘로 돌아가는|Return to the Sky/i.test(t)) {
    return /同人|攻略|征集/i.test(t) ? "v33-ugc" : "v33-patch";
  }
  return `unique:${item.id}`;
}

/**
 * Select a clean, diverse set of high-priority news for the Discover home view:
 * 1) Avoids reusing any cover image already displayed in Hero / Upcoming Events / Fresh Merch
 * 2) Allows at most 1 representative card per visual topic cluster (e.g. only 1 main Ver.3.4 card
 *    instead of 4 near-identical livestream/overview/PV cards)
 * 3) Ensures zero duplicate cover images within the selected list
 */
export function pickDiverseHomeNews(
  prioritizedNews: NewsItem[],
  excludedCoverUrls: string[],
  limit = 6
): NewsItem[] {
  const usedCovers = new Set(excludedCoverUrls.map(getCoverAssetKey).filter(Boolean));
  const usedClusters = new Set<string>();
  const picked: NewsItem[] = [];
  const pickedIds = new Set<string>();

  // Pass 1: strictly enforce unique topic cluster + unique non-repeating cover image + visual cover preferred
  for (const item of prioritizedNews) {
    if (picked.length >= limit) break;
    const coverKey = getCoverAssetKey(item.coverUrl);
    if (!coverKey || usedCovers.has(coverKey)) continue;
    const cluster = getHomeTopicCluster(item);
    if (usedClusters.has(cluster)) continue;

    usedCovers.add(coverKey);
    usedClusters.add(cluster);
    picked.push(item);
    pickedIds.add(item.id);
  }

  // Pass 2: if still fewer than limit (e.g. small dataset), allow items without cover collisions
  if (picked.length < limit) {
    for (const item of prioritizedNews) {
      if (picked.length >= limit) break;
      if (pickedIds.has(item.id)) continue;
      const coverKey = getCoverAssetKey(item.coverUrl);
      if (coverKey && usedCovers.has(coverKey)) continue;
      if (coverKey) usedCovers.add(coverKey);
      picked.push(item);
      pickedIds.add(item.id);
    }
  }

  return picked;
}

/**
 * Merch urgency + freshness sorting:
 * ending_soon (with active cutoff) > coming_soon > presale > in_stock, then newest releaseDate
 */
export function sortMerchByPriority(items: MerchItem[], nowMs = Date.now()): MerchItem[] {
  const statusWeight: Record<MerchItem["saleStatus"], number> = {
    ending_soon: 400,
    coming_soon: 320,
    presale: 240,
    in_stock: 120,
  };

  const merchScore = (m: MerchItem): number => {
    let s = statusWeight[m.saleStatus] || 100;
    if (m.cadence === "fes_drop" || m.cadence === "version_drop") s += 55;
    if (m.cadence === "collab_drop") s += 35;

    if (m.cutoffAt) {
      const dl = new Date(m.cutoffAt).getTime();
      if (!Number.isNaN(dl)) {
        const daysLeft = (dl - nowMs) / 86400_000;
        if (daysLeft < 0) s -= 260; // Cutoff passed -> sink down
        else if (daysLeft <= 14) s += 60 - daysLeft * 2;
      }
    }

    const relMs = new Date(m.releaseDate).getTime();
    if (!Number.isNaN(relMs)) {
      const daysOld = (nowMs - relMs) / 86400_000;
      s += Math.max(-40, Math.min(40, 20 - daysOld * 0.3));
    }
    return s;
  };

  return [...items].sort((a, b) => merchScore(b) - merchScore(a));
}
