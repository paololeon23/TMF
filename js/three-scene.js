/* ============================================================
   COPA MUNDIAL TMF 2026 — Three.js ambient stadium scene
   - Tilted football field with neon line marks
   - Stadium lights (lens flares simulated with point lights)
   - Floating particles (audience / fireworks)
   - Reactive to mouse + scroll
   ============================================================ */

(function () {
  if (!window.THREE) return;

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  // --- Capability detection ---------------------------------------------
  const isMobile  = matchMedia('(max-width: 768px)').matches;
  const lowMem    = (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const lowCores  = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  const reduceMo  = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LOW_PERF  = isMobile || lowMem || lowCores || reduceMo;

  const PARTICLE_COUNT = LOW_PERF ? 250 : 600;
  const BALL_COUNT     = LOW_PERF ? 0   : 4;
  const DPR_CAP        = LOW_PERF ? 1   : 1.5;

  // --- Renderer ----------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !LOW_PERF,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, DPR_CAP));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  // --- Scene + camera ----------------------------------------------------
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060a, 0.035);

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    300
  );
  camera.position.set(0, 8, 22);
  camera.lookAt(0, 0, 0);

  // --- Lights ------------------------------------------------------------
  const ambient = new THREE.AmbientLight(0x4466aa, 0.45);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(10, 20, 10);
  scene.add(dir);

  // Stadium colored point lights
  const lightColors = [0x00d4ff, 0x39ff14, 0xffd166, 0xff2b5b];
  const points = [];
  for (let i = 0; i < 4; i++) {
    const p = new THREE.PointLight(lightColors[i], 2.4, 40, 2);
    const ang = (i / 4) * Math.PI * 2;
    p.position.set(Math.cos(ang) * 18, 10, Math.sin(ang) * 18);
    scene.add(p);
    points.push(p);
  }

  // --- Football field ----------------------------------------------------
  const fieldGroup = new THREE.Group();

  // Pitch
  const pitchGeom = new THREE.PlaneGeometry(40, 24, 1, 1);
  const pitchMat = new THREE.MeshStandardMaterial({
    color: 0x0d1f0e,
    roughness: 0.8,
    metalness: 0.05,
    emissive: 0x0a1a0a,
    emissiveIntensity: 0.25
  });
  const pitch = new THREE.Mesh(pitchGeom, pitchMat);
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.y = -2;
  fieldGroup.add(pitch);

  // Pitch stripes (alternating darker rectangles)
  for (let i = 0; i < 8; i++) {
    if (i % 2 === 0) continue;
    const stripeGeom = new THREE.PlaneGeometry(40, 3);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0x114a23,
      transparent: true,
      opacity: 0.55,
      emissive: 0x0e3d1a,
      emissiveIntensity: 0.15
    });
    const s = new THREE.Mesh(stripeGeom, stripeMat);
    s.rotation.x = -Math.PI / 2;
    s.position.set(0, -1.99, -12 + i * 3);
    fieldGroup.add(s);
  }

  // Field lines (neon)
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x00d4ff,
    transparent: true,
    opacity: 0.55
  });
  const lineGreen = new THREE.LineBasicMaterial({
    color: 0x39ff14,
    transparent: true,
    opacity: 0.5
  });

  function addLine(points, mat) {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    fieldGroup.add(new THREE.Line(geo, mat));
  }

  // Outline
  addLine([
    new THREE.Vector3(-20, -1.95, -12),
    new THREE.Vector3( 20, -1.95, -12),
    new THREE.Vector3( 20, -1.95,  12),
    new THREE.Vector3(-20, -1.95,  12),
    new THREE.Vector3(-20, -1.95, -12),
  ], lineMat);

  // Center line
  addLine([
    new THREE.Vector3(0, -1.95, -12),
    new THREE.Vector3(0, -1.95,  12),
  ], lineMat);

  // Center circle
  const circlePoints = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    circlePoints.push(new THREE.Vector3(Math.cos(a) * 4, -1.95, Math.sin(a) * 4));
  }
  addLine(circlePoints, lineGreen);

  // Center dot
  const dotGeom = new THREE.CircleGeometry(0.25, 16);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x39ff14 });
  const dot = new THREE.Mesh(dotGeom, dotMat);
  dot.rotation.x = -Math.PI / 2;
  dot.position.y = -1.94;
  fieldGroup.add(dot);

  // Penalty boxes (left + right)
  function addBox(x) {
    addLine([
      new THREE.Vector3(x, -1.95, -8),
      new THREE.Vector3(x + Math.sign(x) * -8, -1.95, -8),
      new THREE.Vector3(x + Math.sign(x) * -8, -1.95,  8),
      new THREE.Vector3(x, -1.95,  8),
    ], lineMat);
  }
  addBox(-20);
  addBox( 20);

  fieldGroup.rotation.x = 0.18;
  fieldGroup.position.y = -2.5;
  scene.add(fieldGroup);

  // --- Stadium ring (audience / seats) ----------------------------------
  const ringGeom = new THREE.TorusGeometry(28, 3, 18, 96);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x101225,
    roughness: 0.95,
    metalness: 0.1,
    emissive: 0x00d4ff,
    emissiveIntensity: 0.05
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 3;
  scene.add(ring);

  // --- Tall stadium light poles ----------------------------------------
  function makePole(x, z) {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.6, metalness: 0.6 })
    );
    pole.position.y = 4;
    group.add(pole);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.2, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfff7d6,
        emissiveIntensity: 1.6
      })
    );
    head.position.y = 10.4;
    head.lookAt(0, 2, 0);
    group.add(head);

    group.position.set(x, -2, z);
    return group;
  }

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    scene.add(makePole(Math.cos(a) * 22, Math.sin(a) * 16));
  }

  // --- Particles (fireworks / floating sparks) -------------------------
  const PCOUNT = PARTICLE_COUNT;
  const positions = new Float32Array(PCOUNT * 3);
  const colors = new Float32Array(PCOUNT * 3);
  const sizes = new Float32Array(PCOUNT);
  const speeds = new Float32Array(PCOUNT);

  const palette = [
    new THREE.Color(0x00d4ff),
    new THREE.Color(0x39ff14),
    new THREE.Color(0xffd166),
    new THREE.Color(0xffffff),
  ];

  for (let i = 0; i < PCOUNT; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 1] = Math.random() * 40 - 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

    const c = palette[(Math.random() * palette.length) | 0];
    colors[i * 3 + 0] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = Math.random() * 0.18 + 0.05;
    speeds[i] = Math.random() * 0.02 + 0.005;
  }

  const pGeom = new THREE.BufferGeometry();
  pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  pGeom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Soft round sprite via canvas texture
  const dotCanvas = document.createElement('canvas');
  dotCanvas.width = dotCanvas.height = 64;
  const dctx = dotCanvas.getContext('2d');
  const grad = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  dctx.fillStyle = grad;
  dctx.fillRect(0, 0, 64, 64);
  const dotTex = new THREE.CanvasTexture(dotCanvas);

  const pMat = new THREE.PointsMaterial({
    size: 0.28,
    sizeAttenuation: true,
    map: dotTex,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.95
  });

  const particles = new THREE.Points(pGeom, pMat);
  scene.add(particles);

  // --- Floating glowing footballs --------------------------------------
  const balls = [];
  for (let i = 0; i < BALL_COUNT; i++) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.1
      })
    );
    m.position.set(
      (Math.random() - 0.5) * 30,
      Math.random() * 10 + 2,
      (Math.random() - 0.5) * 20 - 5
    );
    m.userData = {
      speed: Math.random() * 0.4 + 0.2,
      offset: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.005
    };
    scene.add(m);
    balls.push(m);
  }

  // --- Mouse + scroll interaction --------------------------------------
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollY = 0;

  // Throttled mousemove via rAF
  let mouseDirty = false;
  window.addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    mouseDirty = true;
  }, { passive: true });

  let scrollDirty = false;
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    scrollDirty = true;
  }, { passive: true });

  // Pause scene when hero is not visible (huge perf win while scrolling)
  let heroInView = true;
  const hero = document.getElementById('hero');
  if (hero && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      heroInView = entries[0].isIntersecting;
    }, { threshold: 0.05, rootMargin: '120px 0px' });
    obs.observe(hero);
  }

  // Debounced resize
  let resizeT = null;
  function onResize() {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 120);
  }
  window.addEventListener('resize', onResize);

  // --- Animate ----------------------------------------------------------
  let raf = 0;
  let visible = true;
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
  });

  const clock = new THREE.Clock();
  const PARTICLE_STRIDE = LOW_PERF ? 3 : 2;
  let frame = 0;

  function tick() {
    raf = requestAnimationFrame(tick);
    if (!visible || !heroInView) return;
    frame++;

    const t = clock.getElapsedTime();

    // Smooth mouse
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;

    // Camera parallax + scroll-driven rise (only update on dirty)
    const scrollFactor = Math.min(scrollY / 1500, 1);
    camera.position.x = mouse.x * 3.5;
    camera.position.y = 8 + mouse.y * -1.8 + scrollFactor * 6;
    camera.position.z = 22 - scrollFactor * 4;
    camera.lookAt(0, 0 + scrollFactor * 2, 0);

    // Field tilt (cheap)
    fieldGroup.rotation.y = Math.sin(t * 0.1) * 0.08 + mouse.x * 0.15;
    fieldGroup.rotation.x = 0.18 + Math.sin(t * 0.13) * 0.03;

    // Ring slow rotation
    ring.rotation.z = t * 0.03;

    // Point lights pulsing — every 2nd frame
    if (frame % 2 === 0) {
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.intensity = 1.6 + Math.sin(t * 1.2 + i) * 0.8;
        const a = (i / 4) * Math.PI * 2 + t * 0.05;
        p.position.x = Math.cos(a) * 18;
        p.position.z = Math.sin(a) * 18;
      }
    }

    // Particles drift — only update a slice per frame to avoid per-frame buffer cost
    const pos = particles.geometry.attributes.position.array;
    const start = (frame % PARTICLE_STRIDE);
    for (let i = start; i < PCOUNT; i += PARTICLE_STRIDE) {
      const ix = i * 3;
      pos[ix + 1] += speeds[i] * PARTICLE_STRIDE;
      if (pos[ix + 1] > 35) pos[ix + 1] = -5;
    }
    particles.geometry.attributes.position.needsUpdate = true;
    particles.rotation.y = t * 0.02;

    // Glowing balls bobbing
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      b.position.y += Math.sin(t * b.userData.speed + b.userData.offset) * 0.01;
      b.position.x += b.userData.drift;
      b.rotation.x += 0.012;
      b.rotation.y += 0.01;
      if (b.position.x > 20 || b.position.x < -20) b.userData.drift *= -1;
    }

    mouseDirty = false;
    scrollDirty = false;
    renderer.render(scene, camera);
  }

  tick();

  // Cleanup on unload
  window.addEventListener('beforeunload', () => cancelAnimationFrame(raf));

  // Expose for main.js if needed
  window.__TMF_SCENE__ = { scene, camera, renderer };
})();
