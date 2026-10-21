/* ============================================================
   Sound.

   Nothing here is a recording. The violin is a bowed string made
   in the browser, playing a lament written for this page, and in
   the last chapters a wordless voice sings it with the violin.
   Under them sit wind, fire, people's voices in the street, and
   the fighting: rifles, pistols, a machine gun, shouting. Each is
   turned up or down by where you are standing.

   When time is held, all of that falls away to a low tone and a
   pulse, and a sound belongs to a place instead: walk up to a
   muzzle flash that is hanging in the air and you hear that shot,
   drawn out.

   To use a licensed recording in place of the violin, put the file
   in assets/personal/28-days/audio/ and name it on the page:
     <html lang="en" data-theme="./assets/personal/28-days/audio/theme.mp3">
   It is then played, looped, and the built in violin stays silent.
   ============================================================ */

const THEME = document.documentElement.dataset.theme || '';

/* The lament. D freygish: D Eb F# G A Bb C. [midi, beats]; 0 is a rest. */
const MELODY = [
  [62, 2], [67, 1], [69, 1], [70, 3], [69, 1], [67, 2], [66, 1], [63, 1], [62, 4], [0, 2],
  [62, 1], [66, 1], [67, 2], [69, 1], [72, 1], [70, 3], [69, 1], [67, 1], [69, 1], [74, 4], [0, 2],
  [74, 2], [72, 1], [70, 1], [69, 3], [67, 1], [66, 2], [67, 1], [69, 1], [70, 2], [69, 2], [0, 1],
  [67, 1], [66, 1], [63, 2], [62, 1], [63, 1], [66, 2], [67, 1], [66, 1], [63, 1], [62, 5], [0, 8],
];
/* Hatikvah: its opening lines and its turn, in D minor. The melody is in the public domain. */
const HOPE = [
  [62, 0.5], [64, 0.5], [65, 0.5], [67, 0.5], [69, 1], [69, 1], [70, 0.5], [69, 0.5], [70, 0.5], [74, 0.5], [69, 2],
  [67, 1], [67, 0.5], [67, 0.5], [65, 1], [65, 1], [64, 0.5], [62, 0.5], [64, 0.5], [65, 0.5], [62, 2], [0, 0.5],
  [62, 0.5], [64, 0.5], [65, 0.5], [67, 0.5], [69, 1], [69, 1], [70, 0.5], [69, 0.5], [70, 0.5], [74, 0.5], [69, 2],
  [67, 1], [67, 0.5], [67, 0.5], [65, 1], [65, 1], [64, 0.5], [62, 0.5], [64, 0.5], [65, 0.5], [62, 2], [0, 1],
  [62, 0.5], [74, 0.5], [74, 0.5], [74, 0.5], [72, 0.5], [74, 0.5], [72, 0.25], [70, 0.25], [69, 2],
  [62, 0.5], [74, 0.5], [74, 0.5], [74, 0.5], [72, 0.5], [74, 0.5], [72, 0.25], [70, 0.25], [69, 2],
  [67, 1], [67, 0.5], [67, 0.5], [65, 1], [65, 1], [64, 0.5], [62, 0.5], [64, 0.5], [65, 0.5], [62, 3], [0, 4],
];
const BEAT = 60 / 50;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class Sound {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.muted = false;
    this.mood = { wind: 0, fire: 0, battle: 0, drone: 0, music: 0, muffle: 0, crowd: 0, sing: 0, held: 0, drip: 0, planes: 0, hope: 0 };
    this._crackle = 0; this._thud = 1; this._shot = 0.5; this._shout = 2; this._talk = 0.5; this._beat = 0; this._drip = 0.4; this._flak = 1;
  }

  async start() {
    if (this.ctx) { await this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    const now = ctx.currentTime;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
    this.master = ctx.createGain();
    this.master.gain.setValueAtTime(0, now);
    this.master.gain.linearRampToValueAtTime(0.9, now + 2.5);
    this.master.connect(comp).connect(ctx.destination);

    /* a room: a few seconds of decaying noise */
    const len = Math.floor(ctx.sampleRate * 3.4);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        lp += ((Math.random() * 2 - 1) - lp) * (0.5 - 0.42 * t);
        d[i] = lp * Math.pow(1 - t, 2.6);
      }
    }
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.5;
    this.reverb.connect(wet).connect(this.master);

    /* a shot comes back off the house fronts across the street */
    this.echo = ctx.createGain();
    const dl = ctx.createDelay(0.6); dl.delayTime.value = 0.21;
    const dlf = ctx.createBiquadFilter(); dlf.type = 'lowpass'; dlf.frequency.value = 1700;
    const dlg = ctx.createGain(); dlg.gain.value = 0.5;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    this.echo.connect(dl).connect(dlf).connect(dlg).connect(this.master);
    dlf.connect(fb).connect(dl);
    dlg.connect(this.reverb);

    /* held time: two tones a few cycles apart, so the stillness has a slow beat in it */
    this.ring = ctx.createGain(); this.ring.gain.value = 0;
    for (const f of [146.8, 148.1, 2936]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = f > 1000 ? 0.05 : 0.5;
      o.connect(g).connect(this.ring); o.start();
    }
    this.ring.connect(this.master);
    const rsend = ctx.createGain(); rsend.gain.value = 0.6;
    this.ring.connect(rsend).connect(this.reverb);

    this.singBus = ctx.createGain(); this.singBus.gain.value = 0;
    this.singBus.connect(this.master);
    const ssend = ctx.createGain(); ssend.gain.value = 0.9;
    this.singBus.connect(ssend).connect(this.reverb);

    /* noise to carve everything else from */
    const nb = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noise = nb;
    const loopNoise = () => { const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true; s.start(); return s; };

    /* the air: what is outdoors, and goes dull underground */
    this.air = ctx.createBiquadFilter();
    this.air.type = 'lowpass'; this.air.frequency.value = 16000;
    this.air.connect(this.master);

    // wind
    const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 420; wf.Q.value = 0.6;
    const wl = ctx.createOscillator(); wl.frequency.value = 0.07;
    const wlg = ctx.createGain(); wlg.gain.value = 240;
    wl.connect(wlg).connect(wf.frequency); wl.start();
    this.wind = ctx.createGain(); this.wind.gain.value = 0;
    loopNoise().connect(wf).connect(this.wind).connect(this.air);

    // the body of a fire
    const ff = ctx.createBiquadFilter(); ff.type = 'lowpass'; ff.frequency.value = 380;
    this.fire = ctx.createGain(); this.fire.gain.value = 0;
    loopNoise().connect(ff).connect(this.fire).connect(this.air);

    // people, far off: three narrow bands rising and falling out of step
    this.crowd = ctx.createGain(); this.crowd.gain.value = 0;
    [330, 520, 760].forEach((f, i) => {
      const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = 4;
      const g = ctx.createGain(); g.gain.value = 0.5;
      const l = ctx.createOscillator(); l.frequency.value = 0.11 + i * 0.07;
      const lg = ctx.createGain(); lg.gain.value = 0.4;
      l.connect(lg).connect(g.gain); l.start();
      loopNoise().connect(b).connect(g).connect(this.crowd);
    });
    this.crowd.connect(this.air);

    /* music */
    this.musicBus = ctx.createGain(); this.musicBus.gain.value = 0;
    this.musicBus.connect(this.master);
    const send = ctx.createGain(); send.gain.value = 0.7;
    this.musicBus.connect(send).connect(this.reverb);

    // low strings: an open fifth, barely moving
    this.drone = ctx.createGain(); this.drone.gain.value = 0;
    const df = ctx.createBiquadFilter(); df.type = 'lowpass'; df.frequency.value = 380; df.Q.value = 0.7;
    [[38, -6], [38, 7], [45, -4], [50, 5]].forEach(([mNote, det]) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(mNote); o.detune.value = det;
      const g = ctx.createGain(); g.gain.value = 0.11;
      o.connect(g).connect(df); o.start();
    });
    df.connect(this.drone);
    this.drone.connect(this.master);
    const dsend = ctx.createGain(); dsend.gain.value = 0.5;
    this.drone.connect(dsend).connect(this.reverb);

    /* bombers: engines a few cycles apart, so the sound of them throbs, high over the city */
    this.planes = ctx.createGain(); this.planes.gain.value = 0;
    const pf = ctx.createBiquadFilter(); pf.type = 'lowpass'; pf.frequency.value = 520; pf.Q.value = 0.8;
    [[74, 0], [74.9, 0], [111.4, 0], [148.6, 0], [56, 0]].forEach(([f], i) => {
      const o = ctx.createOscillator(); o.type = i === 4 ? 'triangle' : 'sawtooth'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = i === 4 ? 0.22 : 0.09;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + i * 0.013;
      const lg = ctx.createGain(); lg.gain.value = f * 0.012;
      lfo.connect(lg).connect(o.frequency); lfo.start();
      o.connect(g).connect(pf); o.start();
    });
    pf.connect(this.planes);
    this.planes.connect(this.air);
    const psend = ctx.createGain(); psend.gain.value = 0.6;
    this.planes.connect(psend).connect(this.reverb);
    /* and the siren over the city, rising and falling */
    this.siren = ctx.createGain(); this.siren.gain.value = 0;
    const so = ctx.createOscillator(); so.type = 'sine'; so.frequency.value = 420;
    const sl = ctx.createOscillator(); sl.frequency.value = 0.09;
    const slg = ctx.createGain(); slg.gain.value = 170;
    sl.connect(slg).connect(so.frequency); sl.start();
    const so2 = ctx.createOscillator(); so2.type = 'sine'; so2.frequency.value = 843;
    const slg2 = ctx.createGain(); slg2.gain.value = 340;
    sl.connect(slg2).connect(so2.frequency);
    const sg2 = ctx.createGain(); sg2.gain.value = 0.25;
    so.connect(this.siren); so2.connect(sg2).connect(this.siren); so.start(); so2.start();
    const sf = ctx.createBiquadFilter(); sf.type = 'bandpass'; sf.frequency.value = 600; sf.Q.value = 0.4;
    this.siren.connect(sf);
    const sdry = ctx.createGain(); sdry.gain.value = 0.25;
    sf.connect(sdry).connect(this.air);
    const swet = ctx.createGain(); swet.gain.value = 0.8;
    sf.connect(swet).connect(this.reverb);

    const external = await this._tryTheme();
    if (!external) this._violin();

    this.ready = true;
    this._tick = setInterval(() => this._events(), 120);
  }

  async _tryTheme() {
    if (!THEME) return false;
    try {
      const r = await fetch(THEME, { method: 'HEAD' });
      if (!r.ok || !(r.headers.get('content-type') || '').startsWith('audio')) return false;
      const el = new Audio(THEME);
      el.loop = true; el.crossOrigin = 'anonymous';
      const src = this.ctx.createMediaElementSource(el);
      const g = this.ctx.createGain(); g.gain.value = 0.9;
      src.connect(g).connect(this.musicBus);
      await el.play();
      this.theme = el;
      return true;
    } catch { return false; }
  }

  /* A bowed string: two saws a few cents apart, a slow vibrato that arrives
     late in the note, and the resonances of a small wooden box. */
  _violin() {
    const ctx = this.ctx;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = o2.type = 'sawtooth'; o2.detune.value = 5;
    const vib = ctx.createOscillator(); vib.frequency.value = 5.3;
    const vg = ctx.createGain(); vg.gain.value = 0;
    vib.connect(vg); vg.connect(o1.detune); vg.connect(o2.detune);
    const env = ctx.createGain(); env.gain.value = 0;
    const mix = ctx.createGain(); mix.gain.value = 0.5;
    o1.connect(mix); o2.connect(mix);
    // the hair on the string
    const bn = ctx.createBufferSource(); bn.buffer = this.noise; bn.loop = true;
    const bf = ctx.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = 2600; bf.Q.value = 0.8;
    const bg = ctx.createGain(); bg.gain.value = 0.035;
    bn.connect(bf).connect(bg).connect(mix); bn.start();

    let node = mix.connect(env);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 190;
    node = node.connect(hp);
    for (const [f, gain, q] of [[290, 6, 3], [520, 5, 3], [1100, 3, 2], [2900, 7, 1.4]]) {
      const p = ctx.createBiquadFilter(); p.type = 'peaking'; p.frequency.value = f; p.gain.value = gain; p.Q.value = q;
      node = node.connect(p);
    }
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4800;
    const out = ctx.createGain(); out.gain.value = 0.16;
    node.connect(lp).connect(out).connect(this.musicBus);
    o1.start(); o2.start(); vib.start();

    /* a voice with no words: the same line an octave lower, through the shape of "ah" */
    const v1 = ctx.createOscillator(), v2 = ctx.createOscillator();
    v1.type = v2.type = 'sawtooth'; v2.detune.value = -7;
    const vvib = ctx.createOscillator(); vvib.frequency.value = 4.8;
    const vvg = ctx.createGain(); vvg.gain.value = 0;
    vvib.connect(vvg); vvg.connect(v1.detune); vvg.connect(v2.detune);
    const venv = ctx.createGain(); venv.gain.value = 0;
    const vsrc = ctx.createGain(); vsrc.gain.value = 0.5;
    v1.connect(vsrc); v2.connect(vsrc);
    const vlp = ctx.createBiquadFilter(); vlp.type = 'lowpass'; vlp.frequency.value = 2600;
    vsrc.connect(vlp);
    for (const [f, gain, q] of [[720, 1.0, 5], [1120, 0.55, 7], [2750, 0.22, 8]]) {
      const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q;
      const g = ctx.createGain(); g.gain.value = gain * 2.4;
      vlp.connect(b).connect(g).connect(venv);
    }
    venv.connect(this.singBus);
    v1.start(); v2.start(); vvib.start();

    let t = ctx.currentTime + 1.5, i = 0, prevRest = true, tune = MELODY;
    const schedule = () => {
      while (t < ctx.currentTime + 1.2) {
        /* at the end of the walk the lament gives way to another tune: let the note die, take a breath, begin */
        const want = this.mood.hope > 0.5 ? HOPE : MELODY;
        if (want !== tune) {
          tune = want; i = 0;
          env.gain.setTargetAtTime(0.0001, t, 0.25); venv.gain.setTargetAtTime(0.0001, t, 0.3);
          prevRest = true; t += BEAT * 1.5;
        }
        const [note, beats] = tune[i];
        const dur = beats * BEAT;
        const next = tune[(i + 1) % tune.length][0];
        if (note) {
          const f = hz(note);
          if (prevRest) { o1.frequency.setValueAtTime(f, t); o2.frequency.setValueAtTime(f, t); }
          else { o1.frequency.setTargetAtTime(f, t, 0.035); o2.frequency.setTargetAtTime(f, t, 0.035); }
          if (prevRest) { env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(0.85, t + 0.3); }
          else { env.gain.setTargetAtTime(0.6, t, 0.025); env.gain.setTargetAtTime(0.9, t + 0.07, 0.14); }
          env.gain.setTargetAtTime(1.0, t + dur * 0.4, dur * 0.3);
          if (!next) env.gain.setTargetAtTime(0.0001, t + dur - 0.5, 0.2);
          vg.gain.setTargetAtTime(3, t, 0.03);
          vg.gain.setTargetAtTime(dur > 1.5 ? 21 : 10, t + 0.3, 0.3);
          /* the voice: slower to speak, and it breathes at the rests */
          const fv = f / 2;
          if (prevRest) { v1.frequency.setValueAtTime(fv, t); v2.frequency.setValueAtTime(fv, t); venv.gain.setValueAtTime(0.0001, t); venv.gain.linearRampToValueAtTime(0.8, t + 0.5); }
          else { v1.frequency.setTargetAtTime(fv, t, 0.07); v2.frequency.setTargetAtTime(fv, t, 0.07); }
          if (!next) venv.gain.setTargetAtTime(0.0001, t + dur - 0.7, 0.28);
          vvg.gain.setTargetAtTime(2, t, 0.05);
          vvg.gain.setTargetAtTime(dur > 1.5 ? 26 : 12, t + 0.4, 0.4);
        }
        prevRest = !note;
        t += dur;
        i = (i + 1) % tune.length;
      }
    };
    schedule();
    this._sched = setInterval(schedule, 300);
  }

  /* where you are standing */
  set(mood) {
    if (!this.ready) return;
    Object.assign(this.mood, mood);
    const t = this.ctx.currentTime, k = 0.6;
    const m = this.mood, h = m.held;
    this.wind.gain.setTargetAtTime(m.wind * 0.3 * (1 - 0.75 * h), t, k);
    this.fire.gain.setTargetAtTime(m.fire * 0.55 * (1 - 0.85 * h), t, h > 0.5 ? 0.15 : k);
    this.crowd.gain.setTargetAtTime(m.crowd * 0.06 * (1 - h), t, k);
    this.drone.gain.setTargetAtTime(m.drone * 0.2 * (1 + 0.5 * h), t, k);
    this.musicBus.gain.setTargetAtTime(m.music * 0.85 * (1 - 0.3 * h), t, k);
    this.singBus.gain.setTargetAtTime(m.sing * 0.42, t, 1.2);
    this.ring.gain.setTargetAtTime(h * 0.085, t, 0.35);
    this.planes.gain.setTargetAtTime(m.planes * 0.5, t, 1.6);
    this.siren.gain.setTargetAtTime(Math.min(1, m.planes * 3) * 0.045, t, 2.5);
    /* underground the world is dull; in held time it is duller still */
    if (this._deaf && t > this._deaf + 6) this._deaf = 0;
    if (!(this._deaf > t)) this.air.frequency.setTargetAtTime(Math.min(16000 - m.muffle * 15450, 16000 - h * 15200), t, h > 0.5 ? 0.12 : (this._deaf ? 1.4 : 0.4));
  }

    mute(on) {
    this.muted = on;
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(on ? 0 : 0.9, this.ctx.currentTime, 0.25);
    if (this.theme) this.theme.muted = on;
  }

  _burst({ type = 'bandpass', freq = 1000, q = 1, gain = 0.2, attack = 0.002, decay = 0.1, dest, pan = 0 }) {
    const ctx = this.ctx, t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    let n = s.connect(f).connect(g);
    if (p) { p.pan.value = pan; n = n.connect(p); }
    n.connect(dest || this.air);
    s.start(t, Math.random() * 3); s.stop(t + attack + decay + 0.05);
  }

  _thump(f0 = 80, f1 = 35, dur = 0.7, gain = 0.5, dest) {
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.air); g.connect(this.reverb);
    o.start(t); o.stop(t + dur + 0.05);
  }

  /* A voice, made the way a throat makes one: a buzz, shaped by three resonances
     that slide from one vowel to the next. Far off and in a street's echo it reads
     as someone calling out. */
  voice({ f0 = 170, lift = 1.2, dur = 0.5, vowels = 'ao', gain = 0.06, pan = 0, wet = 0.7 } = {}) {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const F = { a: [800, 1150, 2900], o: [450, 800, 2830], e: [530, 1840, 2480], i: [300, 2250, 3000], u: [325, 700, 2700] };
    const A = F[vowels[0]] || F.a, B = F[vowels[1]] || A;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.linearRampToValueAtTime(f0 * lift, t + dur * 0.4);
    o.frequency.linearRampToValueAtTime(f0 * 0.84, t + dur);
    const br = ctx.createBufferSource(); br.buffer = this.noise;
    const brf = ctx.createBiquadFilter(); brf.type = 'highpass'; brf.frequency.value = 1800;
    const brg = ctx.createGain(); brg.gain.value = 0.1;
    const pre = ctx.createGain(); pre.gain.value = 1;
    o.connect(pre); br.connect(brf).connect(brg).connect(pre);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + Math.min(0.06, dur * 0.25));
    env.gain.setValueAtTime(gain, t + dur * 0.6);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    [1, 0.6, 0.28].forEach((w, i) => {
      const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = i ? 9 : 6;
      b.frequency.setValueAtTime(A[i], t);
      b.frequency.linearRampToValueAtTime(B[i], t + dur * 0.7);
      const g = ctx.createGain(); g.gain.value = w * 3.2;
      pre.connect(b).connect(g).connect(env);
    });
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    let n = env;
    if (p) { p.pan.value = pan; n = env.connect(p); }
    const dry = ctx.createGain(); dry.gain.value = 1 - wet * 0.6;
    const send = ctx.createGain(); send.gain.value = wet;
    n.connect(dry).connect(this.air);
    n.connect(send).connect(this.reverb);
    o.start(t); br.start(t, Math.random() * 3);
    o.stop(t + dur + 0.05); br.stop(t + dur + 0.05);
  }

  /* the small sounds that come and go on their own */
  _events() {
    if (!this.ready || this.muted || this.ctx.state !== 'running') return;
    const m = this.mood, dt = 0.12;
    const live = m.held < 0.5;
    this._crackle -= dt;
    if (m.fire > 0.05 && live && this._crackle <= 0) {
      this._burst({ type: 'highpass', freq: 1500 + Math.random() * 2500, gain: 0.05 + Math.random() * 0.12 * m.fire, decay: 0.02 + Math.random() * 0.05, pan: Math.random() * 2 - 1 });
      this._crackle = (0.05 + Math.random() * 0.35) / (0.3 + m.fire);
    }
    this._thud -= dt;
    if (m.battle > 0.05 && live && this._thud <= 0) {
      this._thump(60 + Math.random() * 40, 28, 0.9 + Math.random() * 0.8, 0.28 * m.battle);
      this._burst({ type: 'lowpass', freq: 500, gain: 0.2 * m.battle, attack: 0.01, decay: 0.9, dest: this.reverb });
      this._thud = (2.5 + Math.random() * 6) / (0.4 + m.battle);
    }
    this._shot -= dt;
    if (m.battle > 0.3 && live && this._shot <= 0) {
      const r = Math.random(), k = 0.5 + Math.random() * 0.5, pan = Math.random() * 2 - 1;
      if (r < 0.18) this.machineGun(k, pan);
      else if (r < 0.45) { this.shot(k * 0.8, 'pistol', pan); setTimeout(() => this.shot(k * 0.7, 'pistol', pan), 150 + Math.random() * 180); }
      else {
        const n = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) setTimeout(() => this.shot(k, 'rifle', pan + (Math.random() - 0.5) * 0.5), i * (220 + Math.random() * 400));
      }
      this._shot = (0.7 + Math.random() * 2.6) / m.battle;
    }
    /* people calling out in the fight */
    this._shout -= dt;
    if (m.battle > 0.3 && live && this._shout <= 0) {
      const f0 = 170 + Math.random() * 170;
      this.voice({ f0, lift: 1.2 + Math.random() * 0.3, dur: 0.35 + Math.random() * 0.6, vowels: ['ao', 'ea', 'oa', 'aa', 'ei'][Math.floor(Math.random() * 5)], gain: 0.035 + Math.random() * 0.04, pan: Math.random() * 2 - 1, wet: 0.85 });
      this._shout = (1.6 + Math.random() * 4.5) / m.battle;
    }
    /* a full street: voices under one another, none of them clear */
    this._talk -= dt;
    if (m.crowd > 0.1 && live && this._talk <= 0) {
      const f0 = 105 + Math.random() * 170;
      this.voice({ f0, lift: 0.95 + Math.random() * 0.25, dur: 0.18 + Math.random() * 0.4, vowels: 'aoeiu'[Math.floor(Math.random() * 5)] + 'aoeu'[Math.floor(Math.random() * 4)], gain: (0.01 + Math.random() * 0.02) * m.crowd, pan: Math.random() * 2 - 1, wet: 1 });
      this._talk = (0.12 + Math.random() * 0.5) / m.crowd;
    }
    /* water, dripping from the vault into the water below */
    this._drip -= dt;
    if (m.drip > 0.1 && this._drip <= 0) {
      const f = 1400 + Math.random() * 1800;
      this._burst({ type: 'bandpass', freq: f, q: 14, gain: 0.05 * m.drip, attack: 0.002, decay: 0.09, pan: Math.random() * 1.6 - 0.8, dest: this.reverb });
      this._burst({ type: 'bandpass', freq: f * 0.5, q: 9, gain: 0.025 * m.drip, attack: 0.002, decay: 0.05, pan: 0 });
      this._drip = 0.25 + Math.random() * 1.4;
    }
    /* held time has a pulse */
    this._beat -= dt;
    if (!live && this._beat <= 0) {
      this._thump(62, 38, 0.2, 0.3, this.master);
      setTimeout(() => this._thump(54, 34, 0.24, 0.2, this.master), 230);
      this._beat = 1.25;
    }
  }

  /* one shot: the crack, the body of it, and the street giving it back */
  shot(k = 1, kind = 'rifle', pan = Math.random() * 2 - 1) {
    if (!this.ready || this.muted) return;
    const pistol = kind === 'pistol';
    this._burst({ type: 'highpass', freq: pistol ? 2600 : 1700, gain: (pistol ? 0.2 : 0.3) * k, decay: pistol ? 0.03 : 0.05, pan });
    this._burst({ type: 'bandpass', freq: pistol ? 1200 : 650 + Math.random() * 250, q: 0.8, gain: (pistol ? 0.16 : 0.28) * k, decay: pistol ? 0.07 : 0.14, pan });
    if (!pistol) this._thump(150, 55, 0.16, 0.2 * k);
    this._burst({ type: 'bandpass', freq: 620, q: 0.7, gain: 0.16 * k, decay: 0.2, dest: this.echo });
    this._burst({ type: 'lowpass', freq: 1000, gain: 0.1 * k, decay: 0.75, dest: this.reverb });
  }

  machineGun(k = 1, pan = 0) {
    const n = 5 + Math.floor(Math.random() * 6);
    for (let i = 0; i < n; i++) setTimeout(() => this.shot(k * (0.75 + Math.random() * 0.25), 'rifle', pan), i * 98);
  }

  /* time stopping: a shutter, and the air going out of the street. Starting again: the reverse. */
  shutter(stop) {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    if (stop) {
      this._burst({ type: 'highpass', freq: 3000, gain: 0.22, decay: 0.012, dest: this.master });
      setTimeout(() => this._burst({ type: 'bandpass', freq: 1500, q: 2, gain: 0.16, decay: 0.03, dest: this.master }), 70);
    }
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(stop ? 220 : 36, t);
    o.frequency.exponentialRampToValueAtTime(stop ? 36 : 180, t + 1.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.4, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
    o.connect(g); g.connect(this.master); g.connect(this.reverb);
    o.start(t); o.stop(t + 1.2);
    this._burst({ type: 'lowpass', freq: stop ? 2400 : 500, gain: 0.22, attack: stop ? 0.02 : 0.5, decay: stop ? 1.2 : 0.5, dest: this.reverb });
    this._beat = 0.9;
  }

  /* a sound that belongs to a place in the stopped street: what you would have
     heard there, drawn out, as if the moment were still arriving */
  heldSound(kind, pan = 0, near = 1) {
    if (!this.ready || this.muted || kind === 'none') return;
    const g = 0.5 + 0.5 * near, out = this.master;
    if (kind === 'shot') {
      this._burst({ type: 'bandpass', freq: 520 + Math.random() * 300, q: 1.4, gain: 0.3 * g, attack: 0.16, decay: 1.3, pan, dest: out });
      this._burst({ type: 'lowpass', freq: 900, gain: 0.22 * g, attack: 0.3, decay: 2.2, dest: this.reverb });
      this._thump(110, 34, 1.1, 0.24 * g, out);
    } else if (kind === 'mg') {
      for (let i = 0; i < 4; i++) setTimeout(() => {
        this._burst({ type: 'bandpass', freq: 480 + i * 60, q: 1.6, gain: 0.22 * g, attack: 0.12, decay: 0.9, pan, dest: out });
        this._thump(100, 36, 0.8, 0.16 * g, out);
      }, i * 330);
    } else if (kind === 'bottle') {
      this._burst({ type: 'bandpass', freq: 300, q: 0.6, gain: 0.34 * g, attack: 0.5, decay: 1.6, pan, dest: out });
      this._burst({ type: 'bandpass', freq: 2400, q: 6, gain: 0.05 * g, attack: 0.4, decay: 1.2, pan, dest: this.reverb });
    } else if (kind === 'burst') {
      this._burst({ type: 'highpass', freq: 4200, gain: 0.12 * g, attack: 0.05, decay: 1.4, pan, dest: this.reverb });
      this._burst({ type: 'lowpass', freq: 600, gain: 0.34 * g, attack: 0.25, decay: 1.8, pan, dest: out });
    } else {
      /* the gun, and the shell in the wall */
      this._thump(64, 20, 3.4, 0.7 * g, out);
      this._burst({ type: 'lowpass', freq: 420, gain: 0.5 * g, attack: 0.5, decay: 3.2, dest: this.reverb });
      this._burst({ type: 'bandpass', freq: 1400, q: 0.8, gain: 0.1 * g, attack: 0.3, decay: 2.4, pan, dest: this.reverb });
    }
  }

    /* a bottle breaks and the petrol catches */
  shatter() {
    if (!this.ready || this.muted) return;
    this._burst({ type: 'highpass', freq: 3800, gain: 0.16, decay: 0.16, pan: Math.random() * 1.2 - 0.6 });
    this._burst({ type: 'lowpass', freq: 700, gain: 0.3, attack: 0.05, decay: 1.1 });
    this._thump(70, 40, 0.5, 0.16);
  }

  /* the synagogue */
  boom() {
    if (!this.ready || this.muted) return;
    this._thump(58, 22, 3.2, 0.9);
    this._burst({ type: 'lowpass', freq: 900, gain: 0.7, attack: 0.02, decay: 2.6 });
    this._burst({ type: 'lowpass', freq: 300, gain: 0.6, attack: 0.3, decay: 4.5, dest: this.reverb });
  }

  /* the cut from one place to another: one low stroke, and the room it dies in */
  hit() {
    if (!this.ready || this.muted) return;
    this._thump(58, 27, 2.6, 0.42, this.master);
    this._burst({ type: 'lowpass', freq: 240, gain: 0.26, attack: 0.02, decay: 2.4, dest: this.reverb });
  }

  /* a dog barking: a rough voice that drops, through the shape of a throat, and the breath with it */
  bark(pan = 0, far = 0.3, k = 1) {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const g = (1 - far * 0.82) * k;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    const f0 = 250 + Math.random() * 110;
    o.frequency.setValueAtTime(f0 * 1.55, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.6, t + 0.14);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(0.5 * g, t + 0.012); env.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    for (const [f, qq, w] of [[780, 2.4, 1], [1750, 3.2, 0.5], [3100, 4, 0.18]]) {
      const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f * (0.94 + Math.random() * 0.12); b.Q.value = qq;
      const gg = ctx.createGain(); gg.gain.value = w;
      o.connect(b).connect(gg).connect(env);
    }
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    let n = env;
    if (p) { p.pan.value = pan; n = env.connect(p); }
    n.connect(this.air);
    const send = ctx.createGain(); send.gain.value = 0.35 + far * 0.5;
    n.connect(send).connect(this.reverb);
    o.start(t); o.stop(t + 0.22);
    this._burst({ type: 'bandpass', freq: 1150, q: 1.1, gain: 0.2 * g, attack: 0.004, decay: 0.1, pan });
  }

  /* a blast near at hand. The blow of it, the crack, the long roll off the house fronts, what it threw up
     coming down; and then the ears: a thin high note that takes a long time to go, and everything dull under it. */
  blast(k = 1) {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    this._thump(72, 18, 3.8, Math.min(1.1, 0.95 * k), this.master);
    this._thump(150, 42, 0.45, 0.55 * k, this.master);
    this._burst({ type: 'highpass', freq: 1700, gain: 0.5 * k, attack: 0.001, decay: 0.11, dest: this.master });
    this._burst({ type: 'lowpass', freq: 1200, gain: 0.8 * k, attack: 0.008, decay: 2.6, dest: this.master });
    this._burst({ type: 'lowpass', freq: 280, gain: 0.7 * k, attack: 0.22, decay: 5.5, dest: this.reverb });
    for (let i = 0; i < 18; i++) {
      setTimeout(() => {
        if (!this.ready || this.muted) return;
        this._burst({ type: 'bandpass', freq: 450 + Math.random() * 2600, q: 2, gain: (0.03 + Math.random() * 0.07) * k, decay: 0.03 + Math.random() * 0.09, pan: Math.random() * 2 - 1 });
      }, 350 + Math.random() * 2800);
    }
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 3340;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 5120;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.04 * k, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 6);
    const g2 = ctx.createGain(); g2.gain.value = 0.4;
    o.connect(g); o2.connect(g2).connect(g); g.connect(this.master);
    o.start(t); o2.start(t); o.stop(t + 6.1); o2.stop(t + 6.1);
    /* the world comes back slowly */
    this.air.frequency.cancelScheduledValues(t);
    this.air.frequency.setTargetAtTime(520, t + 0.25, 0.08);
    this._deaf = t + 3.4;
  }

  /* a photograph catching: the soft rush of paper taking the flame, and its crackle */
  ignite() {
    if (!this.ready || this.muted) return;
    this._burst({ type: 'bandpass', freq: 900, q: 0.5, gain: 0.12, attack: 0.35, decay: 2.2 });
    this._burst({ type: 'highpass', freq: 3200, gain: 0.05, attack: 0.6, decay: 1.8, dest: this.reverb });
    for (let i = 0; i < 9; i++) setTimeout(() => this._burst({ type: 'highpass', freq: 2600 + Math.random() * 2400, gain: 0.03 + Math.random() * 0.04, decay: 0.02, pan: Math.random() * 1.4 - 0.7 }), 300 + Math.random() * 2200);
  }

  /* a shell bursting high up: a dull bang, a long way off. far: 0 near, 1 at the edge of hearing */
  flak(pan = 0, far = 0.5) {
    if (!this.ready || this.muted) return;
    this._thump(95 - far * 45, 30, 0.7, 0.22 * (1 - far * 0.7));
    this._burst({ type: 'lowpass', freq: 900 - far * 500, gain: 0.14 * (1 - far * 0.6), attack: 0.004, decay: 0.8, pan, dest: this.reverb });
    this._burst({ type: 'bandpass', freq: 500, q: 0.7, gain: 0.05 * (1 - far), decay: 0.25, pan });
  }

  /* the light guns, hammering */
  flakGun(pan = 0) {
    if (!this.ready || this.muted) return;
    const n = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) setTimeout(() => {
      this._burst({ type: 'bandpass', freq: 420, q: 0.9, gain: 0.07, decay: 0.09, pan, dest: this.reverb });
      this._thump(120, 60, 0.09, 0.05);
    }, i * 130);
  }

  /* a bomb, on the far side of the city */
  bomb(pan = 0) {
    if (!this.ready || this.muted) return;
    this._thump(52, 20, 2.6, 0.55);
    this._burst({ type: 'lowpass', freq: 340, gain: 0.4, attack: 0.03, decay: 2.8, pan, dest: this.reverb });
  }

  /* an iron rung under a hand */
  rung() {
    if (!this.ready || this.muted) return;
    this._burst({ type: 'bandpass', freq: 1700 + Math.random() * 500, q: 16, gain: 0.05, attack: 0.002, decay: 0.16, dest: this.reverb });
    this._burst({ type: 'lowpass', freq: 380, gain: 0.05, attack: 0.004, decay: 0.09 });
  }

  /* the iron lid of the manhole, dragged aside */
  scrape() {
    if (!this.ready || this.muted) return;
    this._burst({ type: 'bandpass', freq: 520, q: 3, gain: 0.2, attack: 0.25, decay: 1.5, dest: this.reverb });
    this._burst({ type: 'bandpass', freq: 2100, q: 7, gain: 0.05, attack: 0.3, decay: 1.2, pan: 0.2 });
    setTimeout(() => { if (this.ready && !this.muted) this._thump(130, 48, 0.3, 0.3); }, 1500);
  }

  /* one footstep. indoors: on packed earth. outdoors: on stone. wet: in water */
  /* words coming up on the screen: the keys of a typewriter, a long way off */
  type(n = 20, gap = 0.06) {
    if (!this.ready || this.muted) return;
    const id = (this._typing = (this._typing || 0) + 1);
    const N = Math.min(n, 64);
    for (let i = 0; i < N; i++) {
      setTimeout(() => {
        if (this._typing !== id || this.muted) return;
        this._burst({ type: 'bandpass', freq: 2000 + Math.random() * 1000, q: 3, gain: 0.018 + Math.random() * 0.012, attack: 0.001, decay: 0.02, pan: -0.2 + Math.random() * 0.12 });
        if (Math.random() < 0.3) this._burst({ type: 'lowpass', freq: 360, gain: 0.018, attack: 0.001, decay: 0.03, pan: -0.2 });
      }, 140 + i * gap * 1000 + Math.random() * 20);
    }
  }
  /* a body coming down on its feet */
  thud(k = 1) {
    if (!this.ready || this.muted) return;
    this._thump(95, 42, 0.24, 0.42 * k);
    this._burst({ type: 'lowpass', freq: 600, gain: 0.12 * k, attack: 0.003, decay: 0.12 });
    this._burst({ type: 'bandpass', freq: 1800, q: 1.4, gain: 0.03 * k, decay: 0.06 });
  }
  step(indoors, wet = false) {
    if (!this.ready || this.muted) return;
    if (wet) {
      this._burst({ type: 'bandpass', freq: 700 + Math.random() * 400, q: 1.2, gain: 0.09, attack: 0.01, decay: 0.22, pan: Math.random() * 0.4 - 0.2, dest: this.reverb });
      this._burst({ type: 'highpass', freq: 2600, gain: 0.03, decay: 0.12 });
      return;
    }
    this._burst({ type: 'lowpass', freq: indoors ? 420 : 950, gain: indoors ? 0.07 : 0.055, attack: 0.004, decay: indoors ? 0.11 : 0.07, pan: Math.random() * 0.3 - 0.15 });
    if (!indoors) this._burst({ type: 'bandpass', freq: 2300, q: 2, gain: 0.012, decay: 0.03 });
  }
}
