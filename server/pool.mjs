import fs from "node:fs";
import path from "node:path";

/**
 * Account Pool Manager (号池调度与轮换层)
 * 支持接入多平台账号凭据（米游社 / X / Bilibili / LLM），内置轮询负载均衡、
 * 429/风控自动冷却退避、健康度统计与热重载，方便后期直接填入号池无缝扩展实时抓取。
 */
export class AccountPoolManager {
  constructor(poolFilePath) {
    this.poolFilePath = poolFilePath;
    this.accounts = [];
    this.cursors = new Map();
    this.cooldowns = new Map();
    this.stats = { requests: 0, failures: 0, loadedAt: null };
    this.reload();
  }

  reload() {
    let raw = [];
    if (process.env.ACCOUNT_POOL_JSON) {
      try {
        const parsed = JSON.parse(process.env.ACCOUNT_POOL_JSON);
        raw = Array.isArray(parsed) ? parsed : parsed.accounts || [];
      } catch (err) {
        console.warn("[AccountPool] Failed to parse ACCOUNT_POOL_JSON:", err.message);
      }
    } else if (this.poolFilePath && fs.existsSync(this.poolFilePath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(this.poolFilePath, "utf-8"));
        raw = Array.isArray(parsed) ? parsed : parsed.accounts || [];
      } catch (err) {
        console.warn("[AccountPool] Failed to load pool file:", err.message);
      }
    }

    this.accounts = raw.map((acc, idx) => ({
      id: acc.id || `acc-${idx + 1}`,
      platform: acc.platform || "generic", // miyoushe | x | bilibili | llm
      label: acc.label || acc.id || `Account #${idx + 1}`,
      enabled: acc.enabled !== false,
      credentials: acc.credentials || {},
      proxy: acc.proxy || null,
      rateLimitPerMin: acc.rateLimitPerMin || 20,
    }));
    this.stats.loadedAt = new Date().toISOString();
    return this.getSummary();
  }

  /**
   * Pick next healthy account for a given platform using round-robin + cooldown skip
   */
  acquire(platform) {
    const now = Date.now();
    const candidates = this.accounts.filter((a) => {
      if (!a.enabled || a.platform !== platform) return false;
      const coolUntil = this.cooldowns.get(a.id) || 0;
      return now >= coolUntil;
    });

    if (candidates.length === 0) return null;

    const prev = this.cursors.get(platform) || 0;
    const chosen = candidates[prev % candidates.length];
    this.cursors.set(platform, (prev + 1) % candidates.length);
    this.stats.requests += 1;
    return chosen;
  }

  /**
   * Put an account into cooldown when encountering HTTP 429 / auth challenge
   */
  markCooldown(accountId, durationMs = 5 * 60 * 1000, reason = "rate-limit") {
    this.cooldowns.set(accountId, Date.now() + durationMs);
    this.stats.failures += 1;
    console.warn(
      `[AccountPool] Account ${accountId} cooled down for ${Math.round(durationMs / 1000)}s (${reason})`
    );
  }

  /**
   * Sanitized status summary safe to expose to frontend dashboard (never leaks tokens!)
   */
  getSummary() {
    const now = Date.now();
    const byPlatform = {};
    let activeAccounts = 0;

    for (const acc of this.accounts) {
      const cooling = (this.cooldowns.get(acc.id) || 0) > now;
      const healthy = acc.enabled && !cooling;
      if (healthy) activeAccounts += 1;
      if (!byPlatform[acc.platform]) {
        byPlatform[acc.platform] = { total: 0, healthy: 0, cooling: 0 };
      }
      byPlatform[acc.platform].total += 1;
      if (healthy) byPlatform[acc.platform].healthy += 1;
      if (cooling) byPlatform[acc.platform].cooling += 1;
    }

    return {
      configured: this.accounts.length > 0,
      totalAccounts: this.accounts.length,
      activeAccounts,
      byPlatform,
      requests: this.stats.requests,
      failures: this.stats.failures,
      loadedAt: this.stats.loadedAt,
      configFile: path.basename(this.poolFilePath || "pool.json"),
    };
  }
}
