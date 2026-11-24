# Zzone v2.0 · 绝区零全生态实时信息聚合站

专注、轻量的《绝区零》多信源实时信息聚合站（Web + PWA），原生直连 **5 大官方数据源**（国服官网、HoYoverse 国际官网、米游社官方、HoYoLAB 官方、日服差量监测），支持 **中 / 日 / 韩 / 英四语切换（严格遵循游戏内官方译名）**，内置服务端 LLM 号池安全接入与全站语义去重。

## v2.0 核心板块与升级亮点（5 大频道）

1. **发现**：3.4 新版本 / 杭州 FES / ZLIVE 核心焦点轮播、双倒计时、可用兑换码一键速抄栏、即将到来活动、实拍周边精选，以及跨板块零撞图 + 主题多样化精选公告。
2. **资讯**：5 大官方免号池实时聚合，自动过滤例行水讯与过期社区帖，支持跨服语义指纹 + 封面图哈希合并去重、重要度 × 时效性智能排序。
3. **活动**：官方大型活动（杭州 FES、ZLIVE、品牌联动）与同人 Only 展，自动区分「即将开启 / 进行中」与可折叠「往日活动归档」，支持 `.ics` 日历导出与长图分段展开。
4. **周边**：米游铺、三Z STUDIO 与跨界联名周边多图档案，超长竖版商品详情图自动按节展开阅读 + 种草心愿单。
5. **信源**：15 源全生态采集矩阵、服务端 LLM 号池调度（`server/llm.mjs`，磁盘缓存防重复计费、前端零 Key 泄露）、标准 REST API & RSS 出口。

## 本地运行与轻量部署

```bash
# 本地构建并启动
pnpm install && pnpm run build && pnpm run start

# 1.7G 轻量服务器推荐：Node + systemd 直接部署（参考 deploy/zzone.service.example）
# 或 Docker 一键部署
docker compose up -d --build

# 绑定专属域名并自动签发 HTTPS 证书
cp Caddyfile.example Caddyfile && caddy start
```

## 版本管理与 GitHub 云端自动备份（本地仅留最新版）

全部历史版本（`v1.0.0`、`v2.0.0` 及未来版本）均托管在 GitHub 仓库 **[yifulin114514143/Zzone](https://github.com/yifulin114514143/Zzone)** 的 Tags & Releases 中（自动排除 `server/pool.json`、`server/data/`、`node_modules`、`dist`，确保公开仓库零密钥泄露），本地仅保留最新工作区不占额外空间：

```bash
# 未来每完成一个新版本（如 v2.1.0 或 v3.0.0），运行这一行即可自动完成：
# 脱敏安全审计 → tsc/vite 构建校验 → Git 提交打标 → 推送 GitHub 分支与 Tag → 自动创建 GitHub Release → 清理本地旧归档
pnpm run backup -- v3.0.0 "新增功能与优化说明"

# 查看全部历史版本标签 / 对比两版改动
git tag -l -n3
git diff v1.0.0..v2.0.0 --stat

# 如需临时回到某个历史版本排查或下载：
git checkout v1.0.0      # 临时切回 v1.0.0
git checkout main        # 切回最新主线
```
