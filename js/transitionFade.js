// Page wipe transition. On any internal navigation, slide the black panel up
// to cover (html.leaving) then navigate; the next page slides it away on load
// via the CSS page-reveal animation. No opacity fade — it reads as movement.
(function () {
    const isHome = !!document.querySelector('[data-barba-namespace="home"]');
    const page   = location.pathname.split('/').pop() || 'index.html';

    // A project page leaves its name behind, so the home page can open on the
    // slide it belongs to, however the visitor gets back there (a link here,
    // or the browser's own back button, which gives no chance to say anything
    // on the way out).
    if (!isHome) {
        try { sessionStorage.setItem('returnSlide', page); } catch (e) {}
    }

    // Leaving a project for the home page: instead of the black wipe, close on
    // a frame of this project's card video. The home page opens on that same
    // frame, picks its video up from it, and shrinks it back into the card:
    // the zoom that brought the visitor here, backwards. transition.js records
    // what each card shows; without that record (a visit that never passed
    // through home) there is nothing to close on, and the wipe is used as before.

    // Arrived straight from the home page? Then home is the previous history
    // entry, and "back to home" can be a real back. That matters: the browser
    // usually still has that page whole (bfcache), with its video loaded and
    // its WebGL running, so it returns at once. A fresh load of home has to
    // start all of that again while a still sits on the screen.
    const cameFromHome = (function () {
        try {
            const r = new URL(document.referrer);
            return r.origin === location.origin && /\/(index\.html)?$/.test(r.pathname);
        } catch (e) { return false; }
    }());

    // Arrived through a card zoom? The card's video was stopped on the frame
    // the zoom ended on, and is still sitting on it. That frame is this page's
    // --hero-poster (set in its head), and its time is heroTime, which the
    // block below is about to read and clear.
    let entry = null;
    try {
        const m = /^url\(["']?(.*?)["']?\)$/.exec(document.documentElement.style.getPropertyValue('--hero-poster').trim());
        const t = parseFloat(sessionStorage.getItem('heroTime'));
        if (m && m[1] && isFinite(t)) entry = { image: m[1], time: t };
    } catch (e) {}

    const clipName = u => {
        try { return decodeURIComponent(String(u).split(/[?#]/)[0].split('/').pop()); } catch (e) { return ''; }
    };

    // The frame to close on, and where in the clip it is.
    function closingFrame(card) {
        // 1. The frame the home video is waiting on. Nothing has to move.
        if (entry) return entry;
        // 2. Whatever the hero is showing now, if it is the same clip as the
        //    card: the home video is then sent to that moment.
        const hero = document.querySelector('[class*="hero"] video') || document.querySelector('main video');
        if (hero && card.clip && clipName(hero.currentSrc || hero.src) === card.clip &&
            hero.readyState >= 2 && hero.videoWidth) {
            try {
                const scale = Math.min(1, 1600 / hero.videoWidth);
                const c = document.createElement('canvas');
                c.width  = Math.round(hero.videoWidth * scale);
                c.height = Math.round(hero.videoHeight * scale);
                c.getContext('2d').drawImage(hero, 0, 0, c.width, c.height);
                return { image: c.toDataURL('image/jpeg', 0.8), time: hero.currentTime };
            } catch (e) {}
        }
        // 3. The card's poster, which is its first frame.
        return { image: card.poster, time: 0 };
    }

    let cover = null;
    let backTimer;
    function coverWithCard(href) {
        if (isHome || !/(^|\/)(index\.html)?([?#].*)?$/.test(href)) return false;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
        let card;
        try { card = JSON.parse(sessionStorage.getItem('homeCards') || '{}')[page]; } catch (e) {}
        if (!card || !card.zoom || !card.poster) return false;

        const shot = closingFrame(card);
        try {
            sessionStorage.setItem('returnFrame', shot.image);
            sessionStorage.setItem('returnTime', String(shot.time));
        } catch (e) {
            // no room to pass the frame along: fall back to the poster, which needs none
            try { sessionStorage.removeItem('returnFrame'); sessionStorage.removeItem('returnTime'); } catch (err) {}
            shot.image = card.poster;
        }

        cover = document.createElement('div');
        cover.style.cssText =
            'position:fixed;inset:0;z-index:100001;overflow:hidden;background:#000;opacity:0;' +
            // eases in from slightly large, so the picture arrives moving, not as a held still
            'transform:scale(1.05);' +
            'transition:opacity 0.3s cubic-bezier(0.23,1,0.32,1),transform 0.32s cubic-bezier(0.23,1,0.32,1);';
        const img = new Image();
        if (card.crop) img.dataset.crop = card.crop;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
        img.src = shot.image;
        cover.appendChild(img);
        document.body.appendChild(cover);
        cover.getBoundingClientRect();   // commit opacity:0 so the fade has a start
        cover.style.opacity = '1';
        cover.style.transform = 'scale(1)';

        setTimeout(() => {
            if (cameFromHome && history.length > 1) {
                history.back();
                // if there turned out to be nothing to go back to, go the long way
                backTimer = setTimeout(() => { location.href = href; }, 900);
            } else {
                location.href = href;
            }
        }, 310);
        return true;
    }
    // once the page is on its way out, the long way is no longer wanted
    window.addEventListener('pagehide', () => clearTimeout(backTimer));

    let leaving = false;
    function leaveTo(href) {
        if (leaving) return;
        leaving = true;
        if (coverWithCard(href)) return;
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

    // bfcache restore (browser back/forward): clear the cover state, and let
    // links leave again: the page comes back with `leaving` still set
    window.addEventListener('pageshow', e => {
        if (!e.persisted) return;
        document.documentElement.classList.remove('leaving');
        if (cover) { cover.remove(); cover = null; }
        leaving = false;
        // restored without running the script above, so say it again
        if (!isHome) {
            try { sessionStorage.setItem('returnSlide', page); } catch (err) {}
        }
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
    // Only when we arrived from a card zoom. The head script sets .instant for
    // exactly that case, which is a truer signal than the timestamp: it holds
    // even when the card was an image and left no playhead behind.
    if (!document.documentElement.classList.contains('instant')) return;

    const v = document.querySelector('[class*="hero"] video') || document.querySelector('main video');
    if (!v) return;

    // The hero is already backed by heroPoster, the frame captured at the
    // instant we navigated. A video's own poster attribute is a different
    // picture entirely, and it paints over that captured frame for the moment
    // before the video decodes. On ai-champion that poster is a still from a
    // different skill, so it reads as a blink of unrelated footage.
    v.removeAttribute('poster');

    let t;
    try {
        t = sessionStorage.getItem('heroTime');
        sessionStorage.removeItem('heroTime');
    } catch (e) { return; }
    if (t === null) return;

    t = parseFloat(t);
    if (!isFinite(t) || t <= 0) return;

    // Hold the video back until it is sitting on the right frame, so the
    // captured still shows through instead of the video running from the top
    // and then jumping.
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
