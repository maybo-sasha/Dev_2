import * as THREE from './three.module.min.js';
import { GLTFLoader } from './GLTFLoader.js';
import glbUrl from '../homePage/v18.glb';

export default function initCharacter(canvas) {

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: true,
        preserveDrawingBuffer: true,   // keeps buffer for accumulation blur
    });
    renderer.setClearColor(0xffffff, 1);
    renderer.autoClear = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ── Accumulation fade quad (motion blur) ──────────────────────────────
    // Each frame fades prev buffer 80% toward white before the scene draws.
    // Fast-moving limbs trail visibly; slow torso stays crisp.
    const fadeScene  = new THREE.Scene();
    const fadeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    fadeScene.add(new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.80,      // lower = longer/stronger trail
            depthTest: false,
            depthWrite: false,
        })
    ));

    // ── Scene & camera ────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
    camera.position.set(0, 2, 6);
    camera.lookAt(0, 1.8, 0);

    // ── Lights ────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const key = new THREE.DirectionalLight(0xfff8f0, 2.0);
    key.position.set(3, 6, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd0e8ff, 0.8);
    fill.position.set(-4, 2, 3);
    scene.add(fill);

    // ── Resize ────────────────────────────────────────────────────────────
    function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    // ── Shadow system ─────────────────────────────────────────────────────
    // One shared soft-radial texture for all shadow meshes (perf: 1 canvas)
    const shadowTex = (() => {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 128;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0,   'rgba(0,0,0,0.75)');
        g.addColorStop(0.45,'rgba(0,0,0,0.30)');
        g.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
    })();

    function makeShadow(w, h, yOffset = 0.01) {
        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            new THREE.MeshBasicMaterial({
                map: shadowTex,
                transparent: true,
                depthWrite: false,
                // draw order prevents Z-fighting between overlapping shadows
            })
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y  = yOffset;
        mesh.renderOrder = yOffset * 1000; // body=10, footL=12, footR=14
        scene.add(mesh);
        return mesh;
    }

    // Body: persistent large ellipse under the whole character
    const bodyShadow  = makeShadow(1,    0.45,  0.010);
    // Feet: smaller, alternating, appear on each footstrike
    const footShadowL = makeShadow(0.55, 0.30,  0.012);
    const footShadowR = makeShadow(0.55, 0.30,  0.014);

    // Shadow anchor data (set when model loads)
    let shadowAnchor = null; // { mx, mz, base }

    // ── Load GLB ──────────────────────────────────────────────────────────
    let mixer = null;
    let model = null;

    const loader = new GLTFLoader();
    loader.load(
        glbUrl,
        (gltf) => {
            model = gltf.scene;

            // Measure model before material pass
            const fullBox    = new THREE.Box3().setFromObject(model);
            const fullHeight = fullBox.getSize(new THREE.Vector3()).y;
            const topThreshold = fullBox.min.y + fullHeight * 0.70;

            // Material pass: hide ground plane, tint bubble, enforce opacity
            model.traverse((child) => {
                if (!child.isMesh) return;

                const s = new THREE.Box3().setFromObject(child).getSize(new THREE.Vector3());
                if (s.y < 0.01 * Math.max(s.x, s.z)) { child.visible = false; return; }

                const mats = Array.isArray(child.material) ? child.material : [child.material];
                const cy   = new THREE.Box3().setFromObject(child).getCenter(new THREE.Vector3()).y;

                mats.forEach(mat => {
                    if (!mat?.color) return;
                    const { r, g, b } = mat.color;
                    if (cy > topThreshold && r > 0.80 && g > 0.80 && b > 0.80) {
                        // Bubble — lamp glow
                        mat.color.set(0xfffbe8);
                        mat.transparent = true;
                        mat.opacity = 0.55;
                        if (mat.emissive) mat.emissive.set(0x553300);
                        mat.emissiveIntensity = 0.6;
                    } else {
                        // Clothing / body — fully opaque
                        mat.transparent = false;
                        mat.opacity = 1.0;
                    }
                });
            });

            // Scale & position
            const box3   = new THREE.Box3().setFromObject(model);
            const size   = box3.getSize(new THREE.Vector3());
            const centre = box3.getCenter(new THREE.Vector3());
            const scale  = 3.5 / Math.max(size.x, size.y, size.z);
            model.scale.setScalar(scale);
            model.position.set(
                -centre.x * scale - 1.2,
                -box3.min.y  * scale,
                -centre.z * scale
            );
            model.rotation.y = 0.25;
            scene.add(model);

            // Anchor shadows to character feet position
            const base = scale * 0.55;
            const mx   = model.position.x;
            const mz   = model.position.z;
            shadowAnchor = { mx, mz, base };
            bodyShadow.position.x  = mx;
            bodyShadow.position.z  = mz;
            footShadowL.position.x = mx - 0.12 * base;
            footShadowL.position.z = mz;
            footShadowR.position.x = mx + 0.12 * base;
            footShadowR.position.z = mz;

            // Play baked walk animation
            if (gltf.animations?.length) {
                mixer = new THREE.AnimationMixer(model);
                gltf.animations.forEach(clip => mixer.clipAction(clip).play());
            }
        },
        undefined,
        (err) => console.error('GLB load error:', err)
    );

    // ── Animation loop ────────────────────────────────────────────────────
    let rafId;
    const clock = new THREE.Clock();

    function animate() {
        rafId = requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const t     = clock.elapsedTime;

        if (mixer) mixer.update(delta);

        // ── Shadow animation ─────────────────────────────────────────────
        if (shadowAnchor) {
            const { mx, mz, base } = shadowAnchor;
            const phase = t * 2.6; // matched to walk cycle frequency

            // Body shadow — breathes with stride (bigger when feet plant)
            const breathe = 0.5 + 0.5 * Math.abs(Math.sin(phase)); // 0.5→1.0
            bodyShadow.scale.x          = base * (0.85 + breathe * 0.20);
            bodyShadow.scale.y          = base * (0.80 + breathe * 0.10);
            bodyShadow.material.opacity = 0.08 + breathe * 0.12;

            // Left foot — dark on plant (sin > 0)
            const lp = Math.max(0, Math.sin(phase));
            footShadowL.scale.x          = base * (0.4 + lp * 0.35);
            footShadowL.scale.y          = base * (0.35 + lp * 0.20);
            footShadowL.material.opacity = lp * 0.50;

            // Right foot — dark on plant (sin < 0), half-cycle offset
            const rp = Math.max(0, -Math.sin(phase));
            footShadowR.scale.x          = base * (0.4 + rp * 0.35);
            footShadowR.scale.y          = base * (0.35 + rp * 0.20);
            footShadowR.material.opacity = rp * 0.50;
        }

        // ── Motion blur render pass ───────────────────────────────────────
        renderer.clearDepth();              // clear depth — keep colour buffer
        renderer.render(fadeScene, fadeCamera); // fade prev frame → white trail
        renderer.render(scene, camera);    // draw current frame on top
    }

    renderer.clear(); // prime with clean white
    rafId = requestAnimationFrame(animate);

    // ── Cleanup ───────────────────────────────────────────────────────────
    return function destroy() {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        shadowTex.dispose();
        renderer.dispose();
    };
}
