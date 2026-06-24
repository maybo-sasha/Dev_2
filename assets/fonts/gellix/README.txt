Gellix font (self-hosted)
=========================

Place the Gellix .woff2 files in THIS folder with these exact names:

  Gellix-Regular.woff2    (weight 400)
  Gellix-Medium.woff2     (weight 500)
  Gellix-SemiBold.woff2   (weight 600)
  Gellix-Bold.woff2       (weight 700)

They are referenced by @font-face in /style/style.css and used site-wide
via the --font-display / --font-body CSS variables.

Notes:
- .woff2 is preferred for the web. If you only have .otf/.ttf, convert them
  (e.g. https://transfonter.org or fontsource) to .woff2.
- Gellix is a commercial font; make sure you have a valid web licence.
- If your filenames or weights differ, tell me and I'll update style.css.
- Until the files are added, the site falls back to Helvetica Neue.
