import { defineConfig } from 'vite';
import { resolve } from 'path';

// GitHub Pages project sites live under /Dev_2/; local dev stays at /
const base = process.env.GITHUB_PAGES === 'true' ? '/Dev_2/' : '/';

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
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
