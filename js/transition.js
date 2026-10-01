// Shared-element transition: the clicked project card scales up to fill the
// screen (becoming the next page's hero), then we navigate. The destination
// skips its entry curtain (via the heroZoom flag) so the motion feels continuous.
//
// Coming back runs it in reverse: the project's picture starts full-screen
// and shrinks into its card, on its own slide. There are two ways back in:
//   • from bfcache: the page returns exactly as it was left, zoomed overlay
//     and all, so that same overlay is animated back down;
//   • as a fresh load: the head script in index.html holds the card's poster
//     full-screen from the first paint, index.js starts the deck on the right
//     slide, and this file swaps the held poster for a real element and
//     shrinks it into place.
// Uses globals: gsap (loaded via CDN)
(function () {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // one move, both directions
    const ZOOM = { duration: 0.7, ease: 'expo.inOut' };

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
            duration: ZOOM.duration,
            ease: ZOOM.ease,
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
                // Stop on that frame. If this page is kept (bfcache) the video
                // then waits on exactly the picture the project page was handed,
                // so a return can close on it and carry straight on.
                if (media.tagName === 'VIDEO') { try { media.pause(); } catch (e) {} }
                window.location.href = dest;
            }
        });
    }

    // Put a zoomed card back together. The zoom moves the real media element
    // into a full-screen overlay, so if this page comes back from bfcache it
    // returns in that state: overlay still covering, card empty. A no-op when
    // there is nothing to undo.
    function unzoom() {
        document.querySelectorAll('.zoom-overlay').forEach(function (ov) {
            const m = ov.querySelector('video, img');
            if (m && m.__wrap) putBack(m);
            ov.remove();
        });
    }

    // Return a borrowed media element to its card, as it was.
    function putBack(m) {
        if (m.__cls) m.setAttribute('class', m.__cls); else m.removeAttribute('class');
        if (m.__style) m.setAttribute('style', m.__style); else m.removeAttribute('style');
        m.__wrap.appendChild(m);
        if (m.tagName === 'VIDEO') {
            const p = m.play && m.play();
            if (p && p.catch) p.catch(function () {});
        }
    }

    // ── The way back ───────────────────────────────────────────────────

    const clipName = function (u) {
        try { return decodeURIComponent(String(u).trim().split(/[?#]/)[0].split('/').pop()); } catch (e) { return ''; }
    };

    // Send a video to a moment in its clip and call back once it is showing
    // that frame (true), or once it is clear it will not get there (false).
    function cue(video, time, then, patience) {
        let over = false;
        let tries = 0;
        const evs = ['loadedmetadata', 'loadeddata', 'canplay', 'seeked'];
        function end(ok) {
            if (over) return;
            over = true;
            evs.forEach(function (ev) { video.removeEventListener(ev, check); });
            then(ok);
        }
        function check() {
            if (over) return;
            const d = video.duration;
            if (video.readyState < 1 || !isFinite(d) || d <= 0) return;
            const target = Math.max(0, Math.min(time, d - 0.05));
            if (Math.abs(video.currentTime - target) > 0.3) {
                if (video.seeking) return;
                if (tries++ >= 6) { end(false); return; }
                try { video.currentTime = target; } catch (e) { end(false); }
                return;
            }
            if (video.readyState >= 2 && !video.seeking) end(true);
        }
        evs.forEach(function (ev) { video.addEventListener(ev, check); });
        setTimeout(function () { end(false); }, patience);
        check();
    }

    // What each card shows, keyed by the page it opens. A project page reads
    // this to leave on its card's picture (transitionFade.js), and the head
    // script in index.html reads it to open on that picture.
    try {
        const cards = {};
        document.querySelectorAll('.project-card').forEach(function (card) {
            const href = card.getAttribute('href');
            const v = card.querySelector('video');
            if (!href || !v || !v.poster) return;
            cards[href] = {
                poster: v.poster,                       // the property, so it is absolute
                // which clip the card plays, so a project page can tell whether
                // its own hero is the same one
                clip: clipName(v.getAttribute('src') || (v.dataset.playlist || '').split(',')[0]),
                crop: v.dataset.crop || '',
                // the playground is entered through the curtain, so it leaves that way too
                zoom: !/playground\.html/i.test(href),
            };
        });
        sessionStorage.setItem('homeCards', JSON.stringify(cards));
    } catch (e) {}

    // Shrink a full-screen overlay onto its card: zoom(), backwards.
    function shrinkTo(overlay, wrap, done) {
        // Hold the deck still, or the card moves out from under the picture.
        // Not with lenis.stop(): that puts overflow:hidden on <html>, which
        // makes <body> the scroller (it has overflow-x:hidden), so the
        // document stops being scrollable, the page snaps to the top, and
        // Lenis measures a scroll limit of zero that it then clamps every
        // jump to. A class that cinema.js and the stylesheet both honour
        // holds the deck without touching overflow.
        const root = document.documentElement;
        root.classList.add('deck-held');
        const r = wrap.getBoundingClientRect();
        gsap.to(overlay, {
            top: r.top, left: r.left,
            width: r.width,
            height: r.height,
            borderRadius: getComputedStyle(wrap).borderRadius,
            duration: ZOOM.duration,
            ease: ZOOM.ease,
            onComplete: function () {
                root.classList.remove('deck-held');
                done();
            }
        });
    }

    // The card's video is not filling the screen this time (a fresh load, or a
    // page that was left some other way), so a still opens the move instead,
    // full-screen. `shot` is the frame the project page closed on and where
    // it sits in the clip; without one it is the card's poster, its first
    // frame. The card's video is sent to that moment and joins the still on
    // top once it is showing the same picture, so the swap cannot be seen and
    // what arrives in the card is already moving. If the video is slow, the
    // still makes the trip alone and gives way when the video turns up.
    function landWithPoster(card, shot) {
        const root  = document.documentElement;
        const wrap  = card.querySelector('.project-img-wrap');
        const video = wrap && wrap.querySelector('video');
        if (!wrap || !video || !video.poster || !window.gsap) { root.classList.add('landed'); return; }

        const FILL = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;';
        const overlay = document.createElement('div');
        overlay.className = 'return-overlay';
        overlay.style.cssText =
            'position:fixed;z-index:100001;overflow:hidden;background:#000;margin:0;pointer-events:none;' +
            'top:0;left:0;width:' + window.innerWidth + 'px;height:' + window.innerHeight + 'px;' +
            'will-change:width,height,top,left;';
        const img = new Image();
        if (video.dataset.crop) img.dataset.crop = video.dataset.crop;   // same crop as the card
        img.style.cssText = FILL;
        img.src = (shot && shot.image) || video.poster;
        overlay.appendChild(img);
        document.body.appendChild(overlay);

        // the card underneath must be whole when the picture reaches it (hoverEffect.js)
        wrap.dataset.instant = '1';

        let riding = false;     // the video is in the overlay
        let cued   = false;     // the video has reached the frame, or given up trying
        let shrunk = false;
        let done   = false;

        function finish() {
            if (done) return;
            done = true;
            const clear = function () { overlay.remove(); delete wrap.dataset.instant; };
            if (riding) {
                // same frame in the card as in the overlay, so swap them outright
                putBack(video);
                clear();
            } else {
                gsap.to(overlay, { opacity: 0, duration: 0.25, ease: 'power1.out', onComplete: clear });
            }
        }

        function join() {
            if (done || riding) return;
            if (shrunk) { finish(); return; }   // too late to ride: just let the card take over
            if (video.readyState < 2) return;
            riding = true;
            video.__wrap  = wrap;
            video.__cls   = video.getAttribute('class') || '';
            video.__style = video.getAttribute('style') || '';
            video.removeAttribute('class');
            video.style.cssText = FILL;
            overlay.appendChild(video);
            video.muted = true;
            const p = video.play && video.play();
            if (p && p.catch) p.catch(function () {});
        }
        cue(video, shot ? shot.time : 0, function () { cued = true; join(); }, 3000);

        let started = false;
        function start() {
            if (started) return;
            started = true;
            root.classList.add('landed');   // the cover held since first paint hands over
            shrinkTo(overlay, wrap, function () {
                shrunk = true;
                if (riding || cued) finish();   // otherwise cue() calls back, within its patience
            });
        }
        // Wait for the picture to be ready, so the cover never hands over to an
        // empty box. It was already on screen behind the cover, so this is quick.
        if (img.decode) img.decode().then(start, start);
        setTimeout(start, 500);
    }

    // Fresh load: index.js has already put the deck on the right slide.
    const back = window.__returnTo;
    window.__returnTo = null;
    if (back && back.zoom) {
        const card = document.querySelector('.project-card[href="' + back.href + '"]');
        if (card) landWithPoster(card, back.image ? { image: back.image, time: back.time } : null);
        else document.documentElement.classList.add('landed');
    }

    // Restored from bfcache: the page is exactly as it was left.
    window.addEventListener('pageshow', function (e) {
        if (!e.persisted) return;

        let href = null;
        let shot = null;
        try {
            href = sessionStorage.getItem('returnSlide');
            const frame = sessionStorage.getItem('returnFrame');
            if (frame) shot = { image: frame, time: parseFloat(sessionStorage.getItem('returnTime')) || 0 };
            sessionStorage.removeItem('returnSlide');
            sessionStorage.removeItem('returnFrame');
            sessionStorage.removeItem('returnTime');
        } catch (err) {}

        const overlay = document.querySelector('.zoom-overlay');
        const media = overlay && overlay.querySelector('video, img');
        if (overlay && media && media.__wrap && window.gsap && !reduce) {
            // Left through a card: its video is still filling the screen, stopped
            // on the frame the zoom ended on. That is the frame the project page
            // closes on, so it only has to start playing again.
            if (media.tagName === 'VIDEO') {
                const p = media.play && media.play();
                if (p && p.catch) p.catch(function () {});
            }
            shrinkTo(overlay, media.__wrap, unzoom);
            return;
        }
        unzoom();

        // Left some other way (the work menu, say), so the deck may be on a
        // different slide from the project being returned from. Go to it.
        const card  = href && document.querySelector('.project-card[href="' + href + '"]');
        const slide = card && card.closest('.slide');
        if (!slide) return;
        const y = Math.round(slide.getBoundingClientRect().top + window.scrollY);
        window.scrollTo(0, y);
        if (window.lenisInstance) window.lenisInstance.scrollTo(y, { immediate: true, force: true });
        if (!reduce && !/playground\.html/i.test(href)) landWithPoster(card, shot);
    });
    unzoom();

    document.querySelectorAll('.project-card').forEach(function (card) {
        card.addEventListener('click', function (e) {
            const dest = card.getAttribute('href');
            if (!dest || dest === '#') return;
            e.preventDefault();
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
