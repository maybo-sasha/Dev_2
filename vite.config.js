import { defineConfig } from 'vite';
import { resolve, join } from 'path';
import { cpSync, existsSync } from 'fs';

// GitHub Pages project sites live under /Dev_2/; local dev stays at /
const base = process.env.GITHUB_PAGES === 'true' ? '/Dev_2/' : '/';

// Vite bundles CSS and module scripts but leaves classic <script src="./js/...">
// tags and runtime asset paths (inline scripts, workMenu.js) untouched — copy them into dist.
// Never ship raw source drops: the AI-skill folder holds a nested git repo and
// zip archives (~4.7MB) that the site never references — it uses the curated
// copies in assets/ai-champion/ instead.
const COPY_EXCLUDE = [/[\\/]assets[\\/]skills([\\/]|$)/, /[\\/]\.git([\\/]|$)/, /\.zip$/i];

function copyStaticToDist(...paths) {
  return {
    name: 'copy-static-to-dist',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist');
      for (const rel of paths) {
        const src = resolve(__dirname, rel);
        if (!existsSync(src)) continue;
        cpSync(src, join(outDir, rel), {
          recursive: true,
          filter: (from) => !COPY_EXCLUDE.some((re) => re.test(from)),
        });
      }
    },
  };
}

export default defineConfig({
  base,
  plugins: [copyStaticToDist('js', 'assets', 'homePage')],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        'ai-champion': resolve(__dirname, 'ai-champion.html'),
        'ai-decisioning-studio': resolve(__dirname, 'ai-decisioning-studio.html'),
        'lucky-buddies': resolve(__dirname, 'lucky-buddies.html'),
        'player-journey': resolve(__dirname, 'player-journey.html'),
        playground: resolve(__dirname, 'playground.html'),
        project: resolve(__dirname, 'project.html'),
        'tetris-block-party': resolve(__dirname, 'tetris-block-party.html'),
      },
    },
  },
});
