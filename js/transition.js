// Card → full-screen zoom transition before navigating to the project page.
// Uses globals: gsap (loaded via CDN)

(function () {
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', e => {
            const dest = card.getAttribute('href');
            if (!dest || dest === '#') return;
            e.preventDefault();

            const wrap    = card.querySelector('.project-img-wrap');
            const imgEl   = wrap && wrap.querySelector('img');
            const slide   = card.closest('.slide');
            const titleEl = slide && slide.querySelector('.project-title');

            if (!wrap || !imgEl) { window.location.href = dest; return; }

            const rect = wrap.getBoundingClientRect();
            const vw = window.innerWidth, vh = window.innerHeight;

            // clip-path inset values that isolate exactly the card area
            const t = +(rect.top           / vh * 100).toFixed(2);
            const r = +((vw - rect.right)  / vw * 100).toFixed(2);
            const b = +((vh - rect.bottom) / vh * 100).toFixed(2);
            const l = +(rect.left          / vw * 100).toFixed(2);

            // Fullscreen overlay — same image, clipped to card bounds initially
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position:fixed;inset:0;z-index:500;
                background-image:url("${imgEl.src}");
                background-size:cover;background-position:center;
                clip-path:inset(${t}% ${r}% ${b}% ${l}%);
                will-change:clip-path;
            `;
            document.body.appendChild(overlay);

            // Project title — appears bottom-left as zoom finishes
            const label = document.createElement('p');
            label.textContent = titleEl ? titleEl.textContent.trim() : '';
            label.style.cssText = `
                position:fixed;bottom:10%;left:8vw;z-index:501;
                font-family:var(--font-display);
                font-size:clamp(2.5rem,6vw,7rem);
                font-weight:800;letter-spacing:-0.04em;line-height:1;
                color:white;opacity:0;pointer-events:none;
            `;
            document.body.appendChild(label);

            gsap.timeline({ onComplete: () => { window.location.href = dest; } })
                .to(overlay, {
                    clipPath: 'inset(0% 0% 0% 0%)',
                    duration: 1.1,
                    ease: 'expo.inOut',
                })
                .to(label, {
                    opacity: 1,
                    duration: 0.5,
                    ease: 'expo.out',
                }, '-=0.55');
        });
    });
}());
