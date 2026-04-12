/**
 * characterRocket.js
 * Procedural Three.js scene: v18-style character (no bubble, no props)
 * seated on a low-poly rocket — same toon style, same isometric angle.
 * Drop-in replacement API: export default function initCharacter(canvas)
 */
import * as THREE from './three.module.min.js';

export default function initCharacter(canvas) {
    console.log('[characterRocket] init called, canvas:', canvas);

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
        canvas, alpha: false, antialias: true, preserveDrawingBuffer: true,
    });
    renderer.setClearColor(0xffffff, 1);
    renderer.autoClear = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Motion-blur accumulation quad
    const fadeScene  = new THREE.Scene();
    const fadeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    fadeScene.add(new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.82,
            depthTest: false, depthWrite: false,
        })
    ));

    // ── Scene & Camera ────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
    camera.position.set(0, 2, 6);
    camera.lookAt(0, 1.8, 0);

    // ── Lights ────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.3));
    const key = new THREE.DirectionalLight(0xfff8f0, 2.2);
    key.position.set(3, 6, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.9);
    fill.position.set(-4, 2, 2);
    scene.add(fill);

    // ── Resize ────────────────────────────────────────────────────────────
    function resize() {
        const w = window.innerWidth, h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    // ── Material helpers ──────────────────────────────────────────────────
    const grad = new THREE.DataTexture(
        new Uint8Array([55, 148, 255]), 3, 1, THREE.RedFormat
    );
    grad.needsUpdate = true;
    const toon = (hex, opts = {}) =>
        new THREE.MeshToonMaterial({ color: hex, gradientMap: grad, ...opts });

    const P = {
        skin:   toon(0xd4956a),
        red:    toon(0xe03030),
        white:  toon(0xf2f0ee),
        jean:   toon(0x88b8df),
        shoe:   toon(0x3ec9c9),
        hair:   toon(0x6b3a1e),
        hset:   toon(0x18182e),
        // Rocket
        rBody:  toon(0xededed),           // light grey body
        rRed:   toon(0xe03030),           // matching red accent
        rDark:  toon(0x2a2a3a),           // nozzle / dark parts
        rGold:  toon(0xf5c842),           // trim ring
    };

    // ── Geometry helpers ──────────────────────────────────────────────────
    const box  = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const sph  = (r, ws=20, hs=14) => new THREE.SphereGeometry(r, ws, hs);
    const cyl  = (rt, rb, h, s=8) => new THREE.CylinderGeometry(rt, rb, h, s);
    const cone = (r, h, s=8)      => new THREE.ConeGeometry(r, h, s);
    const mk   = (geo, mat)       => new THREE.Mesh(geo, mat);

    // ── Assembly root (whole thing bobs) ─────────────────────────────────
    const assembly = new THREE.Group();
    assembly.position.set(-1.0, 0.3, 0);  // slightly left, above ground
    assembly.rotation.y = 0.25;            // same isometric angle as v18
    scene.add(assembly);

    // ──────────────────────────────────────────────────────────────────────
    // ROCKET
    // ──────────────────────────────────────────────────────────────────────
    const rocket = new THREE.Group();
    rocket.rotation.z = -0.15;  // slight lean — adds dynamism
    assembly.add(rocket);

    // Nose cone
    const noseCone = mk(cone(0.28, 0.62, 8), P.rRed);
    noseCone.position.y = 1.21;
    rocket.add(noseCone);

    // Body
    const rBody = mk(cyl(0.28, 0.28, 1.2, 8), P.rBody);
    rBody.position.y = 0.5;
    rocket.add(rBody);

    // Red stripe band (middle)
    const band = mk(cyl(0.285, 0.285, 0.12, 8), P.rRed);
    band.position.y = 0.55;
    rocket.add(band);

    // Gold trim ring (top of body)
    const trimTop = mk(cyl(0.29, 0.29, 0.05, 8), P.rGold);
    trimTop.position.y = 1.1;
    rocket.add(trimTop);

    // Nozzle
    const nozzle = mk(cyl(0.18, 0.26, 0.22, 8), P.rDark);
    nozzle.position.y = -0.21;
    rocket.add(nozzle);

    // Three fins (evenly spaced around body)
    for (let i = 0; i < 3; i++) {
        const fin = new THREE.Group();
        fin.rotation.y = (i / 3) * Math.PI * 2;

        const finMesh = mk(box(0.08, 0.38, 0.32), P.rRed);
        finMesh.position.set(0.26, -0.02, 0.12);
        fin.add(finMesh);

        rocket.add(fin);
    }

    // ── Flames (non-toon so they can glow) ───────────────────────────────
    const flameOuter = mk(
        cone(0.20, 0.70, 8),
        new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.75 })
    );
    flameOuter.position.y = -0.62;
    flameOuter.rotation.z = Math.PI; // point downward
    rocket.add(flameOuter);

    const flameMid = mk(
        cone(0.12, 0.52, 8),
        new THREE.MeshBasicMaterial({ color: 0xffee55, transparent: true, opacity: 0.85 })
    );
    flameMid.position.y = -0.58;
    flameMid.rotation.z = Math.PI;
    rocket.add(flameMid);

    const flameCore = mk(
        cone(0.06, 0.32, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })
    );
    flameCore.position.y = -0.54;
    flameCore.rotation.z = Math.PI;
    rocket.add(flameCore);

    // ──────────────────────────────────────────────────────────────────────
    // CHARACTER  (seated — no bubble, no laptop, no phone)
    // ──────────────────────────────────────────────────────────────────────
    const char = new THREE.Group();
    // Sit on top of the rocket body (just below nose cone junction)
    char.position.y = 1.05;
    assembly.add(char);

    // LEGS — bent forward for seated pose (thigh horizontal, calf drops down)
    function makeLeg(side) {
        const hip = new THREE.Group();
        hip.position.set(side * 0.17, 0, 0);

        // Thigh: extends forward (rotated 90° on X)
        const thigh = mk(box(0.185, 0.30, 0.185), P.jean);
        thigh.position.set(0, 0, 0.165);   // forward
        thigh.rotation.x = Math.PI * 0.5;
        hip.add(thigh);

        // Calf: hangs from knee
        const calf = mk(box(0.18, 0.28, 0.18), P.jean);
        calf.position.set(0, -0.16, 0.34);
        hip.add(calf);

        // Shoe at the bottom of calf
        const shoe = mk(box(0.22, 0.1, 0.30), P.shoe);
        shoe.position.set(0, -0.32, 0.37);
        hip.add(shoe);

        return hip;
    }
    const legL = makeLeg(-1);
    const legR = makeLeg(1);
    char.add(legL, legR);

    // HIPS
    const hips = mk(box(0.42, 0.17, 0.22), P.jean);
    hips.position.set(0, -0.05, 0);
    char.add(hips);

    // TORSO — 5 red/white stripes
    const torso = new THREE.Group();
    torso.position.set(0, 0.08, 0);
    [P.red, P.white, P.red, P.white, P.red].forEach((mat, i) => {
        const stripe = mk(box(0.42, 0.10, 0.22), mat);
        stripe.position.y = i * 0.10 + 0.05;
        torso.add(stripe);
    });
    char.add(torso);

    // ARMS — slightly spread + angled back, gripping sides
    function makeArm(side) {
        const g = new THREE.Group();
        g.position.set(side * 0.30, 0.55, 0);
        g.rotation.z = side * 0.35;   // angle away from body
        g.rotation.x = 0.28;          // lean back (holding rocket)

        const upper = mk(box(0.13, 0.38, 0.13), P.red);
        upper.position.y = -0.19;
        g.add(upper);

        const hand = mk(sph(0.08, 8, 6), P.skin);
        hand.position.y = -0.42;
        g.add(hand);

        return g;
    }
    char.add(makeArm(-1), makeArm(1));

    // NECK
    const neck = mk(cyl(0.09, 0.09, 0.12), P.skin);
    neck.position.set(0, 0.64, 0);
    char.add(neck);

    // HEAD
    const headG = new THREE.Group();
    headG.position.set(0, 0.98, 0);
    char.add(headG);

    headG.add(mk(sph(0.30, 24, 18), P.skin));

    // Ears
    [-0.28, 0.28].forEach(x => {
        const ear = mk(sph(0.09, 8, 6), P.skin);
        ear.position.set(x, 0, 0);
        headG.add(ear);
    });

    // Hair dome
    const hairDome = mk(
        new THREE.SphereGeometry(0.315, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
        P.hair
    );
    hairDome.position.y = 0.10;
    headG.add(hairDome);

    // VR Headset
    const headset = mk(box(0.55, 0.18, 0.12), P.hset);
    headset.position.set(0, 0.02, 0.28);
    headG.add(headset);

    const hstrap = mk(box(0.60, 0.055, 0.055), P.hset);
    hstrap.position.set(0, 0.13, 0);
    headG.add(hstrap);

    const lensMat = new THREE.MeshStandardMaterial({
        color: 0x223366, emissive: 0x1a2d66, roughness: 0.15,
    });
    [-0.135, 0.135].forEach(x => {
        const lens = mk(box(0.17, 0.10, 0.02), lensMat);
        lens.position.set(x, 0.02, 0.335);
        headG.add(lens);
    });

    // ── Exhaust particle ring (decorative dots around flame) ──────────────
    const ringGeo  = new THREE.SphereGeometry(0.05, 6, 6);
    const ringMat  = new THREE.MeshBasicMaterial({ color: 0xff7700 });
    const particles = [];
    for (let i = 0; i < 6; i++) {
        const p = mk(ringGeo, ringMat);
        const a = (i / 6) * Math.PI * 2;
        p.position.set(Math.cos(a) * 0.18, -0.6, Math.sin(a) * 0.18);
        rocket.add(p);
        particles.push({ mesh: p, angle: a });
    }

    // ── Animation loop ────────────────────────────────────────────────────
    let rafId;
    const clock = new THREE.Clock();

    function animate() {
        rafId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const t     = clock.elapsedTime;

        // Assembly bobs and sways gently (floating on rocket)
        assembly.position.y = 0.3 + Math.sin(t * 1.4) * 0.06;
        assembly.rotation.z = Math.sin(t * 0.9) * 0.025;

        // Rocket tilt wiggles slightly (thrust effect)
        rocket.rotation.z = -0.15 + Math.sin(t * 3.5) * 0.015;

        // Flames flicker fast
        const flicker = 0.85 + Math.sin(t * 18) * 0.18 + Math.sin(t * 11) * 0.08;
        flameOuter.scale.set(1, flicker, 1);
        flameMid.scale.set(1, flicker * 1.05, 1);
        flameCore.scale.set(1, flicker * 1.10, 1);
        flameOuter.material.opacity = 0.55 + Math.sin(t * 15) * 0.15;

        // Exhaust particles orbit + pulse
        particles.forEach((p, i) => {
            p.angle += delta * 2.8;
            p.mesh.position.x = Math.cos(p.angle) * 0.18;
            p.mesh.position.z = Math.sin(p.angle) * 0.18;
            p.mesh.position.y = -0.55 - Math.abs(Math.sin(t * 8 + i)) * 0.15;
            p.mesh.scale.setScalar(0.6 + Math.sin(t * 10 + i) * 0.4);
        });

        // Head subtle tilt (excitement)
        headG.rotation.z = Math.sin(t * 1.8) * 0.04;
        headG.rotation.x = -0.08 + Math.sin(t * 1.2) * 0.03;

        // Motion blur: fade → draw
        renderer.clearDepth();
        renderer.render(fadeScene, fadeCamera);
        renderer.render(scene, camera);
    }

    renderer.clear();
    rafId = requestAnimationFrame(animate);

    // ── Cleanup ───────────────────────────────────────────────────────────
    return function destroy() {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        renderer.dispose();
    };
}
