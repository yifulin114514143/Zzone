#!/usr/bin/env node
/**
 * Zzone 一键版本发布与 GitHub 远程全版本备份工具
 *
 * 默认策略：历史版本全托管在 GitHub（分支 + Tag + GitHub Release），本地只保留最新工作区不占额外空间。
 *
 * 用法：
 *   pnpm run backup -- v2.1.0 "新增功能与优化说明"
 *   pnpm run backup -- v3.0.0 "大版本更新说明" --keep-local   # 如需额外在本地 backups/ 留一份 tar.gz
 *   pnpm run backup -- v2.1.0 "离线测试" --no-push           # 仅本地打标，暂不推远程
 */
import crypto from "node:crypto";
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BACKUPS_DIR = path.join(ROOT, "backups");

const FORBIDDEN_PATHS = [/^server\/pool\.json$/, /^server\/data\//, /^\.env($|\.)/, /\.pem$/i];
const SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{24,}\b/,
  /\bgh[pous]_[A-Za-z0-9]{20,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\.ts\.net\b/i,
];

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, stdio: "pipe", encoding: "utf8", ...opts }).trim();
}

function runGit(args, opts = {}) {
  return execFileSync("git", args, { cwd: ROOT, stdio: "pipe", encoding: "utf8", ...opts }).trim();
}

function hasGhCli() {
  try {
    execFileSync("gh", ["auth", "status"], { cwd: ROOT, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function ensureCleanOfSecrets(files) {
  for (const rel of files) {
    if (FORBIDDEN_PATHS.some((rx) => rx.test(rel))) {
      throw new Error(`安全拦截：检测到敏感文件将进入版本库 (${rel})，已中止发布！`);
    }
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;
    if (
      rel === "scripts/release-backup.mjs" ||
      rel.endsWith(".example.json") ||
      /\.(png|jpe?g|webp|ico|svg|woff2?)$/i.test(rel)
    ) {
      continue;
    }
    const content = fs.readFileSync(abs, "utf8");
    for (const rx of SECRET_PATTERNS) {
      if (rx.test(content)) {
        throw new Error(`安全拦截：在 ${rel} 中检测到疑似密钥/私网域名，已中止发布！`);
      }
    }
  }
}

function createLocalArchive(tag) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  const archiveName = `zzone-${tag}.tar.gz`;
  const archivePath = path.join(BACKUPS_DIR, archiveName);
  runGit(["archive", "--format=tar.gz", `--prefix=zzone-${tag}/`, "-o", archivePath, tag]);
  const sha = crypto.createHash("sha256").update(fs.readFileSync(archivePath)).digest("hex");
  const sizeKb = (fs.statSync(archivePath).size / 1024).toFixed(1);
  console.log(`• 已额外生成本地归档包: backups/${archiveName} (${sizeKb} KB, sha256 ${sha.slice(0, 16)}...)`);
}

function main() {
  const rawArgs = process.argv.slice(2);
  const noPush = rawArgs.includes("--no-push");
  const keepLocal = rawArgs.includes("--keep-local");
  const positional = rawArgs.filter((a) => !a.startsWith("--"));

  const versionInput = positional[0];
  const summary = positional[1] || `Zzone ${versionInput || ""} 版本更新`;

  if (!versionInput || !/^v?\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(versionInput)) {
    console.error(
      '用法：\n  pnpm run backup -- v2.1.0 "本版更新说明"\n  pnpm run backup -- v3.0.0 "大版本升级" --keep-local'
    );
    process.exit(1);
  }

  const semver = versionInput.replace(/^v/, "");
  const tag = `v${semver}`;

  if (runGit(["tag", "-l", tag]) === tag) {
    console.error(`标签 ${tag} 已存在！请递增版本号（如 v2.0.1 / v2.1.0 / v3.0.0）。`);
    process.exit(1);
  }

  // 1. Update package.json version
  const pkgPath = path.join(ROOT, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (pkg.version !== semver) {
    pkg.version = semver;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    console.log(`• 已更新 package.json version -> ${semver}`);
  }

  // 2. Typecheck + production build + server syntax check
  console.log("• 正在执行 TypeScript 检查、生产构建与后端语法校验...");
  run("./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/vite build && node --check server/index.mjs && node --check server/llm.mjs");

  // 3. Stage & run secret safety audit (protects Public repos!)
  runGit(["add", "-A"]);
  const staged = runGit(["diff", "--cached", "--name-only"])
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  ensureCleanOfSecrets(staged);

  if (staged.length > 0) {
    runGit(["commit", "-m", `release(${tag}): ${summary}`]);
    console.log(`• 已创建 Git 提交 (${staged.length} 个变更文件)`);
  } else {
    console.log("• 工作区无新增改动，直接基于当前 HEAD 打版本标签");
  }

  // 4. Create annotated Git tag
  runGit(["tag", "-a", tag, "-m", `${tag} — ${summary}`]);
  console.log(`• 已创建 Git 版本标签 ${tag}`);

  // 5. Push branch & tag to GitHub + create GitHub Release automatically
  if (!noPush) {
    const remotes = runGit(["remote"]);
    if (!remotes) {
      throw new Error("未配置远程仓库 origin，无法推送！可先执行 git remote add origin <repo-url> 或使用 --no-push。");
    }
    console.log("• 正在同步最新代码与版本标签至 GitHub...");
    runGit(["push", "origin", "HEAD"]);
    runGit(["push", "origin", tag]);
    console.log(`✓ 已推送 main 与标签 ${tag} 至 GitHub`);

    if (hasGhCli()) {
      try {
        execFileSync(
          "gh",
          ["release", "create", tag, "--title", `Zzone ${tag}`, "--notes", summary],
          { cwd: ROOT, stdio: "pipe", encoding: "utf8" }
        );
        console.log(`✓ 已自动发布 GitHub Release: ${tag}（云端自动托管源码 .zip / .tar.gz）`);
      } catch (err) {
        console.warn(`! 创建 GitHub Release 失败（标签已推送成功）: ${err.message}`);
      }
    }
  }

  // 6. Keep local workspace slim: remove local backups/ unless --keep-local is explicitly requested
  if (keepLocal) {
    createLocalArchive(tag);
  } else if (fs.existsSync(BACKUPS_DIR)) {
    fs.rmSync(BACKUPS_DIR, { recursive: true, force: true });
    console.log("• 已自动清理本地 backups/ 离线压缩包，仅保留当前最新工作区（全部历史版本已存 GitHub）");
  }
}

main();
