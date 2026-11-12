/**
 * 部署平台检测 —— 本地与 CI 的唯一口径来源（single source of truth）
 *
 * 目的：本地 `pnpm build` 与 GitHub Actions 里的 `pnpm build` 必须产出**同一份东西**，
 *       都是纯静态站点、都落在 `dist/`，这样本地预览/验证的结果才能代表线上。
 *
 * 规则：只有真实平台构建环境注入的变量存在时才启用对应 adapter；
 *       其余一切情况（本地、GitHub Actions、Docker 里手跑）都走纯静态。
 *
 * 被谁用：
 *   - astro.config.mjs          → 决定 adapter
 *   - scripts/build-with-pagefind.cjs → 决定 pagefind 的 --site 目录
 */

/** 平台构建环境才会自动注入的变量 */
const PLATFORM_ENV = {
    cloudflare: "CF_PAGES",
    netlify: "NETLIFY",
    edgeone: "EDGEONE",
    vercel: "VERCEL",
};

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {"cloudflare"|"netlify"|"edgeone"|"vercel"|"static"}
 */
export function detectPlatform(env = process.env) {
    for (const [platform, flag] of Object.entries(PLATFORM_ENV)) {
        if (env[flag]) return platform;
    }
    // 显式强制静态（本地想复现 CI 时可用），也作为默认行为
    return "static";
}

/** 各平台产物目录（astro build 的 outDir / vercel 的 output static） */
const OUTPUT_DIRS = {
    static: "dist",
    cloudflare: "dist",
    netlify: "dist",
    edgeone: "dist",
    vercel: ".vercel/output/static",
};

/**
 * @param {ReturnType<typeof detectPlatform>} platform
 * @returns {string}
 */
export function outputDirFor(platform) {
    return OUTPUT_DIRS[platform] ?? "dist";
}

/** 打印一行构建口径，方便在日志里一眼确认 */
export function describePlatform(platform) {
    const out = outputDirFor(platform);
    return `[build] 平台: ${platform} | 输出目录: ${out} | 模式: ${platform === "static" ? "纯静态" : "平台 adapter"}`;
}
