// Page wipe transition. On any internal navigation, slide the black panel up
// to cover (html.leaving) then navigate; the next page slides it away on load
// via the CSS page-reveal animation. No opacity fade — it reads as movement.
(function () {
    let leaving = false;
    function leaveTo(href) {
        if (leaving) return;
        leaving = true;
        document.documentElement.classList.add('leaving');
        setTimeout(() => { location.href = href; }, 420);
    }
    window.__leaveTo = leaveTo;

    document.addEventListener('click', e => {
        if (e.defaultPrevented) return;                 // handled by another script
        const a = e.target.closest('a[href]');
        if (!a || a.target === '_blank' || a.hasAttribute('data-no-transition')) return;
        const href = a.getAttribute('href');
        if (!href || href.charAt(0) === '#' || /^(https?:|mailto:|tel:)/i.test(href)) return;
        e.preventDefault();
        leaveTo(href);
    });

    // bfcache restore (browser back/forward) — clear the cover state
    window.addEventListener('pageshow', e => {
        if (e.persisted) document.documentElement.classList.remove('leaving');
    });
})();

// The card that was clicked on the home page zooms up to become this page's
// hero, so the hero picks the video up where the card left off instead of
// restarting. transition.js leaves the playhead in sessionStorage on its way
// out; this reads it once and clears it.
//
// Lives here rather than in each page's head script because the hero video is
// not parsed yet at that point, and because the rule should hold for every
// project page without any of them opting in. Every hero is a *-hero section,
// which is the only assumption made about the markup.
(function () {
    let t;
    try {
        t = sessionStorage.getItem('heroTime');
        sessionStorage.removeItem('heroTime');
    } catch (e) { return; }
    if (t === null) return;

    t = parseFloat(t);
    if (!isFinite(t) || t <= 0) return;

    const v = document.querySelector('[class*="hero"] video') || document.querySelector('main video');
    if (!v) return;

    // Hold the video back until it is sitting on the right frame. The hero is
    // already backed by heroPoster, the snapshot taken at the instant we
    // navigated, so hiding the video shows that same frame rather than a gap.
    // Without this the hero renders from the top for a beat and then jumps,
    // which reads as a blink.
    const wasHidden = v.style.visibility;
    v.style.visibility = 'hidden';
    try { v.pause(); } catch (e) {}

    let done = false;
    let tries = 0;

    function reveal() {
        if (done) return;
        done = true;
        v.style.visibility = wasHidden || '';
        const p = v.play();
        if (p && p.catch) p.catch(function () {});
    }

    function seek() {
        // Bounded: if the seek cannot land (nothing buffered at that offset,
        // for instance) each attempt fires seeking/seeked, which calls this
        // again. Without a cap that loop feeds itself.
        if (done || tries >= 8) return;
        const d = v.duration;
        // The card and the hero are usually the same file, but not always. Wrap
        // rather than clamp so a shorter hero lands somewhere sensible instead
        // of pinned to its last frame.
        if (!isFinite(d) || d <= 0) return;
        tries++;
        const target = t % d;
        try { v.currentTime = target; } catch (e) { reveal(); return; }
        // Only reveal once the seek actually took. Setting currentTime this
        // early gets undone by whatever starts the hero playing, so a single
        // assignment silently loses and the video runs from the top.
        if (Math.abs(v.currentTime - target) < 0.5) reveal();
    }

    seek();
    ['loadedmetadata', 'loadeddata', 'canplay', 'seeked'].forEach(function (ev) {
        v.addEventListener(ev, seek);
    });
    setTimeout(seek, 60);
    // Never leave the hero hidden. If the seek cannot land, show the video
    // where it is rather than sit on a still frame forever.
    setTimeout(reveal, 1200);
    setTimeout(function () {
        ['loadedmetadata', 'loadeddata', 'canplay', 'seeked'].forEach(function (ev) {
            v.removeEventListener(ev, seek);
        });
    }, 4000);
})();
