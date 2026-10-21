# Hidden portfolio projects

The portfolio currently publishes AI Decisioning Studio, Streams and AI skills for product design.

All other project HTML pages, source code and assets remain in their original repository locations. They are not included in the homepage, Work menu, Next-project sequence or production build. The About page and shared About overlay remain available.

The four former homepage sections and their media scripts are saved in [home-projects.html](./home-projects.html). This archive is not a build entry and is never loaded by the live site.

To restore a project:

1. Restore its homepage section from home-projects.html to index.html.
2. Add it back to js/workMenu.js and js/projectNav.js.
3. Add its page and runtime-only asset paths to portfolio.config.mjs. Vite handles module imports and HTML asset references automatically.
4. Update the visibility and playback tests, then rebuild.
