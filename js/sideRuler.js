// sideRuler.js — a measuring rule down the edge of a long page.
//
// One tick per thing worth jumping to, and the tick you are level with reads
// as the active one, so the rail says where you are as well as where you can
// go. Ticks come in two weights: a major carries a label, a minor is just a
// mark, which is what lets a rule show grouping without a second element.
//
// The page supplies the entries rather than this file guessing at markup:
//
//   window.SIDE_RULER = function () {
//       return [{ el: <Element>, label: 'Name', major: true }, ...];
//   };
//
// Everything after that (building the rail, jumping, tracking scroll) is the
// same on every page, which is the whole reason it lives here.
//
// Uses window.lenis for the jump when a page has it, since a raw hash change
// would fight a smooth-scroll library rather than travel through it.
(function () {
    const collect = window.SIDE_RULER;
    if (typeof collect !== 'function') return;

    let entries = [];
    try { entries = collect() || []; } catch (e) { return; }
    entries = entries.filter(function (m) { return m && m.el; });
    if (entries.length < 2) return;   // a rule with one mark measures nothing

    const nav = document.createElement('nav');
    nav.className = 'sr';
    nav.setAttribute('aria-label', window.SIDE_RULER_LABEL || 'Sections');

    const marks = entries.map(function (m, i) {
        const id = m.el.id || ('sr-' + i);
        m.el.id = id;

        const a = document.createElement('a');
        a.className = 'sr-mark' + (m.major ? ' sr-major' : '');
        a.href = '#' + id;

        const tick = document.createElement('i');
        a.appendChild(tick);

        if (m.label) {
            const span = document.createElement('span');
            span.textContent = m.label;      // textContent, never innerHTML
            a.appendChild(span);
            if (!m.major) a.classList.add('sr-quiet');   // label waits for hover
        } else {
            a.setAttribute('aria-label', 'Item ' + (i + 1));
        }

        nav.appendChild(a);
        return { el: a, target: m.el };
    });

    document.body.appendChild(nav);

    nav.addEventListener('click', function (e) {
        const a = e.target.closest('a');
        if (!a) return;
        const el = document.getElementById(a.getAttribute('href').slice(1));
        if (!el) return;
        e.preventDefault();
        // the two pages name their Lenis instance differently
        const l = window.lenis || window.lenisInstance;
        if (l && l.scrollTo) l.scrollTo(el, { offset: 0 });
        else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // A thin band across the middle of the viewport: whatever is crossing it
    // is what you are looking at. Tracking a set rather than the last event
    // keeps this right when several targets cross in one callback.
    const inBand = new Set();
    const io = new IntersectionObserver(function (rows) {
        rows.forEach(function (r) {
            if (r.isIntersecting) inBand.add(r.target); else inBand.delete(r.target);
        });
        let cur = null;
        for (let i = 0; i < marks.length; i++) {
            if (inBand.has(marks[i].target)) { cur = marks[i]; break; }
        }
        marks.forEach(function (m) { m.el.classList.toggle('is-on', m === cur); });
    }, { rootMargin: '-45% 0px -45% 0px' });

    marks.forEach(function (m) { io.observe(m.target); });
})();
