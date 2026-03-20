import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const RINGS_CONFIG = [
  { radius: 2.8, tube: 0.008, color: '#00D4FF', opacity: 0.35, axis: 'Z', tiltX: Math.PI / 3 },
  { radius: 3.4, tube: 0.006, color: '#7B2FFF', opacity: 0.2, axis: 'Y', tiltX: -Math.PI / 5 },
  { radius: 2.0, tube: 0.007, color: '#FF6B35', opacity: 0.15, axis: 'X', tiltX: Math.PI / 2 },
];

export default function HeroCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.style.willChange = 'transform';
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Particle Sphere
    const isMobile = window.innerWidth < 768;
    const isLowEnd = navigator.hardwareConcurrency <= 4;
    const PARTICLE_COUNT = isMobile ? 800 : isLowEnd ? 1500 : 2500;
    const SPHERE_RADIUS = 2.2;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const basePos = new Float32Array(PARTICLE_COUNT * 3);
    const cyan = new THREE.Color('#00D4FF');
    const violet = new THREE.Color('#7B2FFF');
    const golden = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const yNorm = 1 - (i / (PARTICLE_COUNT - 1)) * 2;
      const rAtY = Math.sqrt(1 - yNorm * yNorm);
      const theta = golden * i;
      const x = Math.cos(theta) * rAtY * SPHERE_RADIUS;
      const y = yNorm * SPHERE_RADIUS;
      const z = Math.sin(theta) * rAtY * SPHERE_RADIUS;
      positions[i * 3] = basePos[i * 3] = x;
      positions[i * 3 + 1] = basePos[i * 3 + 1] = y;
      positions[i * 3 + 2] = basePos[i * 3 + 2] = z;
      const t = (yNorm + 1) / 2;
      const c = cyan.clone().lerp(violet, t);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    sGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const sMat = new THREE.PointsMaterial({ size: 0.018, vertexColors: true, transparent: true, opacity: 0.85 });
    const particles = new THREE.Points(sGeo, sMat);
    scene.add(particles);

    // Orbit Rings
    const rings = RINGS_CONFIG.map((cfg) => {
      const geo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 8, 100);
      const mat = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: cfg.opacity });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = cfg.tiltX;
      mesh.userData.axis = cfg.axis;
      scene.add(mesh);
      return mesh;
    });

    // Animation loop
    let animId;
    const startTime = performance.now();
    const RING_SPEED = 0.004;
    
    let lastFrameTime = 0;
    const TARGET_FPS = isMobile ? 30 : 60;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    const animate = (now) => {
      animId = requestAnimationFrame(animate);
      if (!now) now = performance.now();
      if (now - lastFrameTime < FRAME_INTERVAL) return;
      lastFrameTime = now;
      
      const t = (performance.now() - startTime) / 1000;

      // Wave on particles
      const posAttr = sGeo.attributes.position;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const bx = basePos[i * 3], by = basePos[i * 3 + 1], bz = basePos[i * 3 + 2];
        const dist = Math.sqrt(bx * bx + by * by + bz * bz);
        const wave = Math.sin(dist * 1.8 - t * 2) * 0.08;
        posAttr.setXYZ(i, bx * (1 + wave / SPHERE_RADIUS), by * (1 + wave / SPHERE_RADIUS), bz * (1 + wave / SPHERE_RADIUS));
      }
      posAttr.needsUpdate = true;
      particles.rotation.y += 0.003;
      particles.rotation.x = Math.sin(t * 0.3) * 0.1;

      // Rings
      rings.forEach((ring) => {
        if (ring.userData.axis === 'Z') ring.rotation.z += RING_SPEED;
        if (ring.userData.axis === 'Y') ring.rotation.y += RING_SPEED * 0.7;
        if (ring.userData.axis === 'X') ring.rotation.x += RING_SPEED * 1.2;
      });

      renderer.render(scene, camera);
    };
    animate(performance.now());

    const handleVisibility = () => {
      if (document.hidden) cancelAnimationFrame(animId);
      else animate(performance.now());
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Resize
    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      sGeo.dispose(); sMat.dispose();
      rings.forEach((r) => { r.geometry.dispose(); r.material.dispose(); });
      renderer.dispose();
      scene.clear();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
