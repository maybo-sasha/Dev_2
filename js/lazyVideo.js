// lazyVideo.js — play videos only when they're actually needed.
//   • .about-video inside .about-overlay → plays ONLY while the overlay is open
//     (and is never even fetched until then: preload="none")
//   • every other video → plays when scrolled into view, pauses when out of view
// Skips data-playlist videos and .pg-reel crossfades (those manage themselves).
// Fully defensive: never throws / never breaks a page.
(function () {
    try {
        // ── About-overlay videos: gate on the overlay being open ──────────────
        var overlayVids = [];
        document.querySelectorAll('.about-overlay').forEach(function (ov) {
            var v = ov.querySelector('video');
            if (!v) return;
            overlayVids.push(v);
            v.removeAttribute('autoplay');
            v.muted = true;
            v.preload = 'none';
            v.__overlay = ov;
            var sync = function () {
                if (ov.classList.contains('is-open')) {
                    var p = v.play(); if (p && p.catch) p.catch(function () {});
                } else {
                    v.pause();
                }
            };
            new MutationObserver(sync).observe(ov, { attributes: true, attributeFilter: ['class'] });
        });

        // ── All other videos ──────────────────────────────────────────────────
        var all = Array.prototype.slice.call(document.querySelectorAll('video')).filter(function (v) {
            return !v.hasAttribute('data-playlist') && !(v.closest && v.closest('.pg-reel'));
        });

        all.forEach(function (v) {
            v.muted = true;
            if (overlayVids.indexOf(v) !== -1) return;        // handled above
            var r = v.getBoundingClientRect();
            var inView = r.top < (window.innerHeight || 0) && r.bottom > 0;
            // Off-screen at load: don't autoplay/fetch — let the observer start it later.
            if (!inView) {
                v.removeAttribute('autoplay');
                if (v.preload === 'auto' || !v.preload) v.preload = 'metadata';
                try { v.pause(); } catch (e) {}
            }
        });

        if (!('IntersectionObserver' in window)) return;
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                var v = e.target;
                if (!e.isIntersecting) { v.pause(); return; }
                if (v.__overlay && !v.__overlay.classList.contains('is-open')) return; // overlay closed
                var p = v.play(); if (p && p.catch) p.catch(function () {});
            });
        }, { threshold: 0.2 });
        all.forEach(function (v) { io.observe(v); });
    } catch (e) { /* never break the page over video lazy-loading */ }
})();
