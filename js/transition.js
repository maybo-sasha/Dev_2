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
