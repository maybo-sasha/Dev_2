import * as THREE from 'three';

/**
 * Builds and animates a low-poly toy character in Three.js that matches the
 * Blender reference (homePage/1.png – 24.png):
 *  - Red/white striped top, light-blue jeans, teal shoes
 *  - VR headset, brown hair, tan skin
 *  - Floating UI card above head
 *  - Walking cycle animation
 *  - Head tracks the mouse cursor
 *
 * @param {HTMLCanvasElement} canvas  – the canvas to render into
 * @returns {() => void}              – destroy / cleanup function
 */
export default function initCharacter(canvas) {

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ── Scene ─────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Camera ────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0.5, 2.1, 7.5);
    camera.lookAt(0, 1.5, 0);

    // ── Lights ────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 2.2));

    const key = new THREE.DirectionalLight(0xfff5e8, 3.5);
    key.position.set(3, 6, 5);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xaac8ff, 1.2);
    fill.position.set(-4, 2, 2);
    scene.add(fill);

    // ── Toon gradient (3 luminance steps) ────────────────────────────────
    const grad = new THREE.DataTexture(new Uint8Array([64, 160, 255]), 3, 1, THREE.RedFormat);
    grad.needsUpdate = true;

    const toon = (hex) => new THREE.MeshToonMaterial({ color: hex, gradientMap: grad });

    // ── Colour palette (matches the Blender reference) ────────────────────
    const P = {
        skin:  toon(0xd4956a),
        red:   toon(0xe03030),
        white: toon(0xf2f0ee),
        jean:  toon(0x88b8df),
        shoe:  toon(0x3ec9c9),
        hset:  toon(0x18182e),   // VR headset
        hair:  toon(0x6b3a1e),
        dark:  toon(0x22223a),   // stylus
        paper: toon(0xede9e0),   // paper sheets
    };

    // ── Geometry / mesh helpers ───────────────────────────────────────────
    const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const sph = (r, ws = 20, hs = 14) => new THREE.SphereGeometry(r, ws, hs);
    const cyl = (r, h, s = 8) => new THREE.CylinderGeometry(r, r, h, s);

    const mk = (geo, mat) => {
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = true;
        return m;
    };

    // ── Character root (slight profile turn, like the reference) ──────────
    const root = new THREE.Group();
    root.position.set(-0.4, 0, 0);
    root.rotation.y = -0.3;
    scene.add(root);

    // ─── LEGS (pivot group at hip joint so rotation swings the whole leg) ─
    function makeLeg(side) {
        const g = new THREE.Group();
        g.position.set(side * 0.165, 0.64, 0);

        // Upper + lower leg as one box (simplified low-poly look)
        const leg = mk(box(0.185, 0.52, 0.185), P.jean);
        leg.position.y = -0.26;
        g.add(leg);

        // Shoe attached to leg group so it swings with it
        const shoe = mk(box(0.2, 0.1, 0.3), P.shoe);
        shoe.position.set(0, -0.57, 0.06);
        g.add(shoe);

        return g;
    }

    const legL = makeLeg(-1);
    const legR = makeLeg(1);
    root.add(legL, legR);

    // ─── HIPS ─────────────────────────────────────────────────────────────
    const hips = mk(box(0.4, 0.17, 0.2), P.jean);
    hips.position.set(0, 0.635, 0);
    root.add(hips);

    // ─── TORSO (5 horizontal stripes: red / white alternating) ────────────
    const torso = new THREE.Group();
    torso.position.set(0, 0.73, 0);

    [P.red, P.white, P.red, P.white, P.red].forEach((mat, i) => {
        const stripe = mk(box(0.41, 0.1, 0.2), mat);
        stripe.position.y = i * 0.1 + 0.05;
        torso.add(stripe);
    });
    root.add(torso);

    // ─── ARMS (pivot at shoulder, swings in walk) ─────────────────────────
    function makeArm(side) {
        const g = new THREE.Group();
        g.position.set(side * 0.295, 1.2, 0);

        const upper = mk(box(0.13, 0.4, 0.13), P.red);
        upper.position.y = -0.2;
        g.add(upper);

        const hand = mk(sph(0.08, 8, 6), P.skin);
        hand.position.y = -0.44;
        g.add(hand);

        return g;
    }

    const armL = makeArm(-1);
    const armR = makeArm(1);

    // Paper stack in left hand (three slightly offset sheets)
    [P.red, P.white, P.paper].forEach((m, i) => {
        const sheet = mk(box(0.155, 0.02, 0.19), m);
        sheet.position.set(-0.02 + i * 0.008, -0.55 + i * 0.022, 0);
        sheet.rotation.z = 0.18;
        armL.add(sheet);
    });

    // Stylus / pen in right hand
    const stylus = mk(cyl(0.013, 0.28, 8), P.dark);
    stylus.position.set(0.06, -0.58, 0.02);
    stylus.rotation.z = 0.38;
    armR.add(stylus);

    root.add(armL, armR);

    // ─── NECK ─────────────────────────────────────────────────────────────
    const neck = mk(cyl(0.09, 0.12), P.skin);
    neck.position.set(0, 1.3, 0);
    root.add(neck);

    // ─── HEAD ─────────────────────────────────────────────────────────────
    const headG = new THREE.Group();
    headG.position.set(0, 1.66, 0);

    // Head sphere
    headG.add(mk(sph(0.3, 24, 18), P.skin));

    // Ears
    [-0.28, 0.28].forEach(x => {
        const ear = mk(sph(0.09, 8, 6), P.skin);
        ear.position.set(x, 0, 0);
        headG.add(ear);
    });

    // Hair dome (upper hemisphere only, flattened slightly)
    const hairDome = mk(
        new THREE.SphereGeometry(0.315, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
        P.hair
    );
    hairDome.position.y = 0.1;
    headG.add(hairDome);

    // VR headset — main body
    const headset = mk(box(0.54, 0.17, 0.11), P.hset);
    headset.position.set(0, 0.02, 0.28);
    headG.add(headset);

    // Headset top strap
    const hstrap = mk(box(0.6, 0.055, 0.055), P.hset);
    hstrap.position.set(0, 0.13, 0);
    headG.add(hstrap);

    // Lens screens (slight emissive tint so they look lit)
    const lensMat = new THREE.MeshStandardMaterial({
        color: 0x223366,
        emissive: 0x1a2d66,
        roughness: 0.15,
    });
    [-0.135, 0.135].forEach(x => {
        const lens = new THREE.Mesh(box(0.17, 0.1, 0.02), lensMat);
        lens.position.set(x, 0.02, 0.335);
        headG.add(lens);
    });

    root.add(headG);

    // ─── FLOATING UI CARD ─────────────────────────────────────────────────
    const uiG = new THREE.Group();
    uiG.position.set(0.15, 2.6, 0);

    // Draw the card to an offscreen canvas (matches reference design exactly)
    const cc = document.createElement('canvas');
    cc.width = 320; cc.height = 220;
    const cx = cc.getContext('2d');

    // Card background
    cx.fillStyle = '#e8f3fd';
    cx.beginPath();
    cx.roundRect(5, 5, 310, 210, 18);
    cx.fill();

    // Image area (sky)
    cx.fillStyle = '#87ceeb';
    cx.beginPath();
    cx.roundRect(14, 14, 178, 128, 10);
    cx.fill();

    // Mountain 1 (red)
    cx.fillStyle = '#e03030';
    cx.beginPath();
    cx.moveTo(14, 142); cx.lineTo(78, 56); cx.lineTo(142, 142);
    cx.closePath(); cx.fill();

    // Mountain 2 (dark red)
    cx.fillStyle = '#b82020';
    cx.beginPath();
    cx.moveTo(96, 142); cx.lineTo(136, 80); cx.lineTo(176, 142);
    cx.closePath(); cx.fill();

    // Snow cap
    cx.fillStyle = '#f5f5f5';
    cx.beginPath();
    cx.moveTo(78, 56); cx.lineTo(62, 80); cx.lineTo(94, 80);
    cx.closePath(); cx.fill();

    // Sun
    cx.fillStyle = '#ffd54f';
    cx.beginPath();
    cx.arc(166, 34, 13, 0, Math.PI * 2); cx.fill();

    // Three dots on the right
    [['#e03030', 36], ['#43a047', 80], ['#1e88e5', 124]].forEach(([c, y]) => {
        cx.fillStyle = c;
        cx.beginPath();
        cx.arc(224, y, 11, 0, Math.PI * 2); cx.fill();
    });

    // Connection lines below image
    cx.strokeStyle = '#a0bcd0'; cx.lineWidth = 3; cx.lineCap = 'round';
    [[18, 160, 165, 160], [18, 180, 110, 180]].forEach(([x1, y1, x2, y2]) => {
        cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.stroke();
    });

    const cardTex = new THREE.CanvasTexture(cc);
    const card = new THREE.Mesh(
        new THREE.PlaneGeometry(1.28, 0.88),
        new THREE.MeshBasicMaterial({ map: cardTex, transparent: true, depthWrite: false })
    );
    card.rotation.x = -0.1;
    uiG.add(card);

    // Thin stem connecting card bottom to head
    uiG.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -0.44, 0),
            new THREE.Vector3(0, -0.98, 0),
        ]),
        new THREE.LineBasicMaterial({ color: 0x88aabb })
    ));

    root.add(uiG);

    // ── Mouse tracking ────────────────────────────────────────────────────
    const mouse = new THREE.Vector2();
    const onMouse = (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouse);

    // ── Resize ────────────────────────────────────────────────────────────
    function resize() {
        const w = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || canvas.parentElement?.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(document.body);
    resize();

    // ── Animation loop ────────────────────────────────────────────────────
    let rafId;

    function animate(t) {
        rafId = requestAnimationFrame(animate);
        const time = t * 0.001;

        // Walking cycle — legs and counter-swinging arms
        const walk = Math.sin(time * 2.6);
        legL.rotation.x  =  walk * 0.44;
        legR.rotation.x  = -walk * 0.44;
        armL.rotation.x  = -walk * 0.3;
        armR.rotation.x  =  walk * 0.3;

        // Subtle hip / torso counter-rotation
        hips.rotation.z  =  walk * 0.04;
        torso.rotation.z = -walk * 0.03;

        // Vertical bounce (two peaks per stride, like real gait)
        root.position.y = Math.abs(Math.sin(time * 5.2)) * 0.04;

        // Head smoothly tracks mouse
        headG.rotation.y = mouse.x * 0.3;
        headG.rotation.x = -mouse.y * 0.15 - 0.08;

        // UI card floats and sways independently
        uiG.position.y = 2.6 + Math.sin(time * 1.15) * 0.07;
        uiG.rotation.z = Math.sin(time * 0.8) * 0.04;

        renderer.render(scene, camera);
    }

    rafId = requestAnimationFrame(animate);

    // ── Cleanup ───────────────────────────────────────────────────────────
    return function destroy() {
        cancelAnimationFrame(rafId);
        ro.disconnect();
        window.removeEventListener('mousemove', onMouse);
        renderer.dispose();
    };
}
