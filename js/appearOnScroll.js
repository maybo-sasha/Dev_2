import { gsap } from 'gsap';
import Lenis from '@studio-freight/lenis';

export default function appearOnScroll(params, lastchild, onScrollCallback) {
    const options = {
        threshold: 0.5,
    };
    const lenis = new Lenis();
    let rafId;

    function raf(time) {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // IntersectionObserver to track elements in view
    const observer = new IntersectionObserver(entries => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');

                const img = entry.target.querySelector('img');
                const projImgSection = entry.target.querySelector('.project-img');
                const titleEl = entry.target.querySelector('.title');
                const titleAnim = titleEl ? titleEl.children : null;
                const borderLine = entry.target.querySelector('.borderLine');
                const explorBtn = entry.target.querySelector('.explore');

                const slideTl = gsap.timeline({ defaults: { duration: 0.5, ease: 'power2.inOut' } });

                // scaleY instead of height — compositor-only, no layout recalc
                slideTl.fromTo(projImgSection,
                    { transformOrigin: 'bottom center', scaleY: 0.77 },
                    { scaleY: 1 }
                );
                slideTl.fromTo(img, { y: "100%" }, { y: "0%", duration: 0.8 }, '-=0.5');
                if (titleAnim) {
                    slideTl.fromTo(titleAnim, { opacity: 0, y: "100%" }, { opacity: 1, y: "0%", duration: 0.8, stagger: 0.25 }, '-=0.5');
                }
                // scaleX instead of width — compositor-only, no layout recalc
                slideTl.fromTo(borderLine,
                    { opacity: 0, scaleX: 0, transformOrigin: 'left center' },
                    { opacity: 1, scaleX: 1, duration: 0.7 },
                    '-=0.5'
                );
                slideTl.fromTo(explorBtn, { opacity: 0, y: "100%" }, { opacity: 1, y: "70%", duration: 0.8, stagger: 0.25 });

                if (onScrollCallback) {
                    onScrollCallback(entry.target);
                }

                lenis.scrollTo(entry.target, {
                    offset: -window.innerHeight / 2 + entry.target.offsetHeight / 2,
                    duration: 1.5,
                    immediate: false,
                    lock: false,
                });
            } else {
                entry.target.classList.remove('show');
            }
        });
    }, options);

    params.forEach(param => {
        observer.observe(param);
    });

    return function destroy() {
        cancelAnimationFrame(rafId);
        observer.disconnect();
        lenis.destroy();
    };
}
