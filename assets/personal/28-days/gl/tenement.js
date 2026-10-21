/* ============================================================
   Tenements, modelled.

   A Warsaw tenement of the 1890s: a rusticated ground floor of
   shops and a carriage gate, four or five floors of windows set
   back in the wall, a sill and a hood on each, string courses, a
   heavy cornice, a low pitched roof and its chimneys.

   Every house is built from the same few measurements, so a whole
   street is one call per house. The wall is real geometry: piers
   and bands with the windows left open between them, and a pane
   set back in each opening. What the wall is made of (plaster,
   the brick under it, soot, fire behind the glass) is drawn by
   the shader, which reads each house's measurements from a small
   texture, one column per house.
   ============================================================ */

import * as THREE from 'three';
import { world, rng, GLSL_NOISE, GLSL_LIGHT } from './common.js';
import { fate } from './plan.js';

const WALL = 0, SIDE = 1, ROOF = 2, PANE = 3, TRIM = 4, SHOP = 5, SIGN = 6, DARK = 7, WOOD = 8, IRON = 9, CANVAS = 10;
const T = 0.3;                     // how far the glass sits behind the face of the wall
const MAX = 1024;                  // houses and extra facades the texture can hold

class Chunk {
  constructor() { this.pos = []; this.uv = []; this.meta = []; this.idx = []; this.n = 0; }
  quad(a, b, c, d, ua, ub, uc, ud, id, kind) {
    this.pos.push(...a, ...b, ...c, ...d);
    this.uv.push(...ua, ...ub, ...uc, ...ud);
    this.meta.push(id, kind, id, kind, id, kind, id, kind);
    const n = this.n;
    this.idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    this.n += 4;
  }
}

/* A flat frame to build a wall in: u runs along it, y is up, d comes out of it. */
function frame(o, ax, az) {
  return {
    o, ax, az,
    at: (u, y, d) => [o[0] + ax[0] * u + az[0] * d, y, o[2] + ax[2] * u + az[2] * d],
  };
}

export class Tenements {
  constructor() {
    this.chunks = new Map();
    this.data = new Float32Array(MAX * 2 * 4);
    this.count = 0;
    this.balconies = [];
    this.list = [];
  }

  chunk(z) {
    const k = Math.floor(z / 90);
    if (!this.chunks.has(k)) this.chunks.set(k, new Chunk());
    return this.chunks.get(k);
  }

  register(burn, ruin, tone, W, gf, fh, bays, H) {
    const i = this.count++;
    if (i >= MAX) throw new Error('too many facades');
    this.data.set([burn, ruin, tone, W], i * 4);
    this.data.set([gf, fh, bays, H], (MAX + i) * 4);
    return i;
  }

  /* A box in a wall's frame. `faces` says which sides can be seen: F front,
     L and R the two ends, T top, B underside. */
  box(c, fr, u0, u1, y0, y1, d0, d1, id, kind, faces) {
    if (u1 - u0 < 0.005 || y1 - y0 < 0.005) return;
    const P = fr.at;
    for (const f of faces) {
      if (f === 'F') c.quad(P(u0, y0, d1), P(u1, y0, d1), P(u1, y1, d1), P(u0, y1, d1), [u0, y0], [u1, y0], [u1, y1], [u0, y1], id, kind);
      else if (f === 'L') c.quad(P(u0, y0, d0), P(u0, y0, d1), P(u0, y1, d1), P(u0, y1, d0), [u0, y0], [u0, y0], [u0, y1], [u0, y1], id, kind);
      else if (f === 'R') c.quad(P(u1, y0, d1), P(u1, y0, d0), P(u1, y1, d0), P(u1, y1, d1), [u1, y0], [u1, y0], [u1, y1], [u1, y1], id, kind);
      else if (f === 'T') c.quad(P(u0, y1, d1), P(u1, y1, d1), P(u1, y1, d0), P(u0, y1, d0), [u0, y1], [u1, y1], [u1, y1], [u0, y1], id, kind);
      else if (f === 'B') c.quad(P(u0, y0, d0), P(u1, y0, d0), P(u1, y0, d1), P(u0, y0, d1), [u0, y0], [u1, y0], [u1, y0], [u0, y0], id, kind);
    }
  }

  /* One street front. Returns where its windows are. */
  facade(c, fr, W, H, { seed, burn, ruin, gate = true, balcony = 0.22, ry = 0, plain = false }) {
    const R = rng(Math.floor(seed * 9973) + 7);
    const gf = 4.0 + R() * 0.6;
    const fh = 3.2 + R() * 0.35;
    const bays = Math.max(2, Math.round(W / (2.5 + R() * 0.6)));
    const tone = R();
    const style = Math.floor(R() * 3);
    const id = this.register(burn, ruin, tone, W, gf, fh, bays, H);
    const nf = Math.max(1, Math.floor((H - gf - 0.9) / fh));
    const bw = W / bays;
    const ww = Math.min(1.22, bw * 0.46);
    const wy0 = 0.95, wy1 = Math.min(2.8, fh - 0.42);
    const B = (...a) => this.box(c, fr, ...a);

    /* ── ground floor: shops, doors, and the carriage gate ── */
    const gateBay = gate && R() > 0.45 ? Math.floor(bays / 2) : -1;
    let from = 0;
    for (let b = 0; b < bays; b++) {
      const kr = R();
      const isGate = b === gateBay;
      const open = isGate || kr < 0.8;
      if (!open) continue;
      const cx = (b + 0.5) * bw;
      const ow = isGate ? Math.min(2.6, bw * 0.82) : bw * 0.64;
      const oh = isGate ? 3.3 : 2.8;
      B(from, cx - ow / 2, 0, gf, -T, 0, id, WALL, 'FLR');
      B(cx - ow / 2, cx + ow / 2, oh, gf, -T, 0, id, WALL, 'FB');
      /* what is in the opening */
      const dz = isGate ? -1.6 : -T * 0.85;
      c.quad(fr.at(cx - ow / 2, 0, dz), fr.at(cx + ow / 2, 0, dz), fr.at(cx + ow / 2, oh, dz), fr.at(cx - ow / 2, oh, dz),
        [cx - ow / 2, 0], [cx + ow / 2, 0], [cx + ow / 2, oh], [cx - ow / 2, oh], id, isGate ? DARK : SHOP);
      if (isGate) {
        // Stone voussoirs make a real polygonal arch above the recessed passage.
        const radius=ow/2, spring=oh-radius;
        for(let i=0;i<9;i++) {
          const a=i*Math.PI/9,b=(i+1)*Math.PI/9;
          const pt=(r,t,d)=>fr.at(cx+Math.cos(t)*r,spring+Math.sin(t)*r,d);
          c.quad(pt(radius,a,.085),pt(radius+.23,a,.085),pt(radius+.23,b,.085),pt(radius,b,.085),[cx,spring],[cx+.23,spring],[cx+.23,oh],[cx,oh],id,TRIM);
          // Fill the corners between the curved opening and rectangular lintel.
          c.quad(pt(radius,a,0),fr.at(cx+Math.cos(a)*radius,oh,0),fr.at(cx+Math.cos(b)*radius,oh,0),pt(radius,b,0),[cx,oh],[cx,oh],[cx,oh],[cx,oh],id,WALL);
        }
        B(cx - ow / 2, cx + ow / 2, 0, oh, -1.6, -T, id, DARK, 'T');
        c.quad(fr.at(cx - ow / 2, 0, -1.6), fr.at(cx - ow / 2, 0, -T), fr.at(cx - ow / 2, oh, -T), fr.at(cx - ow / 2, oh, -1.6), [0, 0], [0, 0], [0, oh], [0, oh], id, DARK);
        c.quad(fr.at(cx + ow / 2, 0, -T), fr.at(cx + ow / 2, 0, -1.6), fr.at(cx + ow / 2, oh, -1.6), fr.at(cx + ow / 2, oh, -T), [0, 0], [0, 0], [0, oh], [0, oh], id, DARK);
        /* a keystone and two imposts, to make it a gate and not a hole */
        B(cx - 0.22, cx + 0.22, oh, oh + 0.5, 0, 0.09, id, TRIM, 'FLRTB');
        B(cx - ow / 2 - 0.2, cx - ow / 2, 0, oh + 0.14, 0, 0.07, id, TRIM, 'FLRT');
        B(cx + ow / 2, cx + ow / 2 + 0.2, 0, oh + 0.14, 0, 0.07, id, TRIM, 'FLRT');
      } else if (kr < 0.6 && !plain) {
        B(cx - ow / 2 - 0.18, cx + ow / 2 + 0.18, oh + 0.14, oh + 0.66, 0, 0.07, id, SIGN, 'FLRTB');
        if(ruin<.25 && kr<.38) {
          const aw=ow/2+.22;
          c.quad(fr.at(cx-aw,oh+.15,.04),fr.at(cx+aw,oh+.15,.04),fr.at(cx+aw,oh-.36,1.05),fr.at(cx-aw,oh-.36,1.05),[0,0],[ow,0],[ow,1],[0,1],id,CANVAS);
          B(cx-aw,cx+aw,oh-.5,oh-.36,1.02,1.07,id,CANVAS,'FLRB');
          for(const side of [-1,1]) B(cx+side*aw-.025,cx+side*aw+.025,oh-.45,oh-.39,.03,1.03,id,IRON,'FLRTB');
        }
      }
      if(!isGate) {
        // Recessed wooden shop jambs, transom and a handle at hand height.
        for(const side of [-1,1]) B(cx+side*(ow/2-.045)-.04,cx+side*(ow/2-.045)+.04,0,oh,-.2,-.12,id,WOOD,'FLRT');
        B(cx-.035,cx+.035,.08,oh,-.2,-.12,id,WOOD,'FLRT');
        B(cx-ow/2,cx+ow/2,2.08,2.16,-.2,-.12,id,WOOD,'FLRTB');
        B(cx+.13,cx+.16,1.02,1.23,-.11,-.07,id,IRON,'FLRTB');
      }
      from = cx + ow / 2;
    }
    B(from, W, 0, gf, -T, 0, id, WALL, 'FLR');
    B(0, W, gf - 0.13, gf + 0.11, 0, 0.14, id, TRIM, 'FTB');

    /* ── the floors above ── */
    let low = gf;
    for (let f = 0; f < nf; f++) {
      const y0 = gf + f * fh;
      const sill = y0 + wy0, head = y0 + wy1;
      B(0, W, low, sill, -T, 0, id, WALL, 'FT');
      let u = 0;
      for (let b = 0; b < bays; b++) {
        const cx = (b + 0.5) * bw;
        B(u, cx - ww / 2, sill, head, -T, 0, id, WALL, b === 0 ? 'FR' : 'FLR');
        u = cx + ww / 2;
        c.quad(fr.at(cx - ww / 2, sill, -T), fr.at(cx + ww / 2, sill, -T), fr.at(cx + ww / 2, head, -T), fr.at(cx - ww / 2, head, -T),
          [cx - ww / 2, sill], [cx + ww / 2, sill], [cx + ww / 2, head], [cx - ww / 2, head], id, PANE);
        if (plain) continue;
        // Frames have depth at walking distance, rather than only painted bars.
        B(cx-.027,cx+.027,sill,head,-T,-T+.075,id,WOOD,'FLRTB');
        B(cx-ww/2,cx+ww/2,sill+(head-sill)*.68-.027,sill+(head-sill)*.68+.027,-T,-T+.075,id,WOOD,'FLRTB');
        B(cx - ww / 2 - 0.14, cx + ww / 2 + 0.14, sill - 0.1, sill, 0, 0.13, id, TRIM, 'FLRTB');
        if (style > 0) B(cx - ww / 2 - 0.2, cx + ww / 2 + 0.2, head + 0.2, head + 0.34, 0, 0.16, id, TRIM, 'FLRTB');
        if (style > 1) {
          B(cx - ww / 2 - 0.13, cx - ww / 2, sill, head + 0.2, 0, 0.05, id, TRIM, 'FLR');
          B(cx + ww / 2, cx + ww / 2 + 0.13, sill, head + 0.2, 0, 0.05, id, TRIM, 'FLR');
        }
        if (ruin < 0.45 && R() < balcony * (1 - ruin)) {
          this.balconies.push({ p: fr.at(cx, y0 + 0.12, 0), ry, floor: f, bay: b, fid: id });
        }
      }
      B(u, W, sill, head, -T, 0, id, WALL, 'FL');
      low = head;
      if (f > 0 && f < nf && style === 2 && !plain) B(0, W, y0 - 0.06, y0 + 0.06, 0, 0.06, id, TRIM, 'FTB');
    }
    B(0, W, low, H, -T, 0, id, WALL, 'FB');
    /* the cornice */
    B(0, W, H - 0.78, H - 0.5, 0, 0.16, id, TRIM, 'FB');
    B(0, W, H - 0.5, H, 0, 0.4, id, TRIM, 'FBT');
    if (!plain) {
      B(0, 0.32, gf + 0.11, H - 0.78, 0, 0.05, id, TRIM, 'FR');
      B(W - 0.32, W, gf + 0.11, H - 0.78, 0, 0.05, id, TRIM, 'FL');
      // Quoin blocks and rainwater pipes break up the repeated facade silhouette.
      for(let y=.15;y<H-.8;y+=.62) for(const edge of [0,W-.4])
        B(edge,edge+.4,y,y+.53,.015,.09,id,TRIM,'FLRTB');
      const pipe=W-.57;
      B(pipe-.045,pipe+.045,.22,H-.32,.11,.21,id,IRON,'FLRTB');
      for(let y=.8;y<H-.4;y+=2.6) B(pipe-.075,pipe+.075,y,y+.065,.07,.23,id,IRON,'FLRTB');
      B(pipe-.045,pipe+.045,.16,.28,.11,.48,id,IRON,'FLRTB');
      for(let x=.55;x<W-.4;x+=.85) B(x,x+.16,H-.83,H-.52,0,.25,id,TRIM,'FLRB');
    }
    return {
      id, gf, fh, bays, nf, bw, ww, wy0, wy1, ry, W, at: fr.at, out: fr.az,
      /* the sill of a window, and the floor level at a bay; d is how far out from the wall */
      sill: (b, f, d = 0) => fr.at((b + 0.5) * bw, gf + f * fh + wy0, d),
      floor: (b, f, d = 0) => fr.at((b + 0.5) * bw, gf + f * fh, d),
    };
  }

  /* Make sure a window has a balcony, and say where it is. */
  balconyAt(fac, b, f) {
    b = Math.max(0, Math.min(fac.bays - 1, b)); f = Math.max(0, Math.min(fac.nf - 1, f));
    let rec = this.balconies.find((x) => x.fid === fac.id && x.bay === b && x.floor === f);
    if (!rec) {
      const p = fac.floor(b, f); p[1] += 0.12;
      rec = { p, ry: fac.ry, floor: f, bay: b, fid: fac.id };
      this.balconies.push(rec);
    }
    return { ...rec, stand: (d = 0.45, along = 0) => { const q = fac.at((b + 0.5) * fac.bw + along, fac.gf + f * fac.fh + 0.18, d); return q; } };
  }

  /* A wall with nothing on it: a side, or a back. */
  blind(c, fr, W, H, id) {
    c.quad(fr.at(0, 0, 0), fr.at(W, 0, 0), fr.at(W, H, 0), fr.at(0, H, 0), [0, 0], [W, 0], [W, H], [0, H], id, SIDE);
  }

  /* x, z: the middle of the foot of the street front. ry: which way it faces.
     left / right: give that end a street front of its own, for a corner house. */
  add({ x, z, ry, W, H, D = 13, seed, burn = 0, ruin = 0, balcony = 0.22, left = false, right = false, gate = true, plain = false, flat = false }) {
    const cos = Math.cos(ry), sin = Math.sin(ry);
    const X = [cos, 0, -sin], Z = [sin, 0, cos];            // the house's own right, and its front
    const neg = (v) => [-v[0], 0, -v[2]];
    const P = (lx, ly, lz) => [x + lx * cos + lz * sin, ly, z - lx * sin + lz * cos];
    const c = this.chunk(z);
    const opts = { seed, burn, ruin, balcony, gate, plain };

    const front = this.facade(c, frame(P(-W / 2, 0, 0), X, Z), W, H, { ...opts, ry });
    const id = front.id;
    const fl = frame(P(-W / 2, 0, -D), Z, neg(X));
    const frr = frame(P(W / 2, 0, 0), neg(Z), X);
    const sides = {};
    if (left) sides.left = this.facade(c, fl, D, H, { ...opts, seed: seed + 0.37, ry: ry - Math.PI / 2, gate: false });
    else this.blind(c, fl, D, H, id);
    if (right) sides.right = this.facade(c, frr, D, H, { ...opts, seed: seed + 0.61, ry: ry + Math.PI / 2, gate: false });
    else this.blind(c, frr, D, H, id);
    this.blind(c, frame(P(W / 2, 0, -D), neg(X), neg(Z)), W, H, id);

    if (flat) {
      /* a flat roof behind a parapet: somewhere to stand */
      c.quad(P(-W / 2, H, 0), P(W / 2, H, 0), P(W / 2, H, -D), P(-W / 2, H, -D), [0, 0], [W, 0], [W, D], [0, D], id, ROOF);
      const fr0 = frame(P(-W / 2, 0, 0), X, Z);
      this.box(c, fr0, 0, W, H, H + 0.85, -0.3, 0, id, TRIM, 'FT');
      c.quad(fr0.at(W, H, -0.3), fr0.at(0, H, -0.3), fr0.at(0, H + 0.85, -0.3), fr0.at(W, H + 0.85, -0.3), [0, H], [W, H], [W, H + 0.85], [0, H + 0.85], id, TRIM);
      const rec = { x, z, ry, W, H, D, seed, burn, ruin, P, front, sides, gf: front.gf, fh: front.fh, bays: front.bays, roofY: H, roofAt: (lx, lz) => P(lx, H, lz) };
      this.list.push(rec);
      return rec;
    }
    /* the roof: two low slopes and the gables, and chimneys along the ridge */
    const rh = 1.5 + (seed * 7.3 % 1) * 1.1;
    const e = 0.38;                                            // the eaves overhang the cornice
    const a = P(-W / 2, H, e), b = P(W / 2, H, e), cc = P(W / 2, H + rh, -D / 2), d = P(-W / 2, H + rh, -D / 2);
    const a2 = P(-W / 2, H, -D), b2 = P(W / 2, H, -D);
    c.quad(a, b, cc, d, [0, 0], [W, 0], [W, D / 2], [0, D / 2], id, ROOF);
    c.quad(b2, a2, d, cc, [0, 0], [W, 0], [W, D / 2], [0, D / 2], id, ROOF);
    c.quad(a2, a, d, d, [0, H], [D, H], [D / 2, H], [D / 2, H], id, SIDE);
    c.quad(b, b2, cc, cc, [0, H], [D, H], [D / 2, H], [D / 2, H], id, SIDE);
    const R = rng(Math.floor(seed * 577) + 3);
    const nc = 2 + Math.floor(R() * 3);
    for (let i = 0; i < nc; i++) {
      const cx = -W / 2 + (i + 0.5 + (R() - 0.5) * 0.5) * (W / nc);
      const cw = 0.7 + R() * 0.6, ch = 1.1 + R() * 0.9, cz = -D / 2 + (R() - 0.5) * 2.4;
      const fr2 = frame(P(cx - cw / 2, 0, cz + 0.3), X, Z);
      this.box(c, fr2, 0, cw, H + rh - 0.5, H + rh + ch, -0.6, 0, id, SIDE, 'FLRT');
      this.box(c,fr2,-.09,cw+.09,H+rh+ch-.08,H+rh+ch+.08,-.69,.09,id,TRIM,'FLRTB');
      c.quad(fr2.at(cw, H + rh - 0.5, -0.6), fr2.at(0, H + rh - 0.5, -0.6), fr2.at(0, H + rh + ch, -0.6), fr2.at(cw, H + rh + ch, -0.6), [0, H], [cw, H], [cw, H + 1], [0, H + 1], id, SIDE);
    }

    if(!plain && ruin<.25) {
      // Small projecting dormers, each with a dark inset and a pitched cap.
      const count=Math.max(1,Math.floor(W/6));
      for(let i=0;i<count;i++) {
        const dx=-W/2+(i+1)*W/(count+1),dz=-D*.23;
        const base=H+rh*(-dz+e)/(D/2+e);
        const df=frame(P(dx-.55,0,dz),X,Z);
        this.box(c,df,0,1.1,base,base+1.15,-.85,0,id,TRIM,'FLRT');
        this.box(c,df,.18,.92,base+.16,base+.96,0,.015,id,DARK,'F');
        this.box(c,df,.52,.58,base+.16,base+.96,.015,.05,id,WOOD,'FLRT');
        c.quad(df.at(-.12,base+1.15,.12),df.at(.55,base+1.56,.12),df.at(.55,base+1.56,-.98),df.at(-.12,base+1.15,-.98),[0,0],[.6,0],[.6,1],[0,1],id,ROOF);
        c.quad(df.at(.55,base+1.56,.12),df.at(1.22,base+1.15,.12),df.at(1.22,base+1.15,-.98),df.at(.55,base+1.56,-.98),[0,0],[.6,0],[.6,1],[0,1],id,ROOF);
      }
    }

    /* a point on the front slope of the roof, lz metres back from the street front */
    const roofAt = (lx, lz) => P(lx, H + rh * Math.min(1, (-lz + e) / (D / 2 + e)), lz);
    const rec = { x, z, ry, W, H, D, seed, burn, ruin, P, front, sides, gf: front.gf, fh: front.fh, bays: front.bays, roofY: H + rh, roofAt };
    this.list.push(rec);
    return rec;
  }

  /* Fill a straight run with houses of different widths and heights. */
  row({ from, to, line, side, seed = 1, hMin = 14.5, hMax = 21, along = 'z', D = 13, force, startCorner = false, endCorner = false }) {
    const R = rng(seed * 7919 + 13);
    const dir = Math.sign(to - from);
    let c = from;
    const out = [];
    while ((to - c) * dir > 5) {
      let W = 11 + R() * 10;
      const leftOver = Math.abs(to - c);
      if (leftOver - W < 7) W = leftOver;
      const mid = c + dir * W / 2;
      const r = R();
      const z = along === 'z' ? mid : line;
      const { burn, ruin } = force || fate(z, r);
      const H = hMin + R() * (hMax - hMin);
      const o = along === 'z' ? { x: line, z: mid, ry: side } : { x: mid, z: line, ry: side };
      const first = out.length === 0, last = leftOver - W < 0.01;
      /* which end of this house is the start of the run depends on which way it faces */
      const X = [Math.cos(side), -Math.sin(side)];
      const runDir = along === 'z' ? [0, dir] : [dir, 0];
      const startIsLeft = X[0] * runDir[0] + X[1] * runDir[1] > 0;
      const corner = { left: false, right: false };
      if (first && startCorner) corner[startIsLeft ? 'left' : 'right'] = true;
      if (last && endCorner) corner[startIsLeft ? 'right' : 'left'] = true;
      out.push(this.add({ ...o, W, H, D, seed: seed * 31.7 + out.length * 3.13 + R(), burn, ruin, ...corner }));
      c += dir * W;
    }
    return out;
  }

  meshes() {
    const tex = new THREE.DataTexture(this.data, MAX, 2, THREE.RGBAFormat, THREE.FloatType);
    tex.minFilter = tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    const mat = tenementMaterial(tex);
    const out = [];
    for (const c of this.chunks.values()) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(c.pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(c.uv, 2));
      g.setAttribute('aMeta', new THREE.Float32BufferAttribute(c.meta, 2));
      g.setIndex(c.idx);
      const m = new THREE.Mesh(g, mat);
      m.frustumCulled = false;
      out.push(m);
    }
    return out;
  }
}

export function balconyGeometry(merge, at, box) {
  const parts = [at(box(1.9, 0.12, 0.85), 0, 0, 0.425)];
  /* two brackets under the slab */
  parts.push(at(box(0.09, 0.3, 0.6), -0.7, -0.18, 0.3), at(box(0.09, 0.3, 0.6), 0.7, -0.18, 0.3));
  parts.push(at(box(1.9, 0.045, 0.045), 0, 1.0, 0.83));
  parts.push(at(box(0.045, 0.045, 0.85), -0.93, 1.0, 0.425));
  parts.push(at(box(0.045, 0.045, 0.85), 0.93, 1.0, 0.425));
  parts.push(at(box(1.9, 0.03, 0.03), 0, 0.2, 0.83));
  for (let i = 0; i <= 8; i++) parts.push(at(box(0.024, 1.0, 0.024), -0.9 + i * 0.225, 0.5, 0.83));
  for (let i = 1; i <= 2; i++) {
    parts.push(at(box(0.024, 1.0, 0.024), -0.93, 0.5, i * 0.28));
    parts.push(at(box(0.024, 1.0, 0.024), 0.93, 0.5, i * 0.28));
  }
  return merge(parts);
}

function tenementMaterial(tex) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { ...world, uBld: { value: tex } },
    vertexShader: /* glsl */ `
      attribute vec2 aMeta;
      uniform highp sampler2D uBld;
      varying vec3 vP;
      varying vec2 vUv;
      flat varying vec4 vA;
      flat varying vec4 vB;
      flat varying vec2 vMeta;
      void main() {
        vUv = uv; vMeta = aMeta;
        int i = int(aMeta.x + 0.5);
        vA = texelFetch(uBld, ivec2(i, 0), 0);
        vB = texelFetch(uBld, ivec2(i, 1), 0);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vP = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vP;
      varying vec2 vUv;
      flat varying vec4 vA;
      flat varying vec4 vB;
      flat varying vec2 vMeta;
      uniform float uLit;
      ${GLSL_NOISE}
      ${GLSL_LIGHT}

      vec3 brickCol(vec2 uv, float seed) {
        vec2 b = uv * vec2(1.0 / 0.27, 1.0 / 0.09);
        float row = floor(b.y);
        b.x += mod(row, 2.0) * 0.5;
        vec2 id = floor(b);
        vec2 f = fract(b);
        float mortar = max(step(f.x, 0.05), step(f.y, 0.16));
        float r = hash21(id + seed);
        vec3 c = mix(vec3(0.21, 0.12, 0.085), vec3(0.36, 0.21, 0.14), r);
        c *= 0.8 + 0.4 * nz(uv * 9.0);
        float lod = clamp(1.0 - fwidth(b.y) * 1.4, 0.0, 1.0);
        return mix(vec3(0.27, 0.18, 0.13), mix(c, vec3(0.34, 0.31, 0.27), mortar), lod);
      }

      void main() {
        float seed = vMeta.x;
        int kind = int(vMeta.y + 0.5);
        float burn = vA.x, ruin = vA.y, r1 = vA.z, W = vA.w;
        float gf = vB.x, fh = vB.y, bays = vB.z, H = vB.w;
        vec2 uv = vUv;
        /* every surface here is flat, so the slope of the position is its normal */
        vec3 N = normalize(cross(dFdx(vP), dFdy(vP)));
        float r2 = hash11(seed * 3.71 + 1.0);
        float r3 = hash11(seed * 11.9 + 2.0);

        /* fire takes the top of a house first */
        if (ruin > 0.01) {
          if (kind == ${ROOF} && ruin > 0.25) discard;
          float n = fbm(vec2(uv.x * 0.06 + seed * 13.0, seed * 3.0));
          float n2 = nz(vec2(uv.x * 2.3 + seed * 3.0, 2.0));
          float edge = H * (1.0 - ruin * (0.12 + 0.8 * n)) + (n2 - 0.5) * 0.7 * ruin;
          if (kind != ${ROOF} && uv.y > edge) discard;
        }

        float bw = W / bays;
        float bi = floor(uv.x / bw);
        float lx = uv.x - (bi + 0.5) * bw;
        float fi = floor((uv.y - gf) / fh);
        float ly = uv.y - gf - fi * fh;
        float ww = min(1.22, bw * 0.46);
        float wy0 = 0.95, wy1 = min(2.8, fh - 0.42);
        vec2 wid = vec2(bi, fi) + seed * 17.0;
        float wr = hash21(wid);

        vec3 tone = mix(vec3(0.33, 0.30, 0.26), vec3(0.56, 0.52, 0.45), r1);
        tone = mix(tone, vec3(0.45, 0.37, 0.27), r3 * 0.45);

        vec3 emis = vec3(0.0);
        vec3 col;

        if(kind == ${WOOD}) {
          float grain=nz(vec2(uv.x*24.0+seed,uv.y*1.4));
          col=vec3(.13,.085,.043)*(.75+.4*grain)*(1.0-burn*.6);
        } else if(kind == ${IRON}) {
          col=mix(vec3(.027,.025,.021),vec3(.13,.08,.044),step(.78,nz(uv*4.0+seed)));
        } else if(kind == ${CANVAS}) {
          col=mix(vec3(.34,.27,.17),vec3(.55,.45,.30),r1)*(.85+.15*sin(uv.x*18.0));
        } else if (kind == ${ROOF}) {
          /* sheet metal, laid in strips */
          float seam = smoothstep(0.04, 0.0, abs(fract(uv.x / 0.62) - 0.5) - 0.46);
          col = vec3(0.055, 0.052, 0.05) * (0.7 + 0.6 * nz(vP.xz * 3.0)) * (1.0 - 0.4 * seam);
        } else if (kind == ${SIDE}) {
          /* a blind wall: brick, with what is left of the plaster */
          vec3 pl = tone * 0.9 * (0.7 + 0.45 * fbm(uv * 0.5 + seed));
          float pm = smoothstep(0.42, 0.52, fbm(uv * 0.22 + seed * 4.0) - ruin * 0.2);
          col = mix(brickCol(uv, seed), pl, pm);
          col *= mix(1.0, 0.35, burn * 0.8);
        } else if (kind == ${DARK}) {
          col = vec3(0.012, 0.011, 0.01) * (1.0 + 2.0 * smoothstep(1.2, 0.0, uv.y));
        } else if (kind == ${PANE}) {
          if (ruin > 0.35 && hash21(wid + 1.7) < ruin * 1.3) discard;
          float wyn = (ly - wy0) / (wy1 - wy0);
          vec3 glass = vec3(0.022, 0.021, 0.02) + uSkyCol * 0.22 * (0.35 + 0.65 * nz(vec2(lx * 2.0 + wr * 30.0, ly * 1.3)));
          float lit = step(wr, uLit) * step(burn + ruin, 0.25);
          float curtain = 0.45 + 0.55 * smoothstep(0.16, 0.34, abs(lx) / ww + 0.05 * sin(ly * 7.0 + wr * 20.0)) * (0.8 + 0.2 * sin(lx * 46.0));
          vec3 lamp = vec3(1.0, 0.52, 0.2) * (0.3 + 0.7 * hash21(wid + 2.2)) * curtain;
          emis += lamp * lit * 0.4 * (0.92 + 0.08 * sin(uTime * (3.0 + wr * 5.0) + wr * 50.0));

          /* the room behind is on fire */
          float fw = step(hash21(wid + 3.3), burn * 0.8) * step(ruin, 0.7);
          if (fw > 0.5) {
            vec2 q = vec2(lx * 1.5 + wr * 10.0, wyn * 2.2 - uTime * (1.3 + wr));
            float fl = fbm(q * 2.2) + 0.55 * (1.0 - wyn) - 0.25;
            fl = smoothstep(0.42, 0.95, fl);
            float flick = 0.8 + 0.2 * sin(uTime * (9.0 + wr * 7.0) + wr * 40.0);
            vec3 fc = mix(vec3(1.0, 0.16, 0.02), vec3(1.0, 0.72, 0.28), fl);
            emis += fc * fl * 2.1 * flick + vec3(0.4, 0.09, 0.02) * (1.0 - wyn) * 0.7;
          }
          /* glazing bars, unless the fire has had them */
          float bar = max(step(abs(lx), 0.034), step(abs(wyn - 0.68), 0.016 * 2.0));
          bar = max(bar, step(ww * 0.5 - 0.06, abs(lx)));
          bar = max(bar, max(step(wyn, 0.035), step(0.97, wyn)));
          float gone = step(1.0 - burn * 0.7 - ruin, hash21(wid + 8.8));
          bar *= 1.0 - gone;
          glass = mix(glass, vec3(0.006), gone * (1.0 - fw));
          col = mix(glass, tone * 0.38, bar);
          emis *= 1.0 - bar * 0.85;
        } else if (kind == ${SHOP}) {
          float gbw = bw;
          float gbi = floor(uv.x / gbw);
          float glx = uv.x - (gbi + 0.5) * gbw;
          float kr = hash21(vec2(gbi, seed * 3.0));
          float ow = gbw * 0.64;
          float frameO = max(step(ow * 0.5 - 0.09, abs(glx)), step(2.8 - 0.1, uv.y));
          vec3 dark = vec3(0.018, 0.016, 0.014) + uSkyCol * 0.08;
          float shutter = step(0.5, kr * 1.4);
          vec3 slat = tone * 0.3 * (0.75 + 0.25 * step(0.5, fract(uv.y / 0.11)));
          dark = mix(dark, slat, shutter);
          float door = step(kr, 0.22);
          float panel = step(0.12, abs(fract(uv.y / 1.2) - 0.5)) * step(0.08, abs(abs(glx) - ow * 0.25));
          dark = mix(dark, vec3(0.07, 0.05, 0.035) * (0.6 + 0.5 * panel) * (0.7 + 0.5 * nz(vec2(glx * 14.0, uv.y * 0.8))), door);
          /* a shop window has a transom and a stall riser */
          float shopBars = max(step(abs(uv.y - 2.15), 0.03), step(uv.y, 0.5)) * (1.0 - shutter) * (1.0 - door);
          col = mix(dark, tone * 0.3, max(frameO, shopBars));
          col *= 1.0 - 0.6 * burn;
          float litS = step(hash21(vec2(gbi, seed) + 6.6), uLit * 0.5) * step(burn + ruin, 0.2) * (1.0 - shutter) * (1.0 - door);
          emis += vec3(1.0, 0.6, 0.27) * 0.25 * litS * (1.0 - max(frameO, shopBars));
        } else if (kind == ${SIGN}) {
          float letters = step(0.5, nz(vec2(uv.x * 9.0 + seed * 9.0, 3.0 + bi))) * step(abs(uv.y - 3.2), 0.1) * step(abs(lx), bw * 0.27);
          vec3 board = mix(vec3(0.07, 0.065, 0.06), vec3(0.42, 0.39, 0.33), step(0.5, hash21(vec2(bi, seed + 4.0))));
          col = mix(board, vec3(0.5) - board * 0.8, letters * 0.8) * (1.0 - burn * 0.7);
        } else {
          /* the wall, and the stone trim that stands off it */
          float stain = fbm(uv * 0.6 + seed * 5.0);
          float streak = nz(vec2(uv.x * 5.0 + seed, uv.y * 0.22));
          col = tone * (0.68 + 0.45 * stain) * (0.88 + 0.22 * streak);
          if (kind == ${TRIM}) {
            col *= 1.16;
          } else {
            float patchN = fbm(uv * 0.27 + seed * 9.0);
            float brickMask = smoothstep(0.585, 0.635, patchN + ruin * 0.22 + burn * 0.1);
            col = mix(col, brickCol(uv, seed), brickMask);
            if (uv.y < gf) {
              /* a rusticated ground floor: deep level joints */
              float gy = fract(uv.y / 0.46);
              col *= 0.86;
              col *= 1.0 - 0.34 * step(gy, 0.075) * (1.0 - brickMask);
            }
          }
          col *= 0.7 + 0.3 * smoothstep(0.0, 0.8, uv.y);
          // Broad triangular plaster planes echo the faceted environment reference.
          vec2 cell=uv*.72;vec2 tile=floor(cell);
          float triangle=step(fract(cell).x,fract(cell).y);
          float plane=hash21(tile+vec2(triangle*17.3,seed));
          col*=.88+.24*plane;
          if(kind==${WALL}) {
            float crack=abs(fract(cell.x+cell.y*.37+hash11(floor(cell.y)+seed)*.25)-.5);
            float width=max(fwidth(cell.x)*.8,.004);
            col*=1.0-(1.0-smoothstep(width,width*2.0,crack))*.22*step(.68,plane);
          }

          /* soot climbing from a window that burned, and from the one below it */
          if (uv.y > gf && burn > 0.01) {
            float above = ly - wy1;
            float s1 = step(0.0, above) * smoothstep(1.6, 0.0, above) * step(hash21(wid + 3.3), burn * 1.1);
            float below = ly + (fh - wy1);
            float s2 = step(ly, wy0) * smoothstep(2.3, 0.3, below) * step(hash21(wid - vec2(0.0, 1.0) + 3.3), burn * 1.1);
            float soot = max(s1, s2) * smoothstep(ww * 1.0, ww * 0.25, abs(lx)) * (0.6 + 0.4 * nz(vec2(uv.x * 4.0, uv.y * 0.6)));
            col *= 1.0 - 0.9 * soot;
          }
          float scorch = clamp(burn * (0.25 + 0.75 * fbm(uv * 0.33 + seed * 2.0)) + ruin * 0.45, 0.0, 1.0);
          col = mix(col, col * vec3(0.22, 0.19, 0.17), scorch * 0.85);
        }

        vec3 c = shade(col, N, vP);
        float f = fogAmount(vP);
        c = mix(c, uFogCol, f);
        c += emis * (1.0 - f * 0.75);
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
}
