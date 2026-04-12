import { gsap } from 'gsap';

const burger  = document.querySelector('.burger');
const navBar  = document.querySelector('.nav-bar');
const mouse   = document.querySelector('.cursor');
const nav     = document.querySelectorAll('.nav-header');

// Nav entrance
const navTl = gsap.timeline({ defaults: { duration: 0.5, ease: 'power2.inOut' } });
navTl.fromTo(nav, { y: '-100%', opacity: 0 }, { y: '0%', opacity: 1 });

// Cursor
window.addEventListener('mousemove', e => {
    mouse.style.top  = e.pageY + 'px';
    mouse.style.left = e.pageX + 'px';
});

// Circle-mask nav
const MASK_ORIGIN = 'calc(100% - 5%) 5vh';
const MASK_OPEN   = `circle(150vmax at ${MASK_ORIGIN})`;
const MASK_CLOSED = `circle(0px at ${MASK_ORIGIN})`;

function navToggle(e) {
    const btn    = e.currentTarget;
    const isOpen = btn.classList.contains('active');

    if (!isOpen) {
        btn.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        btn.setAttribute('aria-label', 'Close menu');
        navBar.setAttribute('aria-hidden', 'false');
        navBar.classList.add('is-open');

        gsap.to('.line1', { duration: 0.25, rotate: 45,  y:  5 });
        gsap.to('.line2', { duration: 0.25, rotate: -45, y: -5 });
        gsap.to('.nav-bar', { duration: 0.9, clipPath: MASK_OPEN, ease: 'power3.inOut' });
        gsap.fromTo('.nav-links h3 a',
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.35 }
        );
        gsap.fromTo('.nav-about',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.6 }
        );

        if (!destroyCharacter) loadCharacter(activeChar);
    } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Open menu');

        gsap.to(['.nav-links h3 a', '.nav-about'], { opacity: 0, y: -20, duration: 0.3, ease: 'power2.in' });
        gsap.to('.nav-bar', {
            duration: 0.7, clipPath: MASK_CLOSED, ease: 'power3.inOut', delay: 0.2,
            onComplete: () => {
                navBar.setAttribute('aria-hidden', 'true');
                navBar.classList.remove('is-open');
            }
        });
        gsap.to('.line1', { duration: 0.25, rotate: 0, y: 0, delay: 0.2 });
        gsap.to('.line2', { duration: 0.25, rotate: 0, y: 0, delay: 0.2 });
    }
}

burger.addEventListener('click', navToggle);
burger.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navToggle(e); }
});

// Character switcher (same logic as index.js)
const charBtns = document.querySelectorAll('.char-btn');
let destroyCharacter = null;
let activeChar = 'v18';

const charModules = {
    v18:    () => import('./character').then(m => m.default),
    rocket: () => import('./characterRocket').then(m => m.default),
};

function getCanvas() { return document.querySelector('.nav-char-canvas'); }

function loadCharacter(key) {
    if (destroyCharacter) { destroyCharacter(); destroyCharacter = null; }
    const oldCanvas = getCanvas();
    if (!oldCanvas) return;
    const newCanvas = document.createElement('canvas');
    newCanvas.className = 'nav-char-canvas';
    oldCanvas.replaceWith(newCanvas);
    charModules[key]()
        .then(init => { destroyCharacter = init(newCanvas); activeChar = key; })
        .catch(err => console.error('Character load error:', err));
}

charBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const key = btn.dataset.char;
        if (key === activeChar) return;
        charBtns.forEach(b => b.classList.toggle('active', b === btn));
        loadCharacter(key);
    });
});
