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

    // ── Active slide + fill reveal (persistent — never resets once shown) ──
    const revealedFills = new Set();

    function updateActive() {
        const vh = window.innerHeight;
        let closestDist = Infinity;
        let closestSlide = null;

        params.forEach(slide => {
            const rect = slide.getBoundingClientRect();
            const dist = Math.abs(rect.top + rect.height / 2 - vh / 2);
            if (dist < closestDist) { closestDist = dist; closestSlide = slide; }
        });

        params.forEach(slide => {
            slide.classList.toggle('is-active', slide === closestSlide);

            if (slide === closestSlide && !revealedFills.has(slide)) {
                revealedFills.add(slide);
                const fill = slide.querySelector('.title-fill');
                if (fill) {
                    // scrolling down → wipe bottom-to-top; up → top-to-bottom
                    const fromClip = scrollDir === 1
                        ? 'inset(0 0 100% 0)'
                        : 'inset(100% 0 0 0)';
                    gsap.fromTo(fill,
                        { clipPath: fromClip },
                        { clipPath: 'inset(0% 0 0% 0)', duration: 0.75, ease: 'power3.inOut', delay: 0.1 }
                    );
                }
            }
            // Inactive slide: clip-path left as-is — fill stays visible once revealed
        });
    }

    lenis.on('scroll', updateActive);
    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();

    // ── Parallax — title only ──────────────────────────────────────────
    function updateParallax() {
        const vh = window.innerHeight;
        params.forEach(slide => {
            const rect  = slide.getBoundingClientRect();
            const prog  = (rect.top + rect.height / 2 - vh / 2) / vh;
            const title = slide.querySelector('.project-title');
            if (title) gsap.set(title, { y: prog * 120 });
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

    // ── Destroy ────────────────────────────────────────────────────────
    return function destroy() {
        cancelAnimationFrame(rafId);
        observer.disconnect();
        lenis.destroy();
    };
}
