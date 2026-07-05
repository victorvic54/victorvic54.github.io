import { useEffect, useRef } from 'react';

// Full-page 3D starfield rendered on a fixed canvas behind the content.
// Stars live in normalized 3D space and are perspective-projected each frame;
// scrolling accelerates them into warp streaks, the pointer adds depth parallax,
// and mid-depth stars are linked into constellations via a spatial grid.
const STAR_TINTS = [
  [255, 255, 255],
  [205, 232, 255],
  [180, 218, 255],
  [196, 186, 255],
  [255, 202, 238],
  [150, 240, 255]
];

export default function CosmicCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars = [];
    let shootingStars = [];
    let nextShootingStar = 2500;
    let rafId = 0;
    let lastTime = performance.now();
    let running = true;

    // Warp state: scroll velocity drives the target speed.
    let speed = 0.045;
    let targetSpeed = 0.045;
    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();

    // Smoothed pointer parallax, in normalized [-1, 1].
    let pointerX = 0;
    let pointerY = 0;
    let smoothX = 0;
    let smoothY = 0;

    const makeStar = (z = Math.random()) => ({
      x: (Math.random() * 2 - 1) * 1.6,
      y: (Math.random() * 2 - 1) * 1.6,
      z: Math.max(0.03, z),
      size: 0.6 + Math.random() * 1.7,
      tint: STAR_TINTS[(Math.random() * STAR_TINTS.length) | 0],
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.4 + Math.random() * 1.8
    });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = coarsePointer ? 4600 : 2900;
      const count = Math.min(coarsePointer ? 280 : 680, Math.round((width * height) / density));
      stars = Array.from({ length: count }, () => makeStar());
    };

    const project = (star) => {
      const focal = Math.min(width, height) * 0.9;
      const parallax = 46 * (1 - star.z);
      return {
        x: width / 2 + (star.x / star.z) * focal * 0.28 + smoothX * parallax,
        y: height / 2 + (star.y / star.z) * focal * 0.28 + smoothY * parallax,
        r: star.size * (1 - star.z) * 2.4
      };
    };

    const drawFrame = (dt, time) => {
      ctx.clearRect(0, 0, width, height);

      smoothX += (pointerX - smoothX) * 0.05;
      smoothY += (pointerY - smoothY) * 0.05;
      speed += (targetSpeed - speed) * 0.055;
      targetSpeed += (0.045 - targetSpeed) * 0.02; // decay back to cruise

      const warping = speed > 0.16;
      const constellationNodes = [];

      for (const star of stars) {
        const prevZ = star.z;
        star.z -= speed * dt;
        if (star.z <= 0.03) {
          Object.assign(star, makeStar(1), { z: 0.95 + Math.random() * 0.05 });
          continue;
        }

        const p = project(star);
        if (p.x < -60 || p.x > width + 60 || p.y < -60 || p.y > height + 60) continue;

        const twinkle = reducedMotion ? 1 : 0.72 + 0.28 * Math.sin(star.twinkle + time * 0.001 * star.twinkleSpeed);
        const alpha = Math.min(1, (1 - star.z) * 1.6) * twinkle;
        const [r, g, b] = star.tint;

        if (warping) {
          // Streak from the star's previous depth position for the warp effect.
          const prev = project({ ...star, z: Math.min(1, prevZ + speed * dt * 6) });
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.85})`;
          ctx.lineWidth = Math.max(0.5, p.r * 0.8);
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.4, p.r), 0, Math.PI * 2);
          ctx.fill();
          // Soft glow halo on the brightest near stars.
          if (p.r > 1.7) {
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.12})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (star.z > 0.3 && star.z < 0.85 && constellationNodes.length < 170) {
          constellationNodes.push({ x: p.x, y: p.y, z: star.z });
        }
      }

      if (!warping) drawConstellations(constellationNodes);
      if (!reducedMotion) updateShootingStars(dt);
    };

    const drawConstellations = (nodes) => {
      const linkDist = coarsePointer ? 90 : 120;
      const cell = linkDist;
      const grid = new Map();
      nodes.forEach((n, i) => {
        const key = `${(n.x / cell) | 0},${(n.y / cell) | 0}`;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(i);
      });

      let links = 0;
      ctx.lineWidth = 0.6;
      for (let i = 0; i < nodes.length && links < 150; i++) {
        const a = nodes[i];
        const cx = (a.x / cell) | 0;
        const cy = (a.y / cell) | 0;
        for (let gx = cx - 1; gx <= cx + 1; gx++) {
          for (let gy = cy - 1; gy <= cy + 1; gy++) {
            const bucket = grid.get(`${gx},${gy}`);
            if (!bucket) continue;
            for (const j of bucket) {
              if (j <= i) continue;
              const b = nodes[j];
              const dx = a.x - b.x;
              const dy = a.y - b.y;
              const dist2 = dx * dx + dy * dy;
              if (dist2 > linkDist * linkDist) continue;
              const alpha = (1 - Math.sqrt(dist2) / linkDist) * 0.16;
              ctx.strokeStyle = `rgba(148, 187, 255, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
              if (++links >= 150) return;
            }
          }
        }
      }
    };

    const updateShootingStars = (dt) => {
      nextShootingStar -= dt * 1000;
      if (nextShootingStar <= 0 && shootingStars.length < 2) {
        const fromLeft = Math.random() > 0.5;
        const angle = fromLeft ? Math.PI / 5 : Math.PI - Math.PI / 5;
        const v = 900 + Math.random() * 600;
        shootingStars.push({
          x: fromLeft ? -40 : width + 40,
          y: Math.random() * height * 0.45,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v,
          life: 1
        });
        nextShootingStar = 3500 + Math.random() * 5500;
      }

      shootingStars = shootingStars.filter((s) => {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt * 0.55;
        if (s.life <= 0) return false;

        const trail = 90 * s.life;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - (s.vx / 900) * trail, s.y - (s.vy / 900) * trail);
        grad.addColorStop(0, `rgba(210, 235, 255, ${0.9 * s.life})`);
        grad.addColorStop(1, 'rgba(210, 235, 255, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - (s.vx / 900) * trail, s.y - (s.vy / 900) * trail);
        ctx.stroke();
        return s.x > -150 && s.x < width + 150 && s.y < height + 150;
      });
    };

    const loop = (time) => {
      if (!running) return;
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      drawFrame(dt, time);
      rafId = requestAnimationFrame(loop);
    };

    const onScroll = () => {
      const now = performance.now();
      const dy = Math.abs(window.scrollY - lastScrollY);
      const dtMs = Math.max(16, now - lastScrollTime);
      const velocity = dy / dtMs; // px per ms
      targetSpeed = Math.min(0.85, 0.045 + velocity * 0.55);
      lastScrollY = window.scrollY;
      lastScrollTime = now;
    };

    const onPointerMove = (e) => {
      pointerX = (e.clientX / width) * 2 - 1;
      pointerY = (e.clientY / height) * 2 - 1;
    };

    const onVisibility = () => {
      running = !document.hidden && !reducedMotion;
      if (running) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(rafId);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    if (reducedMotion) {
      // Static sky: a single frame, no listeners for motion.
      drawFrame(0, 0);
      running = false;
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
      if (!coarsePointer) window.addEventListener('pointermove', onPointerMove, { passive: true });
      document.addEventListener('visibilitychange', onVisibility);
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="cosmic-canvas" aria-hidden="true" />;
}
