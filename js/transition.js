// Shared-element transition: the clicked project card scales up to fill the
// screen (becoming the next page's hero), then we navigate. The destination
// skips its entry curtain (via the heroZoom flag) so the motion feels continuous.
// Uses globals: gsap (loaded via CDN)
(function () {
    function zoom(card, dest) {
        const wrap  = card.querySelector('.project-img-wrap');
        const media = wrap && (wrap.querySelector('video') || wrap.querySelector('img'));
        if (!wrap || !media || !window.gsap) {
            if (window.__leaveTo) window.__leaveTo(dest); else window.location.href = dest;
            return;
        }

        const r = wrap.getBoundingClientRect();
        const radius = getComputedStyle(wrap).borderRadius;

        const overlay = document.createElement('div');
        overlay.className = 'zoom-overlay';
        overlay.style.cssText =
            'position:fixed;z-index:100001;overflow:hidden;background:#000;margin:0;' +
            'top:' + r.top + 'px;left:' + r.left + 'px;width:' + r.width + 'px;height:' + r.height + 'px;' +
            'border-radius:' + radius + ';will-change:width,height,top,left;';

        document.body.appendChild(overlay);
        // Move the ORIGINAL, already-playing media into the overlay (cloning would
        // reload it and flash a black frame). Moving keeps playback uninterrupted.
        // Remember where it came from: browser back can restore this page from
        // bfcache exactly as we left it, with the media still in the overlay
        // and the card sitting empty.
        media.__wrap = wrap;
        media.__cls = media.getAttribute('class') || '';
        media.__style = media.getAttribute('style') || '';
        media.removeAttribute('class');
        media.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
        overlay.appendChild(media);
        if (media.tagName === 'VIDEO') {
            media.muted = true;
            const p = media.play && media.play();
            if (p && p.catch) p.catch(function () {});
        }

        // tell the destination to skip its entry curtain
        try { sessionStorage.setItem('heroZoom', '1'); } catch (e) {}

        gsap.to(overlay, {
            top: 0, left: 0,
            width: window.innerWidth,
            height: window.innerHeight,
            borderRadius: 0,
            duration: 0.7,
            ease: 'expo.inOut',
            onComplete: function () {
                // snapshot the final frame so the destination hero can show it
                // instantly (kills the black flash while its video decodes)
                try {
                    if (media.tagName === 'VIDEO' && media.videoWidth) {
                        var c = document.createElement('canvas');
                        c.width = media.videoWidth;
                        c.height = media.videoHeight;
                        c.getContext('2d').drawImage(media, 0, 0);
                        sessionStorage.setItem('heroPoster', c.toDataURL('image/jpeg', 0.72));
                    }
                    // Hand the playhead over with it. Read at the end of the
                    // zoom rather than at click, so it matches the frame that
                    // is actually on screen when we navigate.
                    if (media.tagName === 'VIDEO' && isFinite(media.currentTime)) {
                        sessionStorage.setItem('heroTime', String(media.currentTime));
                    }
                } catch (e) {}
                window.location.href = dest;
            }
        });
    }

    // Put a zoomed card back together. The zoom moves the real media element
    // into a full-screen overlay, so if this page comes back from bfcache it
    // returns in that state: overlay still covering, card empty. Runs on every
    // pageshow rather than only the persisted ones, since it is a no-op when
    // there is nothing to undo.
    function unzoom() {
        document.querySelectorAll('.zoom-overlay').forEach(function (ov) {
            const m = ov.querySelector('video, img');
            if (m && m.__wrap) {
                if (m.__cls) m.setAttribute('class', m.__cls); else m.removeAttribute('class');
                if (m.__style) m.setAttribute('style', m.__style); else m.removeAttribute('style');
                m.__wrap.appendChild(m);
                if (m.tagName === 'VIDEO') {
                    const p = m.play && m.play();
                    if (p && p.catch) p.catch(function () {});
                }
            }
            ov.remove();
        });
    }
    window.addEventListener('pageshow', unzoom);
    unzoom();

    // Coming back should return you to the project you left, with its video
    // where you left it, rather than dropping you at the top of the deck.
    // index.js forces the deck to the top on load, so this runs after it and
    // again on the next frame to win that race.
    (function () {
        let href, t;
        try {
            href = sessionStorage.getItem('lastCard');
            t = parseFloat(sessionStorage.getItem('lastCardTime'));
            sessionStorage.removeItem('lastCard');
            sessionStorage.removeItem('lastCardTime');
        } catch (e) { return; }
        if (!href) return;

        const card = document.querySelector('.project-card[href="' + href + '"]');
        const slide = card && card.closest('.slide');
        if (!slide) return;

        function land() {
            const y = slide.getBoundingClientRect().top + window.scrollY;
            // Move the page natively and tell the smooth-scroller about it.
            // Going through Lenis alone is not enough: it silently ignores the
            // request while it is still starting up, and then the deck stays
            // at the top. Setting both is harmless when either one takes.
            window.scrollTo(0, y);
            document.documentElement.scrollTop = y;
            const l = window.lenisInstance || window.lenis;
            if (l && l.scrollTo) l.scrollTo(y, { immediate: true, force: true });
        }
        // Applied repeatedly rather than once: the deck resets itself to the
        // top during start-up (index.js does it outright, and the loader
        // finishes later still), so a single jump gets overwritten.
        land();
        requestAnimationFrame(land);
        setTimeout(land, 60);
        window.addEventListener('load', function () {
            land();
            setTimeout(land, 80);
            setTimeout(land, 260);
        });

        const v = slide.querySelector('video');
        if (!v || !isFinite(t) || t <= 0) return;

        let done = false;
        let tries = 0;
        const evs = ['loadedmetadata', 'loadeddata', 'canplay', 'seeked'];
        function seek() {
            if (done || tries >= 8) return;
            const d = v.duration;
            if (!isFinite(d) || d <= 0) return;
            tries++;
            const target = t % d;
            try { v.currentTime = target; } catch (e) { done = true; return; }
            if (Math.abs(v.currentTime - target) < 0.5) done = true;
        }
        seek();
        evs.forEach(function (ev) { v.addEventListener(ev, seek); });
        setTimeout(function () {
            evs.forEach(function (ev) { v.removeEventListener(ev, seek); });
        }, 4000);
    }());

    document.querySelectorAll('.project-card').forEach(function (card) {
        card.addEventListener('click', function (e) {
            const dest = card.getAttribute('href');
            if (!dest || dest === '#') return;
            e.preventDefault();

            // remember where we were leaving from, for the trip back. Read
            // here rather than inside zoom() so it also covers the playground,
            // which skips the shared-element zoom entirely.
            try {
                sessionStorage.setItem('lastCard', dest);
                const cv = card.querySelector('video');
                if (cv && isFinite(cv.currentTime)) {
                    sessionStorage.setItem('lastCardTime', String(cv.currentTime));
                }
            } catch (err) {}
            // Playground: skip the shared-element video zoom — use the normal
            // page transition so the video doesn't scale into the inner page.
            if (/playground\.html/i.test(dest)) {
                if (window.__leaveTo) window.__leaveTo(dest); else window.location.href = dest;
                return;
            }
            zoom(card, dest);
        });
    });
}());
