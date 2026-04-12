// WebGL hover effect — fullscreen canvas, one plane per image card.
// Uses globals: THREE, gsap (loaded via CDN)

function initHoverEffects() {
    if (typeof THREE === 'undefined') return;

    const cards = document.querySelectorAll('.project-card');
    if (!cards.length) return;

    // ── Renderer ────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;border-radius:0;';
    document.body.appendChild(renderer.domElement);

    // ── Scene + perspective camera ──────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    const camDist = 600;
    camera.position.z = camDist;

    // ── Render target for post-processing pass ──────────────────────────
    const rt = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

    // ── Post-process: chromatic aberration effect ───────────────────────
    const postUniforms = {
        tDiffuse:   { value: rt.texture },
        uMouse:     { value: new THREE.Vector2(-10, -10) },
        uVelo:      { value: 0.0 },
        resolution: { value: new THREE.Vector2(1, window.innerHeight / window.innerWidth) },
    };
    const postScene  = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    postScene.add(new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({
            uniforms: postUniforms,
            vertexShader: `
                varying vec2 vUv;
                void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform vec2 uMouse;
                uniform float uVelo;
                uniform vec2 resolution;
                varying vec2 vUv;

                float circle(vec2 uv, vec2 disc_center, float disc_radius, float border_size) {
                    uv -= disc_center;
                    uv *= resolution;
                    float dist = sqrt(dot(uv, uv));
                    return smoothstep(disc_radius + border_size, disc_radius - border_size, dist);
                }

                void main() {
                    vec2 newUV = vUv;
                    float c = circle(newUV, uMouse, 0.0, 0.2);
                    float r = texture2D(tDiffuse, newUV.xy += c * (uVelo * 0.5  )).x;
                    float g = texture2D(tDiffuse, newUV.xy += c * (uVelo * 0.525)).y;
                    float b = texture2D(tDiffuse, newUV.xy += c * (uVelo * 0.55 )).z;
                    // Preserve RT alpha so DOM titles/particles show through empty areas
                    float a = texture2D(tDiffuse, vUv).w;
                    gl_FragColor = vec4(r, g, b, a);
                }
            `,
        })
    ));

    // ── Per-card image planes ───────────────────────────────────────────
    // Each uses a ShaderMaterial with uReveal for the bottom-to-top mask animation.
    const items = [];

    cards.forEach(card => {
        const wrap  = card.querySelector('.project-img-wrap');
        const imgEl = card.querySelector('.project-img-wrap img');
        if (!wrap || !imgEl) return;

        // Hide the DOM img immediately — WebGL takes over
        imgEl.style.opacity = '0';

        const mat = new THREE.ShaderMaterial({
            uniforms: {
                tMap:         { value: null },
                uReveal:      { value: 0.0 }, // 0 = hidden, 1 = fully revealed
                uDir:         { value: 1.0 }, // 1 = bottom-to-top, -1 = top-to-bottom
                uScrollVelo:  { value: 0.0 }, // signed, smoothed scroll velocity
            },
            transparent: true,
            vertexShader: `
                uniform float uScrollVelo;
                varying vec2 vUv;
                const float PI = 3.14159265;

                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    // sin peaks at vertical centre, zero at top/bottom corners
                    // → left and right borders bow gently, corners stay pinned
                    float bend = sin(uv.y * PI) * uScrollVelo * 0.002;
                    pos.x += bend;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tMap;
                uniform float uReveal;
                uniform float uDir;
                varying vec2 vUv;

                void main() {
                    vec4 color = texture2D(tMap, vUv);
                    float rev = clamp(uReveal, 0.0, 1.0);
                    // uDir = 1: bottom-to-top (scroll down), vUv.y=0 is bottom
                    // uDir =-1: top-to-bottom (scroll up),   flip the UV
                    float uvY = uDir > 0.0 ? vUv.y : 1.0 - vUv.y;
                    float mask = step(uvY, rev);
                    gl_FragColor = vec4(color.rgb, color.a * mask);
                }
            `,
        });

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 32, 32), mat);
        scene.add(mesh);

        const item = { wrap, imgEl, mesh, mat, loaded: false, pendingReveal: false };
        items.push(item);

        // Load texture — if a reveal was already requested, play it now
        new THREE.TextureLoader().load(imgEl.src, tex => {
            tex.minFilter = THREE.LinearFilter;
            mat.uniforms.tMap.value = tex;
            item.loaded = true;
            if (item.pendingReveal) playReveal(item);
        });

        // Re-trigger on every scroll into view; direction from entry position
        const io = new IntersectionObserver(entries => {
            const entry = entries[0];
            gsap.killTweensOf(item.mat.uniforms.uReveal);
            if (entry.isIntersecting) {
                // Element entered from below → scrolling down → bottom-to-top
                // Element entered from above → scrolling up  → top-to-bottom
                item.mat.uniforms.uDir.value = entry.boundingClientRect.top >= 0 ? 1.0 : -1.0;
                item.mat.uniforms.uReveal.value = 0;
                if (item.loaded) playReveal(item);
                else item.pendingReveal = true;
            } else {
                item.mat.uniforms.uReveal.value = 0;
                item.pendingReveal = false;
            }
        }, { threshold: 0.1 });
        io.observe(wrap);
    });

    function playReveal(item) {
        item.pendingReveal = false;
        gsap.to(item.mat.uniforms.uReveal, {
            value: 1,
            duration: 0.9,
            ease: 'expo.out',
        });
    }

    // ── First image reveal on load ──────────────────────────────────────
    // Fires after a short settle delay so the canvas is ready
    function triggerFirstReveal() {
        const first = items[0];
        if (!first) return;
        first.mat.uniforms.uDir.value = 1.0; // bottom-to-top on load
        first.mat.uniforms.uReveal.value = 0;
        if (first.loaded) playReveal(first);
        else first.pendingReveal = true;
    }
    setTimeout(triggerFirstReveal, 400);

    // ── Position meshes to match wrap bounds ────────────────────────────
    function updateMeshes() {
        const vFOV = camera.fov * Math.PI / 180;
        const visH = 2 * Math.tan(vFOV / 2) * camDist;
        const visW = visH * camera.aspect;

        items.forEach(({ wrap, mesh }) => {
            const rect = wrap.getBoundingClientRect();
            const W = rect.width, H = rect.height;
            mesh.scale.set(
                (W / window.innerWidth)  * visW,
                (H / window.innerHeight) * visH,
                1
            );
            mesh.position.x = (( rect.left + W / 2) / window.innerWidth  - 0.5) * visW;
            mesh.position.y = (0.5 - (rect.top  + H / 2) / window.innerHeight) * visH;
        });
    }

    // ── Scroll velocity tracking ────────────────────────────────────────
    let prevScrollY    = window.scrollY;
    let rawScrollVelo  = 0;
    let smoothScrollVelo = 0;

    // ── Mouse / speed tracking ──────────────────────────────────────────
    const mouse       = new THREE.Vector2(-10, -10);
    const followMouse = new THREE.Vector2(-10, -10);
    const prevMouse   = new THREE.Vector2(-10, -10);
    let   targetSpeed = 0;

    window.addEventListener('mousemove', e => {
        mouse.x =       e.clientX / window.innerWidth;
        mouse.y = 1.0 - e.clientY / window.innerHeight;
    });

    // ── Resize ──────────────────────────────────────────────────────────
    window.addEventListener('resize', () => {
        const w = window.innerWidth, h = window.innerHeight;
        renderer.setSize(w, h);
        rt.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        postUniforms.resolution.value.set(1, h / w);
    });

    // ── Render loop ─────────────────────────────────────────────────────
    function render() {
        updateMeshes(); // sync with Lenis CSS transform every frame

        const speed = Math.sqrt(
            Math.pow(prevMouse.x - mouse.x, 2) +
            Math.pow(prevMouse.y - mouse.y, 2)
        );
        targetSpeed -= 0.1 * (targetSpeed - speed);
        followMouse.x -= 0.1 * (followMouse.x - mouse.x);
        followMouse.y -= 0.1 * (followMouse.y - mouse.y);
        prevMouse.copy(mouse);

        postUniforms.uMouse.value.copy(followMouse);
        postUniforms.uVelo.value = Math.min(targetSpeed, 0.05);
        targetSpeed *= 0.999;

        // Scroll velocity → paper bend
        const curScrollY = window.scrollY;
        rawScrollVelo = curScrollY - prevScrollY;
        prevScrollY   = curScrollY;
        smoothScrollVelo += (rawScrollVelo - smoothScrollVelo) * 0.008;
        smoothScrollVelo *= 0.985; // dampen to zero when scroll stops
        items.forEach(({ mat: m }) => { m.uniforms.uScrollVelo.value = smoothScrollVelo; });

        renderer.setRenderTarget(rt);
        renderer.render(scene, camera);

        renderer.setRenderTarget(null);
        renderer.render(postScene, postCamera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
