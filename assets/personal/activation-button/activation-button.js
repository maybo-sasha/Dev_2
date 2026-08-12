/* ============================================================
   Activation Button — one pill, four states. Hover flips the
   arrow into a tick, the press collapses the badge into a
   spinner, completion pops the disc back and morphs the pill
   to green, and the reset rolls the whole face over like a
   split-flap.

   Motion runs on GSAP — required, already loaded on the page.

   Usage:
     <link rel="stylesheet" href="./assets/personal/activation-button/activation-button.css">
     <div data-activation-button data-accent="#2f9ce9"></div>
     <script type="module" src="./assets/personal/activation-button/activation-button.js"></script>

   Pointer:  click to activate · click an activated row to roll it back
   Keyboard: the pills are real buttons — Tab to reach, Enter/Space to fire
   ============================================================ */

const I = {
  arrow: '<path d="M12 17.6V6.9M12 6.5l4.5 4.6M12 6.5L7.5 11.1"/>',
  tick: '<path d="M6.9 12.3l3.5 3.5 6.7-7.6"/>',
};

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const glyph = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[name]}</svg>`;

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const RING_R = 9.2;
const RING_C = 2 * Math.PI * RING_R;

/* ============================================================
   The button
   ============================================================ */
export function createActivationButton({
  idleLabel = 'Activate',
  pendingLabel = 'Waiting',
  doneLabel = 'Activated',
  size = 'md',        /* 'md' | 'lg' | 'xl' */
  duration = 1500,
  run = null,
  autoReset = 0,
  srLabel = '',
  onState = null,
} = {}) {
  const gsap = window.gsap;
  if (!gsap) {
    console.warn('[activation-button] GSAP is required and was not found on the page.');
    return null;
  }

  const sr = srLabel ? `<span class="ab-sr">${esc(srLabel)}, </span>` : '';
  const faceInner = (label) => `
    ${sr}
    <span class="ab-btn__badge">
      <span class="ab-btn__disc"></span>
      <span class="ab-btn__glyphs">
        <span class="ab-btn__reel"><i>${glyph('arrow')}</i><i>${glyph('tick')}</i></span>
      </span>
      <svg class="ab-btn__ring" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="${RING_R}"></circle></svg>
    </span>
    <span class="ab-btn__label"><span class="ab-btn__t">${esc(label)}</span></span>`;

  const btn = el(`
    <button class="ab-btn is-idle${size === 'md' ? '' : ` ab-btn--${size}`}" type="button" aria-live="polite">
      <span class="ab-btn__clip">
        <span class="ab-btn__face">${faceInner(idleLabel)}</span>
      </span>
      <span class="ab-btn__measure" aria-hidden="true"></span>
    </button>
  `);

  const clip = btn.querySelector('.ab-btn__clip');
  let face = btn.querySelector('.ab-btn__face');
  const measure = btn.querySelector('.ab-btn__measure');
  const q = (sel) => face.querySelector(sel);

  /* The three labels never change, so their widths can be cached and the
     pill tweens between them instead of snapping to the longest one. It
     can only be measured once the button is laid out, so this runs lazily
     and the label stays width:auto until then. */
  const widths = {};
  let measured = false;
  function ensureWidths() {
    if (measured || !btn.isConnected) return;
    [idleLabel, pendingLabel, doneLabel].forEach((t) => {
      measure.textContent = t;
      widths[t] = Math.ceil(measure.getBoundingClientRect().width) + 1;
    });
    measure.textContent = '';
    if (!widths[idleLabel]) return;
    measured = true;
    const cur = q('.ab-btn__t');
    if (cur && widths[cur.textContent]) {
      q('.ab-btn__label').style.setProperty('--lw', `${widths[cur.textContent]}px`);
    }
  }

  let state = 'idle';
  let spin = null;
  let holdTimer = 0;

  const setState = (next) => {
    state = next;
    btn.classList.remove('is-idle', 'is-pending', 'is-done');
    btn.classList.add(`is-${next}`);
    if (onState) onState(next);
  };

  let widthTween = null;

  /* Collapse the label to exactly one settled span.

     Two things read the label as raw DOM: a second rollLabel arriving
     before the first finished, and rollBack's deep clone. Either one
     catching a roll mid-flight strands the outgoing text — you end up
     seeing the previous label frozen behind the new one. So before
     doing anything, kill the in-flight tweens and drop every span but
     the newest. */
  function settleLabel() {
    const wrap = q('.ab-btn__label');
    const spans = [...wrap.querySelectorAll('.ab-btn__t')];
    const keep = spans.pop() || null;
    spans.forEach((s) => { gsap.killTweensOf(s); s.remove(); });
    if (keep) { gsap.killTweensOf(keep); gsap.set(keep, { yPercent: 0, opacity: 1 }); }
    if (widthTween) { widthTween.kill(); widthTween = null; }
    return keep;
  }

  /* label swap — old rolls up and out, new rolls in from below,
     and the viewport width tweens so the pill resizes with it */
  function rollLabel(text) {
    ensureWidths();
    const wrap = q('.ab-btn__label');
    const cur = settleLabel();
    if (cur && cur.textContent === text) return;   // already showing it

    const next = el(`<span class="ab-btn__t">${esc(text)}</span>`);
    wrap.appendChild(next);

    const to = widths[text] || Math.ceil(next.getBoundingClientRect().width) + 1;
    if (REDUCED) {
      if (cur) cur.remove();
      wrap.style.setProperty('--lw', `${to}px`);
      return;
    }

    const from = parseFloat(wrap.style.getPropertyValue('--lw')) || wrap.offsetWidth;
    const box = { w: from };
    gsap.set(next, { yPercent: 100, opacity: 0 });
    gsap.to(next, { yPercent: 0, opacity: 1, duration: 0.38, ease: 'power3.out' });
    /* the outgoing word fades far faster than it travels. It still rolls
       the full distance so the motion reads as one continuous reel, but it
       is unreadable within ~a tenth of a second — long before it reaches
       the clip edge, where sub-pixel rounding was letting glyph tops leak
       back into view as fragments. */
    if (cur) {
      gsap.to(cur, { yPercent: -100, duration: 0.34, ease: 'power3.in', onComplete: () => cur.remove() });
      gsap.to(cur, { opacity: 0, duration: 0.13, ease: 'power2.in' });
    }
    widthTween = gsap.to(box, {
      w: to,
      duration: 0.42,
      ease: 'power3.inOut',
      onUpdate: () => wrap.style.setProperty('--lw', `${box.w}px`),
      onComplete: () => { widthTween = null; },
    });
  }

  function startSpinner() {
    const ring = q('.ab-btn__ring');
    const circle = ring.querySelector('circle');
    gsap.set(circle, { strokeDasharray: RING_C, strokeDashoffset: RING_C * 0.82 });
    gsap.set(ring, { rotation: 0, transformOrigin: '50% 50%' });
    if (REDUCED) { gsap.set(ring, { opacity: 1, scale: 1 }); return; }
    spin = gsap.timeline();
    spin.to(ring, { rotation: 360, duration: 0.9, ease: 'none', repeat: -1 }, 0);
    spin.to(circle, {
      strokeDashoffset: RING_C * 0.3,
      duration: 0.75,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    }, 0);
  }

  /* press → badge collapses into a spinner, label rolls to "Waiting" */
  function enterPending() {
    setState('pending');
    const tl = gsap.timeline();
    tl.to(q('.ab-btn__glyphs'), { opacity: 0, scale: 0.45, duration: 0.16, ease: 'power2.in' }, 0)
      .to(q('.ab-btn__disc'), { scale: 0.3, opacity: 0, duration: 0.24, ease: 'power2.in' }, 0.08)
      .add(() => startSpinner(), 0.14)
      .fromTo(q('.ab-btn__ring'), { opacity: 0, scale: 0.72 }, { opacity: 1, scale: 1, duration: 0.28, ease: 'power2.out' }, 0.14)
      .add(() => rollLabel(pendingLabel), 0.06);
    return tl;
  }

  /* work finished → ring closes, disc pops back with the tick,
     pill morphs to green, label rolls to "Activated" */
  function enterDone() {
    const ring = q('.ab-btn__ring');
    const circle = ring.querySelector('circle');
    if (spin) { spin.kill(); spin = null; }

    const tl = gsap.timeline();
    tl.to(circle, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.out' }, 0)
      .to(ring, { rotation: '+=90', duration: 0.3, ease: 'power2.out' }, 0)
      .to(ring, { opacity: 0, scale: 0.86, duration: 0.18, ease: 'power2.in' }, 0.3)
      .add(() => setState('done'), 0.3)
      .to(q('.ab-btn__disc'), { scale: 1, opacity: 1, duration: 0.42, ease: 'back.out(2.2)' }, 0.32)
      .to(q('.ab-btn__glyphs'), { opacity: 1, scale: 1, duration: 0.34, ease: 'back.out(2.6)' }, 0.42)
      .add(() => rollLabel(doneLabel), 0.34)
      /* the pop rides on the clip, not the button — the button's own
         transform belongs to the :active press */
      .to(clip, { scale: 1.035, duration: 0.16, ease: 'power2.out' }, 0.32)
      .to(clip, { scale: 1, duration: 0.34, ease: 'elastic.out(1, 0.55)' }, 0.48);
    return tl;
  }

  /* the split-flap: the done face rolls up and out while a fresh
     idle face rolls in underneath it */
  function rollBack() {
    if (state === 'idle' || state === 'pending') return Promise.resolve();
    clearTimeout(holdTimer);

    /* settle first — the clone below is a deep copy of the live face,
       so a roll still running would be captured frozen mid-flight and
       the old text would ride out inside the ghost */
    settleLabel();

    const ghost = face.cloneNode(true);
    ghost.classList.add('ab-btn__face--ghost');
    ghost.style.width = `${face.offsetWidth}px`;
    ghost.style.background = getComputedStyle(face).backgroundColor;
    const gGlyphs = ghost.querySelector('.ab-btn__glyphs');
    if (gGlyphs) gGlyphs.style.color = getComputedStyle(q('.ab-btn__glyphs')).color;
    const gReel = ghost.querySelector('.ab-btn__reel');
    if (gReel) gReel.style.transform = getComputedStyle(q('.ab-btn__reel')).transform;

    const fresh = face.cloneNode(false);
    fresh.innerHTML = faceInner(idleLabel);
    if (widths[idleLabel]) {
      fresh.querySelector('.ab-btn__label').style.setProperty('--lw', `${widths[idleLabel]}px`);
    }

    clip.replaceChild(fresh, face);
    clip.appendChild(ghost);
    face = fresh;
    setState('idle');

    if (REDUCED) { ghost.remove(); return Promise.resolve(); }

    return new Promise((resolve) => {
      gsap.timeline({
        onComplete: () => { ghost.remove(); resolve(); },
      })
        .fromTo(face, { yPercent: 100 }, { yPercent: 0, duration: 0.52, ease: 'power3.inOut' }, 0)
        .to(ghost, { yPercent: -100, duration: 0.52, ease: 'power3.inOut' }, 0);
    });
  }

  async function activate() {
    if (state !== 'idle') return;
    enterPending();
    try {
      await (run ? run() : wait(duration));
    } catch (e) {
      /* a failed job still has to leave the button usable */
    }
    await enterDone();
    if (autoReset > 0) holdTimer = setTimeout(rollBack, autoReset);
  }

  btn.addEventListener('click', () => {
    if (state === 'idle') activate();
    else if (state === 'done') rollBack();
  });

  /* warm the cache once the button is on the page, then again after the
     webfont lands so the pill isn't sized against a fallback face */
  requestAnimationFrame(ensureWidths);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { measured = false; ensureWidths(); });
  }

  return {
    el: btn,
    activate,
    reset: rollBack,
    get state() { return state; },
  };
}

/* ============================================================
   The stage — one button, centred, nothing to compete with it
   ============================================================ */
export function createActivationPanel() {
  if (!window.gsap) return null;

  const root = el(`
    <div class="ab ui" data-cursor="dark">
      <div class="ab__stage">
        <p class="ab__hint">Click to activate</p>
      </div>
    </div>
  `);

  const btn = createActivationButton({
    size: 'xl',
    duration: 1900,
    autoReset: 2400,
    onState: (s) => { if (s === 'pending') root.classList.add('has-used'); },
  });

  const stage = root.querySelector('.ab__stage');
  stage.insertBefore(btn.el, stage.firstChild);

  return { el: root, button: btn };
}

document.querySelectorAll('[data-activation-button]').forEach((host) => {
  const panel = createActivationPanel();
  if (panel) host.appendChild(panel.el);
});
