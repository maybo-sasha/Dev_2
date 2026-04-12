// Uses globals: gsap, Lenis, barba (loaded via CDN)
// Particles and appearOnScroll are loaded as script tags before this file

const lastChild = document.querySelector('.slide:last-child');
const sliders   = document.querySelectorAll('.slide');
const nav       = document.querySelector('.nav-header');
const mouse     = document.querySelector('.cursor');
const overlay   = document.querySelector('.about-overlay');
const navLinks  = document.querySelectorAll('.nav-link');

// ── Nav entrance ───────────────────────────────────────────────────────────
gsap.fromTo(nav, { y: '-100%', opacity: 0 }, { y: '0%', opacity: 1, duration: 0.6, ease: 'power2.out' });

// ── Cursor ─────────────────────────────────────────────────────────────────
let rawX = 0, rawY = 0;

if (mouse) {
    // Drive position via left/top — CSS transform:translate(-50%,-50%) centres it.
    // GSAP never touches `transform`, so centering is always correct.
    const setLeft = gsap.quickSetter(mouse, 'left', 'px');
    const setTop  = gsap.quickSetter(mouse, 'top',  'px');

    window.addEventListener('mousemove', e => {
        rawX = e.clientX;
        rawY = e.clientY;
    });

    let isLocked   = false;
    let unlockTimer;

    gsap.ticker.add(() => {
        if (!isLocked) { setLeft(rawX); setTop(rawY); }
    });

    // ── Reset to default circle ───────────────────────────────────────
    const resetCursor = () => gsap.to(mouse, {
        width:  '2rem',
        height: '2rem',
        borderRadius: '50%',
        borderColor: 'rgba(255,255,255,0.75)',
        backgroundColor: 'transparent',
        duration: 0.25,
        ease: 'power2.out',
        overwrite: true,
    });

    // ── Nav links: auto-lock & expand to cover the button ────────────
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            clearTimeout(unlockTimer);
            isLocked = true;
            mouse.classList.add('has-ripple');

            const r  = link.getBoundingClientRect();
            const cx = r.left + r.width  / 2;
            const cy = r.top  + r.height / 2;

            // left/top = button centre → translate(-50%,-50%) centres cursor on it
            gsap.to(mouse, {
                left:  cx,
                top:   cy,
                width:  r.width  + 40,
                height: r.height + 20,
                borderRadius: '999px',
                borderColor: 'rgba(255,255,255,1)',
                backgroundColor: 'rgba(255,255,255,0.07)',
                duration: 0.35,
                ease: 'expo.out',
                overwrite: true,
            });
        });

        link.addEventListener('mouseleave', () => {
            // Small delay prevents flicker when moving between adjacent nav links
            unlockTimer = setTimeout(() => {
                isLocked = false;
                mouse.classList.remove('has-ripple');
                resetCursor();
            }, 40);
        });
    });

    // ── Project card hover: large circle with View label ─────────────
    const cursorText = mouse.querySelector('.cursor-text');
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            if (cursorText) cursorText.textContent = 'View';
            mouse.classList.add('show-label');
            gsap.to(mouse, {
                width:  '7rem',
                height: '7rem',
                borderColor: 'rgba(255,255,255,0.6)',
                backgroundColor: 'rgba(0,0,0,0.55)',
                duration: 0.5,
                ease: 'expo.out',
                overwrite: true,
            });
        });
        card.addEventListener('mouseleave', () => {
            mouse.classList.remove('show-label');
            resetCursor();
        });
    });

    // ── Click pulse ───────────────────────────────────────────────────
    document.addEventListener('mousedown', () => {
        gsap.to(mouse, {
            width:  '1.4rem',
            height: '1.4rem',
            duration: 0.09,
            ease: 'power3.in',
            overwrite: 'auto',
        });
    });
    document.addEventListener('mouseup', () => {
        gsap.to(mouse, {
            width:  '2rem',
            height: '2rem',
            duration: 0.2,
            ease: 'power2.out',
            overwrite: 'auto',
        });
    });
}

function cursorAnim() {}  // kept for call-site compat in appearOnScroll

// ── About overlay — circle-mask from nav link position ─────────────────────
let aboutOpen = false;

function openAbout(triggerEl) {
    if (aboutOpen) return;
    aboutOpen = true;

    const rect = triggerEl.getBoundingClientRect();
    const ox = rect.left + rect.width / 2;
    const oy = rect.top  + rect.height / 2;
    const origin = `${ox}px ${oy}px`;

    overlay.style.clipPath = `circle(0px at ${origin})`;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');

    navLinks.forEach(l => l.classList.toggle('active', l.dataset.page === 'about'));

    gsap.to(overlay, {
        clipPath: `circle(150vmax at ${origin})`,
        duration: 0.9,
        ease: 'power3.inOut',
    });

    gsap.fromTo('.about-block',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out', delay: 0.5 }
    );
}

function closeAbout() {
    if (!aboutOpen) return;

    const aboutLink = document.querySelector('.nav-link[data-page="about"]');
    const rect = aboutLink.getBoundingClientRect();
    const origin = `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px`;

    gsap.to('.about-block', {
        opacity: 0, y: -20, duration: 0.25, ease: 'power2.in',
    });

    gsap.to(overlay, {
        clipPath: `circle(0px at ${origin})`,
        duration: 0.75,
        ease: 'power3.inOut',
        delay: 0.1,
        onComplete: () => {
            overlay.classList.remove('is-open');
            overlay.setAttribute('aria-hidden', 'true');
            aboutOpen = false;
        }
    });

    navLinks.forEach(l => l.classList.toggle('active', l.dataset.page === 'work'));
}

navLinks.forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        if (link.dataset.page === 'about') {
            if (!aboutOpen) openAbout(link);
        } else {
            closeAbout();
        }
    });
});

window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && aboutOpen) closeAbout();
});

// ── Particles + scroll + hover effects ────────────────────────────────────
Particles();
let destroyScroll = appearOnScroll(sliders, lastChild, cursorAnim);
initHoverEffects();

window.scrollTo(0, 0);
