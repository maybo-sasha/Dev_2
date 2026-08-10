/* ============================================================
   Radial Toolkit — press anywhere on the canvas and the tool
   ring springs open under your cursor. Drag toward a tool to
   arm it (a wedge tracks your direction), release to pick.
   Or press once, then click the tool you want.

   Motion runs on GSAP — required, already loaded on the page.

   Usage:
     <link rel="stylesheet" href="./assets/personal/radial-toolkit/radial-toolkit.css">
     <div data-radial-toolkit data-accent="#1a7af0"></div>
     <script type="module" src="./assets/personal/radial-toolkit/radial-toolkit.js"></script>

   Pointer:  press + drag out, release to pick · or press, then click
   Keyboard: Alt+W opens, ←/→ rotate, Enter picks, Esc closes
   ============================================================ */

const I = {
  move: '<path d="M5.2 2.6l10.6 9.1-4.6.55 2.6 5.65-2.4 1.1-2.6-5.6-3.6 3.1z" fill="currentColor" stroke="none"/>',
  pen: '<path d="M3.6 20.4l1.6-4.6 9.9-9.9a2.2 2.2 0 0 1 3.1 3.1l-9.9 9.9z"/><path d="M13.4 6.6l4 4"/>',
  text: '<path d="M5 6.2V4.6h14v1.6M12 4.6v14.8M9.2 19.4h5.6"/>',
  actions:
    '<rect x="3.4" y="3.4" width="7.2" height="7.2" rx="1.8"/><rect x="3.4" y="13.4" width="7.2" height="7.2" rx="1.8"/><rect x="13.4" y="13.4" width="7.2" height="7.2" rx="1.8"/><path d="M17 3l.95 2.05L20 6l-2.05.95L17 9l-.95-2.05L14 6l2.05-.95z"/>',
  more:
    '<circle cx="5.2" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="18.8" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
  comment:
    '<path d="M20.5 12.1c0 4.1-3.8 7.5-8.5 7.5-.9 0-1.8-.13-2.6-.36L4 21l1.35-3.9a7.1 7.1 0 0 1-1.85-5c0-4.1 3.8-7.5 8.5-7.5s8.5 3.4 8.5 7.5z"/>',
  objects: '<rect x="3.2" y="3.2" width="9.4" height="9.4" rx="2.4"/><circle cx="15.3" cy="15.3" r="5.4"/>',
  frame: '<path d="M8.5 3v18M15.5 3v18M3 8.5h18M3 15.5h18"/>',
  target: '<circle cx="12" cy="12" r="7.6"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',
};

/* clockwise from the top — index order *is* the ring order */
const TOOLS = [
  { label: 'Move Tool', key: 'V', icon: 'move' },
  { label: 'Pen Tool', key: 'P', icon: 'pen' },
  { label: 'Text', key: 'T', icon: 'text' },
  { label: 'Actions', key: '', icon: 'actions' },
  { label: 'More', key: '•••', icon: 'more' },
  { label: 'Comment', key: 'C', icon: 'comment' },
  { label: 'Objects', key: 'O', icon: 'objects' },
  { label: 'Frame', key: 'F', icon: 'frame' },
];

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const clamp = (v, min, max) => (min > max ? (min + max) / 2 : Math.min(max, Math.max(min, v)));

export function createRadialToolkit({ accent = '#1a7af0', tools = TOOLS } = {}) {
  const gsap = window.gsap;
  if (!gsap) {
    console.warn('[radial-toolkit] GSAP is required and was not found on the page.');
    return null;
  }

  const n = tools.length;
  const step = 360 / n;
  const slow = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur = (d) => (slow ? 0.001 : d);

  /* which way a label hangs off its tool */
  const sideOf = (i) => {
    const a = i * step;
    if (a === 0) return 'top';
    if (a === 180) return 'bottom';
    return a < 180 ? 'right' : 'left';
  };

  const slots = tools
    .map((t, i) => {
      const side = sideOf(i);
      const keyHtml = t.key
        ? `<span class="rt__key${t.key === '•••' ? ' rt__key--dots' : ''}">${esc(t.key)}</span>`
        : '';
      const name = `<span class="rt__name">${esc(t.label)}</span>`;
      return `
      <div class="rt__slot" data-i="${i}" data-side="${side}">
        <button class="rt__btn" type="button" role="menuitem" tabindex="-1" aria-label="${esc(t.label)}">
          <svg viewBox="0 0 24 24" aria-hidden="true">${I[t.icon]}</svg>
        </button>
        <span class="rt__label">${side === 'left' ? keyHtml + name : name + keyHtml}</span>
      </div>`;
    })
    .join('');

  const root = el(`
  <div class="rt" tabindex="0" role="application" aria-label="Radial toolkit" data-cursor="dark" style="--rt-accent:${esc(accent)}">
    <div class="rt__grid"></div>
    <div class="rt__cue">
      <span class="rt__cue-ripple"><i></i><i></i><i></i><span class="rt__cue-dot"></span></span>
      <p class="rt__cue-title">Click anywhere on the canvas</p>
      <p class="rt__cue-sub">to summon the toolkit — or press <b>Alt + W</b></p>
    </div>
    <div class="rt__stage" role="menu" aria-hidden="true">
      <i class="rt__glow"></i>
      <i class="rt__ring"></i>
      <i class="rt__wedge"></i>
      <i class="rt__hub"></i>
      <i class="rt__ping"></i>
      ${slots}
    </div>
    <div class="rt__chip">
      <svg viewBox="0 0 24 24" aria-hidden="true">${I.target}</svg>
      <span class="rt__chip-name">Radial Toolkit</span>
      <span class="rt__chip-key">Alt + W</span>
    </div>
  </div>`);

  const stage = root.querySelector('.rt__stage');
  const ring = root.querySelector('.rt__ring');
  const wedge = root.querySelector('.rt__wedge');
  const hub = root.querySelector('.rt__hub');
  const glow = root.querySelector('.rt__glow');
  const ping = root.querySelector('.rt__ping');
  const cueRings = [...root.querySelectorAll('.rt__cue-ripple i')];
  const cueDot = root.querySelector('.rt__cue-dot');
  const chip = root.querySelector('.rt__chip');
  const chipName = root.querySelector('.rt__chip-name');
  const chipKey = root.querySelector('.rt__chip-key');
  const slotEls = [...root.querySelectorAll('.rt__slot')];
  const btnEls = slotEls.map((s) => s.querySelector('.rt__btn'));
  const labelEls = slotEls.map((s) => s.querySelector('.rt__label'));

  let R = 112;
  let pos = [];
  let isOpen = false;
  let armed = -1;
  let active = 0;
  let dragging = false;
  let moved = false;
  let wedgeDeg = 0;
  let chipTimer = null;
  let centre = { x: 0, y: 0 };
  let openTl = null;

  /* everything in the stage is centred on the stage origin */
  gsap.set([glow, ring, wedge, hub, ping, ...slotEls], { xPercent: -50, yPercent: -50 });
  labelEls.forEach((l, i) => {
    const side = sideOf(i);
    gsap.set(l, side === 'left' || side === 'right' ? { yPercent: -50 } : { xPercent: -50 });
  });
  gsap.set(stage, { x: -9999, y: -9999 });

  /* ── the "click here" pulse ─────────────────────────────── */
  gsap.set([...cueRings, cueDot], { xPercent: 0, yPercent: 0 });
  const cuePulse = slow
    ? []
    : [
        ...cueRings.map((r, k) =>
          gsap.fromTo(
            r,
            { scale: 0.34, opacity: 0.5 },
            { scale: 1.55, opacity: 0, duration: 1.8, ease: 'power2.out', repeat: -1, delay: k * 0.6 }
          )
        ),
        gsap.to(cueDot, { scale: 0.78, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
      ];
  const setPulse = (on) => cuePulse.forEach((t) => (on ? t.resume() : t.pause()));

  /* ── layout ─────────────────────────────────────────────── */
  function measure() {
    const r = root.getBoundingClientRect();
    R = Math.round(clamp(Math.min(r.width, r.height) * 0.27, 86, 128));
    root.style.setProperty('--rt-r', R + 'px');
    root.classList.toggle('is-compact', r.width < 620);
    pos = tools.map((_, i) => {
      const a = ((i * step - 90) * Math.PI) / 180;
      return { x: Math.cos(a) * R, y: Math.sin(a) * R };
    });
    if (isOpen) slotEls.forEach((s, i) => gsap.set(s, { x: pos[i].x, y: pos[i].y }));
    return r;
  }

  /* ── arming ─────────────────────────────────────────────── */
  function arm(i) {
    if (armed === i) return;
    armed = i;
    slotEls.forEach((s, k) => s.classList.toggle('is-armed', k === i));

    /* the armed tool springs up and nudges outward along its own radius.
       That lives on the button, never the slot — slot x/y belongs to the
       open/close timelines, so the two can't fight over the transform. */
    slotEls.forEach((s, k) => {
      const on = k === i;
      const lift = on ? 7 : 0;
      gsap.to(btnEls[k], {
        x: (pos[k].x / R) * lift,
        y: (pos[k].y / R) * lift,
        scale: on ? 1.16 : 1,
        duration: dur(on ? 0.62 : 0.35),
        ease: on ? 'elastic.out(1, 0.62)' : 'power3.out',
        overwrite: 'auto',
      });
      gsap.to(labelEls[k], {
        scale: on ? 1.04 : 1,
        duration: dur(0.4),
        ease: on ? 'back.out(2.4)' : 'power2.out',
        overwrite: 'auto',
      });
    });

    if (i < 0) {
      gsap.to(wedge, { opacity: 0, duration: dur(0.25), ease: 'power2.out', overwrite: 'auto' });
      return;
    }

    /* rotate the wedge the short way round */
    const target = i * step;
    let delta = ((target - wedgeDeg + 540) % 360) - 180;
    wedgeDeg += delta;
    gsap.to(wedge, {
      rotation: wedgeDeg,
      opacity: 1,
      duration: dur(0.5),
      ease: 'power3.out',
      overwrite: 'auto',
    });
  }

  /* ── open / close ───────────────────────────────────────── */
  function openAt(px, py) {
    const rect = measure();
    /* keep the labels inside the canvas: half a button + gap + label box.
       The bottom also has to clear the shortcut chip. */
    const padX = R + (root.classList.contains('is-compact') ? 40 : 140);
    const padTop = R + 70;
    const padBottom = R + 116;
    centre = {
      x: clamp(px, padX, rect.width - padX),
      y: clamp(py, padTop, rect.height - padBottom),
    };

    isOpen = true;
    armed = -1;
    setPulse(false);
    root.classList.add('is-open', 'has-used');
    stage.setAttribute('aria-hidden', 'false');
    slotEls.forEach((s) => s.classList.remove('is-armed'));

    openTl && openTl.kill();
    gsap.set(stage, { x: centre.x, y: centre.y });
    /* the wedge fades in already aimed at the active tool */
    wedgeDeg = active * step;
    gsap.set(wedge, { opacity: 0, rotation: wedgeDeg });
    gsap.set(btnEls, { x: 0, y: 0, scale: 1 });
    gsap.set(labelEls, { scale: 1 });

    openTl = gsap
      .timeline({ defaults: { overwrite: 'auto' } })
      .fromTo(ring, { scale: 0.55, opacity: 0 }, { scale: 1, opacity: 1, duration: dur(0.62), ease: 'back.out(1.7)' }, 0)
      .fromTo(glow, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: dur(0.7), ease: 'power3.out' }, 0)
      .fromTo(hub, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: dur(0.6), ease: 'back.out(2.6)' }, 0.04)
      .fromTo(
        slotEls,
        { x: 0, y: 0, scale: 0.3, opacity: 0 },
        {
          x: (i) => pos[i].x,
          y: (i) => pos[i].y,
          scale: 1,
          opacity: 1,
          duration: dur(0.78),
          ease: 'back.out(1.95)',
          stagger: { each: dur(0.035), from: 'start' },
        },
        0.05
      )
      .fromTo(
        labelEls,
        { opacity: 0, x: (i) => (sideOf(i) === 'left' ? 14 : sideOf(i) === 'right' ? -14 : 0), y: (i) => (sideOf(i) === 'top' ? 10 : sideOf(i) === 'bottom' ? -10 : 0) },
        { opacity: 1, x: 0, y: 0, duration: dur(0.45), ease: 'power3.out', stagger: dur(0.028) },
        0.2
      );

    /* re-arm whatever tool is currently active so the ring opens "aimed" */
    if (!slow) openTl.add(() => arm(active), 0.34);
    else arm(active);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    armed = -1;
    if (onScreen) setPulse(true);
    root.classList.remove('is-open');
    stage.setAttribute('aria-hidden', 'true');
    slotEls.forEach((s) => s.classList.remove('is-armed'));

    openTl && openTl.kill();
    gsap.to(wedge, { opacity: 0, duration: dur(0.2), ease: 'power2.in', overwrite: 'auto' });
    gsap.to(labelEls, { opacity: 0, duration: dur(0.16), ease: 'power2.in', overwrite: 'auto' });
    gsap.to(slotEls, {
      x: 0,
      y: 0,
      scale: 0.35,
      opacity: 0,
      duration: dur(0.3),
      ease: 'power2.in',
      stagger: { each: dur(0.018), from: 'end' },
      overwrite: 'auto',
    });
    gsap.to([ring, hub, glow], {
      scale: 0.62,
      opacity: 0,
      duration: dur(0.3),
      ease: 'power2.in',
      overwrite: 'auto',
      onComplete: () => {
        if (!isOpen) gsap.set(stage, { x: -9999, y: -9999 });
      },
    });
  }

  /* ── picking ────────────────────────────────────────────── */
  function pick(i) {
    const tool = tools[i];
    if (!tool) return;
    active = i;

    /* punch the tool, then ripple out of it. overwrite:'auto' hands the
       scale over from the arm tween while its x/y lift keeps running. */
    gsap
      .timeline({ defaults: { overwrite: 'auto' } })
      .to(btnEls[i], { scale: 0.86, duration: dur(0.1), ease: 'power2.in' })
      .to(btnEls[i], { scale: 1.28, duration: dur(0.42), ease: 'elastic.out(1, 0.5)' });

    gsap.set(ping, { x: pos[i].x, y: pos[i].y, scale: 1, opacity: 0.65 });
    gsap.to(ping, { scale: 2.4, opacity: 0, duration: dur(0.6), ease: 'power2.out' });

    /* chip reports the pick, then goes back to the shortcut hint */
    chip.classList.add('is-live');
    chipName.textContent = tool.label;
    chipKey.textContent = tool.key && tool.key !== '•••' ? tool.key : 'Active';
    gsap.fromTo(chip, { scale: 0.92 }, { scale: 1, duration: dur(0.5), ease: 'back.out(2.6)' });

    clearTimeout(chipTimer);
    chipTimer = setTimeout(() => {
      chip.classList.remove('is-live');
      chipName.textContent = 'Radial Toolkit';
      chipKey.textContent = 'Alt + W';
    }, 1900);

    setTimeout(close, slow ? 0 : 150);
  }

  /* ── pointer ────────────────────────────────────────────── */
  const local = (e) => {
    const r = root.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const p = local(e);

    if (isOpen) {
      /* a press outside the ring dismisses it */
      if (!e.target.closest('.rt__slot')) close();
      return;
    }
    e.preventDefault();
    root.focus({ preventScroll: true });
    dragging = true;
    moved = false;
    try { root.setPointerCapture(e.pointerId); } catch (_) {}
    openAt(p.x, p.y);
  });

  root.addEventListener('pointermove', (e) => {
    if (!isOpen) return;
    const p = local(e);
    const dx = p.x - centre.x;
    const dy = p.y - centre.y;
    const dist = Math.hypot(dx, dy);
    if (dragging && dist > 10) moved = true;
    if (!dragging && !moved) return; // sticky mode leaves arming to hover

    /* back inside the hub means "no choice yet", so you can bail out */
    if (dist < R * 0.4) return arm(-1);
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    arm(Math.round((((deg % 360) + 360) % 360) / step) % n);
  });

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    try { root.releasePointerCapture(e.pointerId); } catch (_) {}
    if (moved && armed > -1) pick(armed);
    else if (moved) close(); // flicked back to the hub — cancel
  };
  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);

  slotEls.forEach((s, i) => {
    s.addEventListener('pointerenter', () => { if (isOpen && !dragging) arm(i); });
    s.addEventListener('click', (e) => { e.stopPropagation(); pick(i); });
  });

  /* ── keyboard ───────────────────────────────────────────── */
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { close(); return; }
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const r = root.getBoundingClientRect();
        openAt(r.width / 2, r.height / 2);
      }
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); arm(((armed < 0 ? -1 : armed) + 1) % n); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); arm(((armed < 0 ? 1 : armed) - 1 + n) % n); }
    else if (e.key === 'Enter' && armed > -1) { e.preventDefault(); pick(armed); }
  });

  /* Alt+W works page-wide, but only while the canvas is on screen */
  let onScreen = false;
  new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      setPulse(onScreen && !isOpen); // don't burn frames on an off-screen prompt
      if (!onScreen) close();
    },
    { threshold: 0.35 }
  ).observe(root);

  document.addEventListener('keydown', (e) => {
    /* e.key under Alt varies by layout, so trust e.code first */
    const isW = e.code === 'KeyW' || (e.key && e.key.toLowerCase() === 'w');
    if (!onScreen || !e.altKey || !isW) return;
    e.preventDefault();
    if (isOpen) return close();
    const r = root.getBoundingClientRect();
    root.focus({ preventScroll: true });
    openAt(r.width / 2, r.height / 2);
  });

  new ResizeObserver(() => measure()).observe(root);
  requestAnimationFrame(measure);

  return { el: root, open: openAt, close, get active() { return tools[active]; } };
}

document.querySelectorAll('[data-radial-toolkit]').forEach((host) => {
  if (host.firstElementChild) return;
  const kit = createRadialToolkit({ accent: host.dataset.accent || '#1a7af0' });
  if (kit) host.appendChild(kit.el);
});
