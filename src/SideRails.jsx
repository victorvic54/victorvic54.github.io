import { useEffect, useRef, useState } from 'react';

// Desktop-only side rails that fill the empty gutters beside the content:
// left — a click-to-shoot asteroid mini-game; right — an ambient cosmic scene
// with a scroll-driven rocket. Both render only on wide screens with a fine
// pointer and no reduced-motion preference, and never overlap the content.
const RAIL_QUERY = '(min-width: 1460px) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

const SPARK_COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#fbbf24', '#f8fafc'];

const readBest = () => {
  try {
    return Number(localStorage.getItem('vv-asteroid-best')) || 0;
  } catch {
    return 0;
  }
};

const storeBest = (value) => {
  try {
    localStorage.setItem('vv-asteroid-best', String(value));
  } catch {
    /* private mode — session best only */
  }
};

export default function SideRails() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(RAIL_QUERY);
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <AsteroidRail />
      <AmbientRail />
    </>
  );
}

/* ------------------------------------------------------------------------
   Left rail: asteroid blaster. A turret at the bottom of the gutter fires a
   laser at wherever you click; drifting asteroids burst into sparks on hit.
   ------------------------------------------------------------------------ */
function AsteroidRail() {
  const railRef = useRef(null);
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(readBest);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const rail = railRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let rafId = 0;
    let running = true;
    let lastTime = performance.now();

    let asteroids = [];
    let lasers = [];
    let sparks = [];
    let ripples = [];
    let floaters = [];
    let spawnIn = 600;
    let tally = 0;
    let bestTally = readBest();
    const aim = { x: 80, y: 200 };

    const makeAsteroid = (y) => {
      const r = 13 + Math.random() * 15;
      const points = 9;
      return {
        x: r + 8 + Math.random() * Math.max(10, width - 2 * (r + 8)),
        y: y ?? -r * 2,
        r,
        vx: (Math.random() - 0.5) * 14,
        vy: 24 + Math.random() * 30,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 1.6,
        verts: Array.from({ length: points }, () => 0.72 + Math.random() * 0.42)
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rail.clientWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      aim.x = width / 2;
      aim.y = height * 0.4;
    };

    const turretPos = () => ({ x: width / 2, y: height - 46 });

    const explode = (a) => {
      for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const v = 40 + Math.random() * 150;
        sparks.push({
          x: a.x,
          y: a.y,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v,
          life: 0.6 + Math.random() * 0.4,
          size: 1 + Math.random() * 2.2,
          color: SPARK_COLORS[(Math.random() * SPARK_COLORS.length) | 0]
        });
      }
      floaters.push({ x: a.x, y: a.y, life: 1 });
    };

    const fire = (x, y) => {
      const t = turretPos();
      lasers.push({ x0: t.x, y0: t.y - 16, x1: x, y1: y, life: 1 });

      let hit = false;
      asteroids = asteroids.filter((a) => {
        const dx = a.x - x;
        const dy = a.y - y;
        if (dx * dx + dy * dy <= (a.r + 11) * (a.r + 11)) {
          explode(a);
          hit = true;
          return false;
        }
        return true;
      });

      if (hit) {
        tally += 1;
        setScore(tally);
        setShowHint(false);
        if (tally > bestTally) {
          bestTally = tally;
          setBest(bestTally);
          storeBest(bestTally);
        }
      } else {
        ripples.push({ x, y, life: 1 });
      }
    };

    const drawAsteroid = (a) => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      ctx.beginPath();
      a.verts.forEach((k, i) => {
        const angle = (i / a.verts.length) * Math.PI * 2;
        const px = Math.cos(angle) * a.r * k;
        const py = Math.sin(angle) * a.r * k;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(116, 124, 154, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(180, 195, 240, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Craters
      ctx.fillStyle = 'rgba(24, 28, 52, 0.5)';
      ctx.beginPath();
      ctx.arc(-a.r * 0.3, -a.r * 0.15, a.r * 0.22, 0, Math.PI * 2);
      ctx.arc(a.r * 0.28, a.r * 0.3, a.r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawTurret = () => {
      const t = turretPos();
      const angle = Math.atan2(aim.y - t.y, aim.x - t.x);

      ctx.save();
      ctx.translate(t.x, t.y);
      // Base glow
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
      glow.addColorStop(0, 'rgba(34, 211, 238, 0.35)');
      glow.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      // Barrel, tracking the pointer
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = 'rgba(148, 163, 255, 0.9)';
      ctx.fillRect(0, -2.5, 22, 5);
      ctx.restore();
      // Dome
      ctx.fillStyle = '#131a3a';
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 11, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const drawFrame = (dt) => {
      ctx.clearRect(0, 0, width, height);

      spawnIn -= dt * 1000;
      if (spawnIn <= 0 && asteroids.length < 5) {
        asteroids.push(makeAsteroid());
        spawnIn = 1500 + Math.random() * 2200;
      }

      ripples = ripples.filter((r) => {
        r.life -= dt * 2.4;
        if (r.life <= 0) return false;
        ctx.strokeStyle = `rgba(148, 187, 255, ${r.life * 0.5})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(r.x, r.y, (1 - r.life) * 26 + 4, 0, Math.PI * 2);
        ctx.stroke();
        return true;
      });

      lasers = lasers.filter((l) => {
        l.life -= dt * 7;
        if (l.life <= 0) return false;
        ctx.strokeStyle = `rgba(34, 211, 238, ${l.life * 0.28})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(l.x0, l.y0);
        ctx.lineTo(l.x1, l.y1);
        ctx.stroke();
        ctx.strokeStyle = `rgba(224, 250, 255, ${l.life})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        return true;
      });

      asteroids = asteroids.filter((a) => {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.rot += a.vrot * dt;
        if (a.x < a.r * 0.5) a.vx = Math.abs(a.vx);
        if (a.x > width - a.r * 0.5) a.vx = -Math.abs(a.vx);
        if (a.y > height + a.r * 2) return false;
        drawAsteroid(a);
        return true;
      });

      sparks = sparks.filter((s) => {
        s.life -= dt * 1.6;
        if (s.life <= 0) return false;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 60 * dt;
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      });

      floaters = floaters.filter((f) => {
        f.life -= dt * 1.1;
        if (f.life <= 0) return false;
        f.y -= 26 * dt;
        ctx.globalAlpha = Math.max(0, f.life);
        ctx.fillStyle = '#a5f3fc';
        ctx.font = '600 13px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('+1', f.x, f.y);
        ctx.globalAlpha = 1;
        return true;
      });

      drawTurret();
    };

    const loop = (time) => {
      if (!running) return;
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      drawFrame(dt);
      rafId = requestAnimationFrame(loop);
    };

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      aim.x = e.clientX - rect.left;
      aim.y = e.clientY - rect.top;
    };

    const onPointerDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      fire(e.clientX - rect.left, e.clientY - rect.top);
    };

    const onVisibility = () => {
      running = !document.hidden;
      if (running) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(rafId);
      }
    };

    resize();
    // Seed a few rocks so the rail isn't empty on load.
    asteroids = [makeAsteroid(height * 0.15), makeAsteroid(height * 0.35), makeAsteroid(height * 0.55)];

    window.addEventListener('resize', resize);
    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('visibilitychange', onVisibility);
    rafId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="side-rail rail-left" ref={railRef}>
      <canvas ref={canvasRef} className="asteroid-canvas" aria-hidden="true" />
      {showHint && <div className="rail-hint">⌖ shoot the asteroids</div>}
      <div className="rail-score">
        <span className="rail-score-value">☄ {score}</span>
        <span className="rail-score-best">best {best}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------
   Right rail: ringed planet with an orbiting moon, pulsing beacons, and a
   rocket that climbs the gutter as you scroll down the page. The rocket is
   the door to the arcade: after 5s a "click me!" bubble appears, and
   clicking it launches the rocket and flies you to /games/.
   ------------------------------------------------------------------------ */
function AmbientRail() {
  const rocketRef = useRef(null);
  const [showBubble, setShowBubble] = useState(false);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let rafId = 0;
    let current = 78;

    const loop = () => {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / max));
      const target = 78 - progress * 56; // 78vh at top of page → 22vh at bottom
      current += (target - current) * 0.06;
      if (rocketRef.current) rocketRef.current.style.top = `${current}vh`;
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const launch = () => {
    if (launching) return;
    setLaunching(true);
    setShowBubble(false);
    // Let the lift-off animation play before leaving the page.
    setTimeout(() => {
      window.location.href = '/games/';
    }, 950);
  };

  return (
    <div className="side-rail rail-right">
      <div className="planet-wrap" aria-hidden="true">
        <div className="planet">
          <span className="planet-ring" />
          <span className="planet-moon" />
        </div>
      </div>

      <div className={`rail-rocket ${launching ? 'launching' : ''}`} ref={rocketRef}>
        {showBubble && !launching && (
          <button className="rocket-bubble" onClick={launch}>
            click me!
          </button>
        )}
        <button
          className="rail-rocket-body"
          onClick={launch}
          aria-label="Launch the rocket and open the VV Arcade games page"
          title="Fly to the games page"
        >
          <svg width="30" height="46" viewBox="0 0 30 46" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="vv-rocket-hull" x1="7" y1="0" x2="23" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#f1f5f9" />
                <stop offset="1" stopColor="#8e9ab8" />
              </linearGradient>
            </defs>
            <path d="M8 32 L2 42 L8.5 39.5 Z" fill="#a78bfa" />
            <path d="M22 32 L28 42 L21.5 39.5 Z" fill="#a78bfa" />
            <path
              d="M15 1 C19.5 7 23 15 23 25 L23 40 L7 40 L7 25 C7 15 10.5 7 15 1 Z"
              fill="url(#vv-rocket-hull)"
              stroke="rgba(148, 163, 255, 0.55)"
            />
            <circle cx="15" cy="18" r="4.4" fill="#0a0d1f" stroke="#22d3ee" strokeWidth="1.6" />
            <rect x="10" y="40" width="10" height="3.5" rx="1.2" fill="#2b3358" />
          </svg>
          <span className="rocket-flame" />
        </button>
      </div>

      <span className="beacon beacon-1" aria-hidden="true" />
      <span className="beacon beacon-2" aria-hidden="true" />
      <span className="beacon beacon-3" aria-hidden="true" />
    </div>
  );
}
