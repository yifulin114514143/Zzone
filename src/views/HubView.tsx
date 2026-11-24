import React, { useEffect, useState } from "react";
import {
  Bookmark,
  Copy,
  Cpu,
  Database,
  RefreshCw,
  Rss,
  Smartphone,
  Ticket,
} from "lucide-react";
import { REDEEM_CODES } from "../industry/codes";
import { COLLECTOR_SOURCES } from "../industry/site";
import type { NewsItem } from "../industry/types";
import { formatSlashMD } from "../lib/time";
import { NewsCard } from "../components/NewsCard";
import { SourceBadge } from "../components/SourceIcon";

interface HubViewProps {
  news: NewsItem[];
  bookmarks: Set<string>;
  readIds: Set<string>;
  syncedAt: string;
  isSyncing: boolean;
  onSync: () => void;
  onOpenItem: (item: NewsItem) => void;
  onToggleBookmark: (id: string) => void;
  onNotify: (msg: string) => void;
}

interface StatusResp {
  ok: boolean;
  syncRuns: number;
  pool?: {
    totalAccounts: number;
    activeAccounts: number;
  };
}

export const HubView: React.FC<HubViewProps> = ({
  news,
  bookmarks,
  readIds,
  syncedAt,
  isSyncing,
  onSync,
  onOpenItem,
  onToggleBookmark,
  onNotify,
}) => {
  const [status, setStatus] = useState<StatusResp | null>(null);

  useEffect(() => {
    fetch("/api/v1/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok) setStatus(d);
      })
      .catch(() => {});
  }, [syncedAt]);

  const savedNews = news.filter((n) => bookmarks.has(n.id));
  const activeCodes = REDEEM_CODES.filter((c) => c.status !== "expired");

  const copyText = async (txt: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      onNotify(msg);
    } catch {
      onNotify("请手动复制");
    }
  };

  const poolSnippet = `# 1. 填入多平台号池（米游社 / 米游铺 / X / B站）
cp server/pool.example.json server/pool.json

# 2. Docker 一键启动（含 server/data/store.json 自动持久化）
docker compose up -d --build

# 3. 绑定域名与自动 HTTPS
cp Caddyfile.example Caddyfile && caddy start`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* 1. Multi-Source Collector & Account Pool Status */}
      <section>
        <div className="section-head">
          <div className="section-title-group">
            <span className="section-kicker">MULTI-SOURCE COLLECTOR & POOL</span>
            <h1 className="section-title">全平台信源、实时采集与号池接入</h1>
          </div>
          <button type="button" className="btn-primary" onClick={onSync} disabled={isSyncing}>
            <RefreshCw size={14} className={isSyncing ? "spin" : ""} />
            {isSyncing ? "正在抓取..." : "立即刷新双官网"}
          </button>
        </div>

        <div className="grid-3" style={{ marginBottom: 16 }}>
          <div className="panel">
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--text-3)" }}>
              <Database size={15} color="var(--sky)" /> 官方双源 & 周边定期巡检
            </div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: "var(--sky)", margin: "6px 0" }}>
              ONLINE
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>
              国服 + 国际官网每 15 分钟自动抓取，周边与活动巡检每 30 分钟定时刷新。
            </div>
          </div>

          <div className="panel">
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--text-3)" }}>
              <Cpu size={15} color="var(--gold-text)" /> 号池调度层 (server/pool.mjs)
            </div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, margin: "6px 0" }}>
              {status?.pool?.activeAccounts ?? 0} 个活跃号
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>
              预留米游社/米游铺、X、B站号池轮换与 429 自动退避，填入 <code>server/pool.json</code> 即刻生效。
            </div>
          </div>

          <div className="panel">
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--text-3)" }}>
              <Smartphone size={15} color="var(--brand-text)" /> 标准 API & RSS 出口
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--brand-text)", margin: "8px 0" }}>
              REST · RSS · PWA
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", overflowWrap: "anywhere", lineHeight: 1.65 }}>
              提供 <code>/api/v1/news</code>、<code>/api/v1/events</code>、<code>/api/v1/merch</code>、<code>/api/v1/ingest</code> 与 <code>/feed.xml</code>。
            </div>
          </div>
        </div>

        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 800 }}>
            <Rss size={16} color="var(--brand-text)" /> 监控信源矩阵
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {COLLECTOR_SOURCES.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 240, flex: 1 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <SourceBadge platform={s.platform} />
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 14, fontWeight: 700 }}
                    >
                      {s.name}
                    </a>
                    <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                      {s.handle}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>{s.desc}</div>
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 99,
                    background:
                      s.mode === "live"
                        ? "var(--sky-soft)"
                        : s.mode === "pool-ready"
                        ? "var(--brand-soft)"
                        : "var(--surface)",
                    color:
                      s.mode === "live"
                        ? "var(--sky)"
                        : s.mode === "pool-ready"
                        ? "var(--brand-text)"
                        : "var(--text-2)",
                  }}
                >
                  {s.mode === "live" ? "实时在线" : s.mode === "pool-ready" ? "待接入号池" : "RSS 通道"}
                </span>
              </div>
            ))}
          </div>

          <div style={{ position: "relative" }}>
            <pre className="code-pre">{poolSnippet}</pre>
            <button
              type="button"
              className="btn-secondary"
              style={{ position: "absolute", top: 10, right: 10, height: 30, fontSize: 12 }}
              onClick={() => copyText(poolSnippet, "已复制号池与部署命令")}
            >
              <Copy size={12} /> 复制
            </button>
          </div>
        </div>
      </section>

      {/* 2. Valid Redeem Codes Only */}
      <section>
        <div className="section-head">
          <div className="section-title-group">
            <span className="section-kicker">ACTIVE CODES</span>
            <h2 className="section-title">当前可用兑换码 ({activeCodes.length})</h2>
          </div>
        </div>

        <div className="grid-2">
          {activeCodes.map((c) => (
            <div
              key={c.code}
              className="panel"
              style={{
                padding: "14px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 15.5,
                    fontWeight: 800,
                    color: "var(--brand-text)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Ticket size={15} /> {c.code}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                    {c.expiresAt === "PERMANENT" ? "长期有效" : `截止 ${formatSlashMD(c.expiresAt)}`}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ height: 28, padding: "0 10px", fontSize: 11.5 }}
                    onClick={() => copyText(c.code, `已复制兑换码：${c.code}`)}
                  >
                    <Copy size={12} /> 复制
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-2)" }}>{c.rewards}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Local Bookmarks */}
      <section>
        <div className="section-head">
          <div className="section-title-group">
            <span className="section-kicker">BOOKMARKS</span>
            <h2 className="section-title">我的本地收藏 ({savedNews.length})</h2>
          </div>
        </div>

        {savedNews.length === 0 ? (
          <div className="panel" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-3)" }}>
            <Bookmark size={18} />
            <span>暂无收藏资讯。点击任意资讯卡片右上角的书签图标即可保存在本地浏览器中。</span>
          </div>
        ) : (
          <div className="news-grid">
            {savedNews.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                isBookmarked={true}
                isRead={readIds.has(item.id)}
                onOpen={onOpenItem}
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
