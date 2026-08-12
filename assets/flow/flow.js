/* ============================================================
   Flow — renders a user flow from data.

   Layout is authored in grid coordinates, not pixels: a node says
   which column and row it sits in and the renderer turns that into
   a position. That keeps the flow specs readable and means a
   diagram can be re-pitched by changing two custom properties.

   Edges are measured, never assumed. After the nodes have laid out
   and their real boxes are known, each connector is anchored to the
   edge of the box it leaves and the box it enters, so a node that
   grows a second line of text does not end up with an arrow buried
   under it.

   Standalone: vanilla JS, no libraries, no build step.

   Usage:
     <link rel="stylesheet" href="./assets/flow/flow.css">
     <div data-flow="agent-activation"></div>
     <script type="module" src="./assets/flow/flows.data.js"></script>
   ============================================================ */

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const SVGNS = 'http://www.w3.org/2000/svg';

/* column and row pitch, in px — the gutter is baked in */
const COL = 246;
const ROW = 104;

const KEY = [
  ['k-start', 'Start or end'],
  ['k-step', 'Screen that exists'],
  ['k-dec', 'Decision'],
  ['k-gap', 'No screen, or not wired'],
  ['k-done', 'Goal reached'],
];

export function createFlow(spec) {
  const { title = '', note = '', nodes = [], edges = [], legend = true } = spec;

  const nodeHTML = (nd) => {
    const kind = nd.kind || 'step';
    const inner = `
      ${nd.tag ? `<em>${esc(nd.tag)}</em>` : ''}
      <b>${esc(nd.label)}</b>
      ${nd.sub ? `<span>${esc(nd.sub)}</span>` : ''}`;
    /* The diamond is an SVG polygon rather than a clip-path, because a
       clipped box loses the inset border that was drawing its outline
       and the shape all but vanishes. non-scaling-stroke keeps the
       hairline even after the viewBox is stretched flat. */
    const body = kind === 'decision'
      ? `<svg class="fl__dia" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
           <polygon points="50,1 99,50 50,99 1,50" vector-effect="non-scaling-stroke"/>
         </svg>
         <div class="fl__dia-t">${inner}</div>`
      : inner;
    return `
      <div class="fl__node fl__node--${kind}" data-id="${esc(nd.id)}"
           style="left:${(nd.x + 0.5) * COL}px; top:${(nd.y + 0.5) * ROW}px">
        ${body}
      </div>`;
  };

  const root = el(`
  <figure class="fl">
    ${title ? `<figcaption class="fl__head"><b>${esc(title)}</b>${note ? `<span>${esc(note)}</span>` : ''}</figcaption>` : ''}
    <div class="fl__stage">
      <svg class="fl__edges" aria-hidden="true"></svg>
      ${nodes.map(nodeHTML).join('')}
    </div>
    ${legend ? `<div class="fl__key">${KEY.map(([c, t]) => `<span><i class="${c}"></i>${esc(t)}</span>`).join('')}</div>` : ''}
    <p class="fl__scroll">Scroll sideways to follow the whole path.</p>
  </figure>`);

  const stage = root.querySelector('.fl__stage');
  const svg = root.querySelector('.fl__edges');

  const cols = Math.max(...nodes.map((n) => n.x)) + 1;
  const rows = Math.max(...nodes.map((n) => n.y)) + 1;
  stage.style.width = `${cols * COL}px`;
  stage.style.height = `${rows * ROW}px`;

  const byId = new Map(nodes.map((n) => [n.id, n]));

  /* Measured from the DOM rather than derived from the spec: a node's
     height depends on how its text wrapped, which only the browser
     knows. Anchoring to a guessed box is how arrows end up underneath
     the thing they point at. */
  function box(id) {
    const node = stage.querySelector(`.fl__node[data-id="${CSS.escape(id)}"]`);
    if (!node) return null;
    const spec = byId.get(id);
    return {
      cx: (spec.x + 0.5) * COL,
      cy: (spec.y + 0.5) * ROW,
      w: node.offsetWidth,
      h: node.offsetHeight,
    };
  }

  function draw() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', `0 0 ${cols * COL} ${rows * ROW}`);

    for (const raw of edges) {
      const e = Array.isArray(raw) ? { from: raw[0], to: raw[1], label: raw[2] } : raw;
      const a = box(e.from);
      const b = box(e.to);
      if (!a || !b) continue;

      const dx = b.cx - a.cx;
      const dy = b.cy - a.cy;
      /* Columns are the reading direction, so any edge that changes
         column runs horizontally and only a same-column edge runs
         down. Picking the axis by whichever delta is larger seems
         reasonable and is not: one node fanning out to a tall stack
         beside it then sends its longest edges out of its own top,
         and the whole fan crosses itself. */
      const horiz = Math.abs(dx) > 1;
      const sx = Math.sign(dx) || 1;
      const sy = Math.sign(dy) || 1;

      let p0, p1, c1, c2, dir;
      if (horiz) {
        p0 = [a.cx + sx * (a.w / 2) + sx * 2, a.cy];
        p1 = [b.cx - sx * (b.w / 2) - sx * 8, b.cy];
        const k = Math.abs(p1[0] - p0[0]) * 0.45;
        c1 = [p0[0] + sx * k, p0[1]];
        c2 = [p1[0] - sx * k, p1[1]];
        dir = [sx, 0];
      } else {
        p0 = [a.cx, a.cy + sy * (a.h / 2) + sy * 2];
        p1 = [b.cx, b.cy - sy * (b.h / 2) - sy * 8];
        const k = Math.abs(p1[1] - p0[1]) * 0.45;
        c1 = [p0[0], p0[1] + sy * k];
        c2 = [p1[0], p1[1] - sy * k];
        dir = [0, sy];
      }

      const path = document.createElementNS(SVGNS, 'path');
      path.setAttribute('class', `fl__edge${e.soft ? ' fl__edge--soft' : ''}`);
      path.setAttribute('d', `M${p0[0]},${p0[1]} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p1[0]},${p1[1]}`);
      svg.appendChild(path);

      /* arrowhead, pointed along the axis the edge arrived on */
      const [ux, uy] = dir;
      const [px, py] = [-uy, ux];
      const tip = [p1[0] + ux * 8, p1[1] + uy * 8];
      const pts = [
        tip,
        [p1[0] + px * 4, p1[1] + py * 4],
        [p1[0] - px * 4, p1[1] - py * 4],
      ];
      const head = document.createElementNS(SVGNS, 'polygon');
      head.setAttribute('class', 'fl__arrow');
      head.setAttribute('points', pts.map((p) => p.join(',')).join(' '));
      svg.appendChild(head);

      if (e.label) {
        /* cubic midpoint, so the label sits on the curve and not on
           the straight line between the two endpoints */
        const mid = [0, 1].map((i) => (p0[i] + 3 * c1[i] + 3 * c2[i] + p1[i]) / 8);
        const text = document.createElementNS(SVGNS, 'text');
        text.setAttribute('class', 'fl__elabel');
        text.setAttribute('x', mid[0] + (horiz ? 0 : 22));
        text.setAttribute('y', mid[1] + (horiz ? -7 : 3));
        text.textContent = e.label;
        svg.appendChild(text);
      }
    }
  }

  /* Fonts landing late change how the text wraps, which changes the
     box heights the edges were anchored to. Redraw when the stage
     actually resizes rather than betting on a timer. */
  const ro = new ResizeObserver(() => draw());
  requestAnimationFrame(() => { draw(); ro.observe(stage); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);

  return { el: root, redraw: draw };
}
