/* This is a script to build the site with Pagefind */

const { execSync } = require('child_process');
const { existsSync } = require('fs');

/**
 * 构建口径与 astro.config.mjs 共用 scripts/platform.mjs，保证：
 *   - 本地 `pnpm build` 与 GitHub Actions 完全同构（都输出 dist/）
 *   - 只有真实平台构建环境（VERCEL / NETLIFY / CF_PAGES / EDGEONE）才换输出目录
 *   - 不再用「.vercel 目录存在」这种猜测：旧产物躺在磁盘上就会把本地构建误判成 vercel
 */
async function main() {
    const { detectPlatform, outputDirFor, describePlatform } = await import('./platform.mjs');

    const platform = detectPlatform();
    const outputDir = outputDirFor(platform);

    console.log(describePlatform(platform));

    try {
        // 1. Astro build
        console.log('🔨 Running Astro build...');
        execSync('npx astro build', {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        // 2. 产物目录自检
        if (!existsSync(outputDir)) {
            console.error(`❌ Output directory does not exist: ${outputDir}`);
            process.exit(1);
        }

        // 3. Pagefind 索引
        console.log('🔍 Running Pagefind search index generation...');
        execSync(`npx pagefind --site ${outputDir}`, {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        console.log('✅ Build completed!');
        console.log(`📊 Output directory: ${outputDir}`);
        console.log(`📊 Search index generated at: ${outputDir}/pagefind/`);

    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('❌ Build failed:', error);
    process.exit(1);
});
