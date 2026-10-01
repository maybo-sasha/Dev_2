// Uses globals: gsap, Lenis (loaded via CDN)

function appearOnScroll(params, _lastchild, onScrollCallback) {

    // ── Inject fill spans + ambient glow divs ──────────────────────────
    params.forEach(slide => {
        const title = slide.querySelector('.project-title');
        if (title && !title.querySelector('.title-fill')) {
            const fill = document.createElement('span');
            fill.className = 'title-fill';
            fill.textContent = title.textContent.trim();
            title.appendChild(fill);
        }

    });

    // ── Smooth scroll ──────────────────────────────────────────────────
    const lenis = new Lenis({ lerp: 0.07, smoothWheel: true });
    window.lenisInstance = lenis;
    let rafId;
    function raf(time) { lenis.raf(time); rafId = requestAnimationFrame(raf); }
    rafId = requestAnimationFrame(raf);

    // ── Scroll direction tracking ──────────────────────────────────────
    let lastScrollY = window.scrollY;
    let scrollDir = 1; // 1 = down, -1 = up
    lenis.on('scroll', ({ scroll }) => {
        scrollDir = scroll > lastScrollY ? 1 : -1;
        lastScrollY = scroll;
    });

    // ── Active slide + title fill ──────────────────────────────────────
    // The title is lit only while its slide is the one in frame: the fill
    // wipes in as the slide takes focus and wipes back out, in the direction
    // of travel, as it leaves. 'slidechange' tells the rest of the page.
    let activeSlide = null;

    function wipeFill(slide, lit) {
        const fill = slide.querySelector('.title-fill');
        if (!fill) return;
        // Tween the two insets as numbers and write the clip-path by hand: a
        // computed inset() serialises in shorthand, which GSAP cannot
        // interpolate from when a wipe is interrupted part-way.
        const clip  = fill._clip || (fill._clip = { t: 0, b: 100 });
        const apply = () => { fill.style.clipPath = 'inset(' + clip.t + '% 0% ' + clip.b + '% 0%)'; };
        // the fill enters from one edge and leaves by the other, so the wipe
        // keeps moving the way the page is scrolling
        const down = scrollDir === 1;
        gsap.killTweensOf(clip);
        if (lit) {
            clip.t = down ? 0 : 100;
            clip.b = down ? 100 : 0;
            apply();
            gsap.to(clip, { t: 0, b: 0, duration: 0.75, ease: 'power3.inOut', delay: 0.1, onUpdate: apply });
        } else {
            gsap.to(clip, { t: down ? 100 : 0, b: down ? 0 : 100, duration: 0.5, ease: 'power3.inOut', onUpdate: apply });
        }
    }

    function updateActive() {
        const vh = window.innerHeight;
        let closestDist = Infinity;
        let closestSlide = null;

        params.forEach(slide => {
            const rect = slide.getBoundingClientRect();
            const dist = Math.abs(rect.top + rect.height / 2 - vh / 2);
            if (dist < closestDist) { closestDist = dist; closestSlide = slide; }
        });

        if (closestSlide === activeSlide) return;
        if (activeSlide) {
            activeSlide.classList.remove('is-active');
            wipeFill(activeSlide, false);
        }
        activeSlide = closestSlide;
        if (!activeSlide) return;
        activeSlide.classList.add('is-active');
        wipeFill(activeSlide, true);
        window.dispatchEvent(new CustomEvent('slidechange', {
            detail: { slide: activeSlide, index: Array.prototype.indexOf.call(params, activeSlide), dir: scrollDir },
        }));
    }

    lenis.on('scroll', updateActive);
    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();

    // ── Parallax — title only ──────────────────────────────────────────
    // The title also blurs out as its slide leaves the centre of the frame
    // and back in as it arrives, in step with the card (hoverEffect.js uses
    // the same curve for the picture).
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function updateParallax() {
        const vh = window.innerHeight;
        params.forEach(slide => {
            const rect  = slide.getBoundingClientRect();
            const prog  = (rect.top + rect.height / 2 - vh / 2) / vh;
            const title = slide.querySelector('.project-title');
            if (!title) return;
            gsap.set(title, { y: prog * 120 });
            if (reduceMotion) return;

            const t = Math.min(1, Math.max(0, (Math.abs(prog) - 0.1) / 0.7));
            const blur = (t * t * (3 - 2 * t) * 5).toFixed(1);   // px, 0 when centred
            if (title._blur === blur) return;   // nothing to write for slides far off screen
            title._blur = blur;
            title.style.filter = blur === '0.0' ? '' : 'blur(' + blur + 'px)';
        });
    }
    lenis.on('scroll', updateParallax);
    updateParallax();

    // ── Entry animation ────────────────────────────────────────────────
    function animateIn(slide) {
        const card     = slide.querySelector('.project-card');
        const title    = slide.querySelector('.project-title');
        const category = slide.querySelector('.project-category');
        const num      = slide.querySelector('.slide-num');

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (card) {
            tl.fromTo(card,
                { opacity: 0, y: 80, scale: 0.93 },
                { opacity: 1, y: 0,  scale: 1, duration: 1.3 }
            );
        }
        if (title) {
            // Only animate opacity — parallax owns the y position
            tl.fromTo(title,
                { opacity: 0 },
                { opacity: 1, duration: 0.9 },
                '-=0.85'
            );
        }
        const meta = [category, num].filter(Boolean);
        if (meta.length) {
            tl.fromTo(meta,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.55, stagger: 0.08 },
                '-=0.65'
            );
        }

        if (onScrollCallback) onScrollCallback(slide);
    }

    // ── IntersectionObserver ───────────────────────────────────────────
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                entry.target.dataset.animated = '1';
                animateIn(entry.target);
            }
        });
    }, { threshold: 0.18 });

    params.forEach(s => observer.observe(s));

    // ── Video play/pause when in view ─────────────────────────────────
    const videoObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const v = entry.target;
            if (entry.isIntersecting) {
                v.play().catch(() => {});
            } else {
                v.pause();
            }
        });
    }, { threshold: 0.4 });

    params.forEach(slide => {
        slide.querySelectorAll('video.project-video').forEach(v => videoObserver.observe(v));
    });

    // ── Destroy ────────────────────────────────────────────────────────
    return function destroy() {
        cancelAnimationFrame(rafId);
        observer.disconnect();
        videoObserver.disconnect();
        lenis.destroy();
    };
}
