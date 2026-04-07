import { gsap } from 'gsap';
import barba from '@barba/core';
import Particles from "./particales";
import appearOnScroll from './appearOnScroll';
import initCharacter from './character';


let logo = document.querySelector("#logo")
const cont = document.querySelector('.cont')
const lastChild = document.querySelector('.slide:last-child');
const sliders = document.querySelectorAll('.slide');
const nav = document.querySelectorAll('.nav-header');
const burger = document.querySelector('.burger');
const navBar = document.querySelector('.nav-bar');
const canvas = document.querySelector('#wallkingCycle')
const charCanvas = document.querySelector('.nav-char-canvas');

// Lazy-init: spin up Three.js character on first nav open
let destroyCharacter = null;
let mouse = document.querySelector('.cursor');

const navTl = gsap.timeline({ defaults: { duration: .5, ease: 'power2.inOut' }});
navTl.fromTo(nav, { y: '-100%', opacity: 0 }, { y: '0%', opacity: 1 });
navTl.fromTo(nav, { width: "90vw", x: "5vw", marginLeft: '1%' }, { x: "0%", width: "100vw", marginLeft: 0, duration: 1 }, '-=.2');

function cursorAnim(e){
    mouse.style.top = e.pageY + 'px';
    mouse.style.left = e.pageX + 'px';
};


function cursorHoverAnim (e){
    const item = e.target
    if (item.id === 'logo' || item.classList.contains('burger')){
        mouse.classList.add("nav-active");
    }else{
        mouse.classList.remove("nav-active");
    };
    if( item.classList.contains('explore')){
        mouse.classList.add("explore-active");
    }else{
        mouse.classList.remove("explore-active");
    }
};

// Circle-mask origin: top-right corner where the burger lives
const MASK_ORIGIN = 'calc(100% - 5%) 5vh';
const MASK_OPEN   = `circle(150vmax at ${MASK_ORIGIN})`;
const MASK_CLOSED = `circle(0px at ${MASK_ORIGIN})`;

function navToggle(e){
    const btn = e.currentTarget;
    const isOpen = btn.classList.contains('active');

    if (!isOpen) {
        btn.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        btn.setAttribute('aria-label', 'Close menu');
        navBar.setAttribute('aria-hidden', 'false');
        navBar.classList.add('is-open');

        // Lazy-init Three.js character on first open
        if (!destroyCharacter && charCanvas) {
            destroyCharacter = initCharacter(charCanvas);
        }

        // Burger → X (white lines stay white; overlay is dark)
        gsap.to(".line1", { duration: .25, rotate: 45,  y:  5 });
        gsap.to(".line2", { duration: .25, rotate: -45, y: -5 });

        // Expand circle mask from burger corner
        gsap.to('.nav-bar', {
            duration: 0.9,
            clipPath: MASK_OPEN,
            ease: 'power3.inOut',
        });

        // Stagger nav links in
        gsap.fromTo('.nav-links h3 a',
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.35 }
        );
        gsap.fromTo('.nav-about',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.6 }
        );
    } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Open menu');

        // Fade content out first, then collapse mask
        gsap.to(['.nav-links h3 a', '.nav-about'], {
            opacity: 0, y: -20, duration: 0.3, ease: 'power2.in',
        });

        gsap.to('.nav-bar', {
            duration: 0.7,
            clipPath: MASK_CLOSED,
            ease: 'power3.inOut',
            delay: 0.2,
            onComplete: () => {
                navBar.setAttribute('aria-hidden', 'true');
                navBar.classList.remove('is-open');
            }
        });

        // Restore burger lines
        gsap.to(".line1", { duration: .25, rotate: 0, y: 0, delay: 0.2 });
        gsap.to(".line2", { duration: .25, rotate: 0, y: 0, delay: 0.2 });
    }
}

function navKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navToggle(e);
    }
}


barba.init({
    transitions: [
        {
            name: "home-pj-transition",
            from: {
                namespace: ["home"]
            },
            to: {
                namespace: ["PJ"]
            },
            leave({ current, done }) {
                const rippleImage = current.container.querySelector('.project-img');
                const body = current.container.querySelector('#body');
                const canvas = current.container.querySelector('canvas');
                if (!rippleImage) {
                    console.warn('No .ripple-image found in the current page');
                    done();
                    return;
                }

                // Animate ripple image scaling up to 1.2
                const tl = gsap.timeline({
                    defaults: { ease: 'power2.out' },
                    onComplete: done // Trigger done after animation
                });

                tl.to(rippleImage, {
                    scale: 1.2, // Scale up to 1.2
                    duration: 0.6, // Smooth scaling
                })
                  .to(current.container, {
                      opacity: 0,
                      duration: 0.4
                  }, '-=0.4'); // Fade out while scaling
            },
            enter({ next, done }) {
                const projImg = next.container.querySelector('.proj-img');
                if (!projImg) {
                    console.warn('No .proj-img found in the new page');
                    done();
                    return;
                }

                // Start proj-img at scale 1.2
                gsap.set(projImg, { scale: 1.2 });

                // Animate proj-img scaling back to 1
                const tl = gsap.timeline({
                    defaults: { ease: 'power2.inOut' },
                    onComplete: done // Trigger done after animation
                });

                tl.to(projImg, {
                    scale: 1, // Reset to original size
                    duration: 0.6 // Smooth scale-down
                })
                  .to(next.container, {
                      opacity: 1,
                      duration: 0.4
                  }, '-=0.4'); // Fade in content while scaling
            }
        }
    ],
    debug: false
});



document.querySelectorAll('.project-img').forEach((container) => {
    const img = container.querySelector('.ripple-image');

    container.addEventListener('mousemove', (e) => {
        // Get the container's bounding box
        const rect = container.getBoundingClientRect();

        // Calculate mouse position relative to the container
        const x = e.clientX - rect.left; // Mouse X inside the container
        const y = e.clientY - rect.top;  // Mouse Y inside the container

        // Normalize the values to range [-1, 1]
        const offsetX = (x / rect.width) * 2 - 1; // Horizontal offset
        const offsetY = (y / rect.height) * 2 - 1; // Vertical offset

        // Calculate rotation values
        const rotateX = offsetY * 1; // Tilt effect on the X-axis
        const rotateY = -offsetX * 1; // Tilt effect on the Y-axis

        // Apply GSAP animation for smooth rotation
        gsap.to(img, {
            duration: 0.8,
            rotateX: rotateX,
            rotateY: rotateY,
            scale: 1.05,
            ease: "power2.out",
            transformPerspective: 1000, // Ensure proper 3D perspective
        });
    });

    container.addEventListener('mouseleave', () => {
        // Reset the transform with GSAP when the mouse leaves
        gsap.to(img, {
            duration: 0.8,
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            ease: "power2.out",
        });
    });
});


// Select all `.explore` links
document.querySelectorAll('.explore').forEach((exploreLink) => {
    // Find the `.project-1-section` ancestor and its corresponding `.ripple-image`
    const section = exploreLink.closest('.slide');
    if (!section) {
        console.warn('No .slide found for:', exploreLink);
        return;
    }

    const rippleImage = section.querySelector('.ripple-image');
    if (!rippleImage) {
        console.warn('No .ripple-image found in:', section);
        return;
    }

    // Add hover effect listeners to the `.explore` link
    exploreLink.addEventListener('mouseenter', () => {
        gsap.to(rippleImage, {
            duration: 0.6,
            scale: 1.1,
            ease: "power2.out",
        });
    });

    exploreLink.addEventListener('mouseleave', () => {
        gsap.to(rippleImage, {
            duration: 0.6,
            scale: 1,
            ease: "power2.out",
        });
    });
});

////////////////////////
Particles();
let destroyScroll = appearOnScroll(sliders, lastChild, cursorAnim);

barba.hooks.beforeLeave(() => {
    destroyScroll();
});

barba.hooks.afterEnter(({ next }) => {
    const newSliders = next.container.querySelectorAll('.slide');
    const newLastChild = next.container.querySelector('.slide:last-child');
    destroyScroll = appearOnScroll(newSliders, newLastChild, cursorAnim);
});

window.scrollTo(0, 0);
burger.addEventListener('click', navToggle);
burger.addEventListener('keydown', navKeydown);
window.addEventListener("mousemove", cursorAnim);
window.addEventListener("mouseover", cursorHoverAnim);

