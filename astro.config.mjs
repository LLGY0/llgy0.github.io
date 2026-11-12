import { defineConfig } from "astro/config";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import svelte, { vitePreprocess } from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import swup from "@swup/astro";
import sitemap from "@astrojs/sitemap";
import cloudflarePages from "@astrojs/cloudflare";
import netlify from "@astrojs/netlify";
import vercel from "@astrojs/vercel";
import edgeone from "@edgeone/astro";
import decapCmsOauth from "decap-cms-oauth-astro";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeKatex from "rehype-katex";
import rehypeComponents from "rehype-components";
import rehypeCallouts from "rehype-callouts";
import remarkDirective from "remark-directive";
import remarkMath from "remark-math";
import remarkSectionize from "remark-sectionize";

import { siteConfig } from "./src/config.ts";
import { pluginCollapseButton } from "./src/plugins/expressive-code/collapse-button.ts";
import { pluginCopyButton } from "./src/plugins/expressive-code/copy-button.js";
import { pluginLanguageBadge } from "./src/plugins/expressive-code/language-badge.ts";
import { GithubCardComponent } from "./src/plugins/rehype-component-github-card.mjs";
import { MusicCardComponent } from "./src/plugins/rehype-component-music-card.mjs";
import { rehypeMermaid } from "./src/plugins/rehype-mermaid.mjs";
import { rehypeLazyLoadMedia } from "./src/plugins/rehype-lazy-load-media.mjs";
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.js";
import { remarkExcerpt } from "./src/plugins/remark-excerpt.js";
import { remarkMermaid } from "./src/plugins/remark-mermaid.js";
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs";


// ---------------------------------------------------------------------------
// 部署目标：本地与 CI 同构
//   口径统一在 scripts/platform.mjs —— 只有真实平台构建环境变量（CF_PAGES /
//   NETLIFY / EDGEONE / VERCEL）存在时才启用对应 adapter；本地 `pnpm build` 与
//   GitHub Actions 一律走纯静态，产物落 dist/。
//   以前这里判断 GITHUB_ACTIONS：CI 是纯静态（dist/），本地却落到 vercel
//   serverless（.vercel/output/static），导致本地验证不了线上构建。
// ---------------------------------------------------------------------------
import { detectPlatform, describePlatform } from "./scripts/platform.mjs";

const platform = detectPlatform();

const adapter = platform === "cloudflare"
    ? cloudflarePages()
    : platform === "netlify"
        ? netlify()
        : platform === "edgeone"
            ? edgeone()
            : platform === "vercel"
                ? vercel({ mode: "serverless" })
                : undefined;

console.log(describePlatform(platform));

// Ref: https://astro.build/config
export default defineConfig({
    site: siteConfig.siteURL,
    trailingSlash: "always",
    adapter: adapter,
    integrations: [
        decapCmsOauth({
            configPath: "./.decap.yml", // Path to the Decap CMS configuration file
            decapCMSVersion: "3.9.0",
            enable: false, // Set to true to use oauth (Requires .env configuration)
        }),
        swup({
            theme: false,
            animationClass: "transition-swup-", // see https://swup.js.org/options/#animationselector
            containers: [
                "#swup-container",
                "#left-sidebar",
                "#right-sidebar",
                "#middle-sidebar",
            ],
            cache: true,
            preload: false, // 关闭预取：国内弱网下预取会抢占首屏带宽
            accessibility: true,
            updateHead: true,
            updateBodyClass: false,
            globalInstance: true,
            // Scroll related configuration optimization
            smoothScrolling: false, // Disable smooth scrolling to improve performance and avoid conflicts with anchor navigation
            resolveUrl: (url) => url,
            animateHistoryBrowsing: false,
            skipPopStateHandling: (event) => {
                // Skip anchor link handling, let the browser handle it natively
                return event.state && event.state.url && event.state.url.includes("#");
            },
        }),
        icon({
            include: {
                "fa6-brands": ["*"],
                "fa6-regular": ["*"],
                "fa6-solid": ["*"],
                mdi: ["*"],
            },
        }),
        expressiveCode({
            themes: ["github-light", "github-dark"],
            themeCSSSelector: (theme) => `[data-theme="${theme}"]`,
            plugins: [
                pluginCollapsibleSections(),
                pluginLineNumbers(),
                pluginCollapseButton(),
                pluginCopyButton(),
                pluginLanguageBadge(),
            ],
            defaultProps: {
                wrap: true,
                overridesByLang: {
                    shellsession: {
                        showLineNumbers: false,
                    },
                },
            },
            styleOverrides: {
                codeBackground: "var(--codeblock-bg)",
                borderRadius: "0.75rem",
                borderColor: "none",
                codeFontSize: "0.875rem",
                codeFontFamily:
                    "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                codeLineHeight: "1.5rem",
                frames: {
                    editorBackground: "var(--codeblock-bg)",
                    terminalBackground: "var(--codeblock-bg)",
                    terminalTitlebarBackground: "var(--codeblock-bg)",
                    editorTabBarBackground: "var(--codeblock-bg)",
                    editorActiveTabBackground: "none",
                    editorActiveTabIndicatorBottomColor: "var(--primary)",
                    editorActiveTabIndicatorTopColor: "none",
                    editorTabBarBorderBottomColor: "var(--codeblock-bg)",
                    terminalTitlebarBorderBottomColor: "none",
                    copyButtonBackground: "var(--btn-regular-bg)",
                    copyButtonBackgroundHover: "var(--btn-regular-bg-hover)",
                    copyButtonBackgroundActive: "var(--btn-regular-bg-active)",
                    copyButtonForeground: "var(--btn-content)",
                },
                textMarkers: {
                    delHue: 0,
                    insHue: 180,
                    markHue: 250,
                },
            },
            frames: {
                showCopyToClipboardButton: false,
            },
        }),
        svelte({
            preprocess: vitePreprocess(),
        }),
        sitemap(),
    ],
    markdown: {
        remarkPlugins: [
            remarkMath,
            remarkReadingTime,
            remarkExcerpt,
            remarkDirective,
            remarkSectionize,
            parseDirectiveNode,
            remarkMermaid,
        ],
        rehypePlugins: [
            [
                rehypeAutolinkHeadings,
                {
                    behavior: "append",
                    properties: {
                        className: ["anchor"],
                    },
                    content: {
                        type: "element",
                        tagName: "span",
                        properties: {
                            className: ["anchor-icon"],
                            "data-pagefind-ignore": true,
                        },
                        children: [
                            {
                                type: "text",
                                value: "#",
                            },
                        ],
                    },
                },
            ],
            rehypeSlug,
            rehypeKatex,
            [
                rehypeComponents,
                {
                    components: {
                        github: GithubCardComponent,
                        music: MusicCardComponent,
                    },
                },
            ],
            [
                rehypeCallouts,
                {
                    theme: "github"
                }
            ],
            rehypeMermaid,
            rehypeLazyLoadMedia,
        ],
    },
    vite: {
        plugins: [tailwindcss()],
        build: {
            cssCodeSplit: true,
            cssMinify: "esbuild",
            minify: "esbuild",
            esbuildOptions: {
                drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
            },
            rollupOptions: {
                onwarn(warning, warn) {
                    if (
                        warning.message.includes("is dynamically imported by") &&
                        warning.message.includes("but also statically imported by")
                    ) {
                        return;
                    }
                    warn(warning);
                },
            },
        },
    },
    //build: {
    //    inlineStylesheets: "always",
    //},
});