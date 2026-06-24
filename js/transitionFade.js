// Page wipe transition. On any internal navigation, slide the black panel up
// to cover (html.leaving) then navigate; the next page slides it away on load
// via the CSS page-reveal animation. No opacity fade — it reads as movement.
(function () {
    let leaving = false;
    function leaveTo(href) {
        if (leaving) return;
        leaving = true;
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

    // bfcache restore (browser back/forward) — clear the cover state
    window.addEventListener('pageshow', e => {
        if (e.persisted) document.documentElement.classList.remove('leaving');
    });
})();
