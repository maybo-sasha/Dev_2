// Minimal site loader: a counting percentage + a thin progress bar pinned to
// the bottom of the screen. Shows once per session on the first (home) load,
// then slides up to reveal the site. Loaded in <head> so it covers immediately.
(function () {
    try { if (sessionStorage.getItem('siteLoaded')) return; } catch (e) {}

    var root = document.documentElement;
    root.classList.add('loading');

    var el = document.createElement('div');
    el.className = 'site-loader';
    el.innerHTML =
        '<div class="sl-num"><span>0</span></div>' +
        '<div class="sl-bar"><i></i></div>';
    root.appendChild(el);   // <html> exists in <head>; fixed positioning covers the viewport

    var num = el.querySelector('.sl-num span');
    var bar = el.querySelector('.sl-bar > i');

    var pct = 0, target = 0, done = false;
    window.addEventListener('load', function () { done = true; });
    setTimeout(function () { done = true; }, 9000);   // safety cap

    function tick() {
        target = done ? 100 : Math.min(92, target + Math.random() * 5);
        pct += (target - pct) * 0.12;
        var shown = Math.min(100, Math.round(pct));
        num.textContent = shown;
        bar.style.transform = 'scaleX(' + (pct / 100) + ')';
        if (done && shown >= 100) {
            num.textContent = 100;
            bar.style.transform = 'scaleX(1)';
            finish();
            return;
        }
        requestAnimationFrame(tick);
    }

    function finish() {
        try { sessionStorage.setItem('siteLoaded', '1'); } catch (e) {}
        // brief beat at 100%, then reveal
        setTimeout(function () {
            root.classList.remove('loading');
            el.classList.add('is-done');
            setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 750);
        }, 250);
    }

    requestAnimationFrame(tick);
})();
