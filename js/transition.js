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
        overlay.style.cssText =
            'position:fixed;z-index:100001;overflow:hidden;background:#000;margin:0;' +
            'top:' + r.top + 'px;left:' + r.left + 'px;width:' + r.width + 'px;height:' + r.height + 'px;' +
            'border-radius:' + radius + ';will-change:width,height,top,left;';

        document.body.appendChild(overlay);
        // Move the ORIGINAL, already-playing media into the overlay (cloning would
        // reload it and flash a black frame). Moving keeps playback uninterrupted.
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
                } catch (e) {}
                window.location.href = dest;
            }
        });
    }

    document.querySelectorAll('.project-card').forEach(function (card) {
        card.addEventListener('click', function (e) {
            const dest = card.getAttribute('href');
            if (!dest || dest === '#') return;
            e.preventDefault();
            zoom(card, dest);
        });
    });
}());
