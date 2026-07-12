import { useEffect, useRef, useState } from 'react';
import { playSwipe, playDeathHit, startMusic, stopMusic, isMuted, setMuted } from './audio';

// Mr. Oops!!
// A stickman on a grid dodges lane-based hazards that telegraph with flashing edge arrows.
// Pure canvas rendering driven by a fixed requestAnimationFrame loop; React
// only handles the HUD and overlays.

const GRID = 8; // cells per side
const CELL = 60; // px per cell (logical, pre-DPR)
const PAD = 60; // gutter around the board where warning arrows live
const SIZE = GRID * CELL + PAD * 2;

const STEP_ANIM_MS = 92; // per-cell hop animation
const COUNTDOWN_MS = 1500;
const RAMP_SECONDS = 80; // normal mode: time to reach late-game intensity

// The spawner keeps a target number of simultaneous hazards on the board:
// ~1-2 early in normal mode, ~5 at late game, with rare surges to 6-7.
// Hard mode starts at late-game intensity immediately.
const MAX_HAZARDS = 7;
const BASE_COUNT = [1.4, 5]; // [start, late game] concurrent hazards
const SPAWN_TICK_MS = 460; // how often the spawner tops the arena up
const WAVE_MILESTONE = 100; // every N waves: +1 permanent hazard + board callout

// Key handling: first press steps instantly; auto-repeat starts only after the
// key has been held for the (user-adjustable) resistance delay, then repeats
// at a steady rate.
const REPEAT_MS = 110;
export const REPEAT_DELAY_RANGE = [120, 500];
export const DEFAULT_REPEAT_DELAY = 260;

// Physics/tuning per mode. [start, atMaxDifficulty] pairs lerp with difficulty.
// `count`/`maxHazards` override the global concurrency defaults: stones roll
// slowly but crowd the board, cannons stay sparser but scream past.
const CFG = {
  stones: {
    warnMs: 750,
    speed: [2.6, 4.4], // cells per second
    radius: 0.38, // in cell units
    count: [6, 18],
    maxHazards: 24,
    tickMs: 380 // fast restock so the boulder flow never lulls
  },
  cannons: {
    warnMs: 560,
    speed: [6.5, 11.5],
    radius: 0.3,
    count: [3.2, 11.3],
    maxHazards: 15,
    tickMs: 400
  },
  laser: {
    warnMs: 900,
    fireMs: 440
  }
};

const THEMES = {
  stones: { accent: '#fb923c', board: '#fdfdfb', frame: '#f97316' },
  cannons: { accent: '#ef4444', board: '#fcfcfd', frame: '#94a3b8' },
  laser: { accent: '#f59e0b', board: '#fffdf8', frame: '#fbbf24' }
};

const DIRS = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0]
};

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const easeOut = (t) => 1 - (1 - t) * (1 - t);

const bestKey = (mode, difficulty) =>
  `vv-oops-best-${mode}${difficulty === 'hard' ? '-hard' : ''}`;

export const readBest = (mode, difficulty) => {
  try {
    return Number(localStorage.getItem(bestKey(mode, difficulty))) || 0;
  } catch {
    return 0;
  }
};

const storeBest = (mode, difficulty, value) => {
  try {
    localStorage.setItem(bestKey(mode, difficulty), String(value));
  } catch {
    /* private mode — session best only */
  }
};

export const readRepeatDelay = () => {
  try {
    const v = Number(localStorage.getItem('vv-oops-repeat-delay'));
    return v >= REPEAT_DELAY_RANGE[0] && v <= REPEAT_DELAY_RANGE[1] ? v : DEFAULT_REPEAT_DELAY;
  } catch {
    return DEFAULT_REPEAT_DELAY;
  }
};

export const storeRepeatDelay = (value) => {
  try {
    localStorage.setItem('vv-oops-repeat-delay', String(value));
  } catch {
    /* private mode — session setting only */
  }
};

export default function MrOops({ modeKey, difficulty, title, onExit }) {
  const canvasRef = useRef(null);
  const scoreRef = useRef(null);
  const waveRef = useRef(null);
  const [phase, setPhase] = useState('countdown'); // countdown | playing | dead
  const [result, setResult] = useState(null); // { score, best, isNew }
  const [best, setBest] = useState(() => readBest(modeKey, difficulty));
  const [runId, setRunId] = useState(0);
  const [muted, setMutedState] = useState(isMuted);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cfg = CFG[modeKey];
    const theme = THEMES[modeKey];
    const repeatDelay = readRepeatDelay();
    const hard = difficulty === 'hard';

    let rafId = 0;
    let running = true;
    let last = performance.now();
    let phaseL = 'countdown';
    let countdownT = COUNTDOWN_MS;
    let elapsed = 0; // seconds survived
    let spawnT = 700; // delay before first wave after GO
    // A wave is one spawn period — each cycle in which the group of concurrent
    // hazards is sent at the player. Every 100 waves the group grows by one.
    let waves = 0;
    let milestone = null; // { value, t } — board-center callout on each 100th wave
    let shake = 0;
    let deadT = 0;

    let warns = []; // { axis, lane, dir, t, total, diff }
    let balls = []; // { axis, lane, dir, p, v, r, rot, craters }
    let beams = []; // { axis, lane, t, total }
    let parts = []; // death particles

    const player = {
      tx: 3,
      ty: 3, // logical target cell
      fx: 3.5,
      fy: 3.5, // hop start point (center coords)
      animT: STEP_ANIM_MS,
      moveCd: 0,
      leanX: 0,
      leanY: 0,
      walk: 0,
      alive: true
    };
    const held = []; // stack of held direction key codes, most recent last

    const renderPos = () => {
      const t = easeOut(clamp(player.animT / STEP_ANIM_MS, 0, 1));
      return {
        x: lerp(player.fx, player.tx + 0.5, t),
        y: lerp(player.fy, player.ty + 0.5, t)
      };
    };

    const tryStep = (dx, dy, cooldown = REPEAT_MS) => {
      if (!player.alive) return;
      const nx = clamp(player.tx + dx, 0, GRID - 1);
      const ny = clamp(player.ty + dy, 0, GRID - 1);
      player.moveCd = cooldown;
      if (nx === player.tx && ny === player.ty) return;
      const pos = renderPos();
      player.fx = pos.x;
      player.fy = pos.y;
      player.tx = nx;
      player.ty = ny;
      player.animT = 0;
      player.leanX = dx;
      player.leanY = dy;
      playSwipe();
    };

    const onKeyDown = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onExit();
        return;
      }
      if (phaseL === 'dead' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR')) {
        e.preventDefault();
        setRunId((r) => r + 1);
        return;
      }
      const dir = DIRS[e.code];
      if (!dir) return;
      e.preventDefault();
      if (e.repeat) return;
      const idx = held.indexOf(e.code);
      if (idx !== -1) held.splice(idx, 1);
      held.push(e.code);
      // Step now; further steps only after the resistance delay elapses.
      tryStep(dir[0], dir[1], repeatDelay);
    };

    const onKeyUp = (e) => {
      const idx = held.indexOf(e.code);
      if (idx !== -1) held.splice(idx, 1);
    };

    /* ---------------------------- spawning ---------------------------- */

    const spawnOne = (diff) => {
      const axis = Math.random() < 0.5 ? 'row' : 'col';
      let lane = (Math.random() * GRID) | 0;
      if (modeKey === 'laser') {
        // Avoid stacking a laser onto a lane that is already telegraphed/firing.
        const busy = new Set(
          [...warns, ...beams].filter((h) => h.axis === axis).map((h) => h.lane)
        );
        for (let i = 0; i < GRID && busy.has(lane); i++) lane = (lane + 1) % GRID;
        if (busy.has(lane)) return;
      }
      const dir = Math.random() < 0.5 ? 1 : -1;
      warns.push({ axis, lane, dir, t: cfg.warnMs, total: cfg.warnMs, diff });
    };

    const advanceWave = () => {
      waves++;
      const waveEl = waveRef.current;
      if (!waveEl) return;
      waveEl.textContent = String(waves);
      if (waves % WAVE_MILESTONE === 0) {
        // Milestone: one more permanent hazard — pulse the counter and
        // announce the wave number on the board.
        milestone = { value: waves, t: 2200 };
        const chip = waveEl.closest('.oops-hud-wave');
        if (chip) {
          chip.classList.remove('wave-bump');
          void chip.offsetWidth; // restart the animation
          chip.classList.add('wave-bump');
        }
      }
    };

    const activeHazards = () => warns.length + balls.length + beams.length;

    // Keep the arena stocked to a difficulty-driven concurrent-hazard target:
    // ~1-2 at the start of normal mode, ~5 late game, rare surges to 6-7.
    const topUpHazards = (diff) => {
      const [countLo, countHi] = cfg.count ?? BASE_COUNT;
      const surgeRoll = Math.random();
      const surge = surgeRoll < 0.03 * diff ? 2 : surgeRoll < 0.15 * diff ? 1 : 0;
      // Every 100 waves survived adds one permanent hazard (and lifts the cap).
      const waveBonus = Math.floor(waves / WAVE_MILESTONE);
      const target = Math.min(
        (cfg.maxHazards ?? MAX_HAZARDS) + waveBonus,
        Math.round(lerp(countLo, countHi, diff)) + surge + waveBonus
      );
      // Cap per-tick additions so a wall of hazards never appears all at once,
      // but scale the cap with the target so dense modes keep a steady flow.
      const perTick = Math.max(3, Math.ceil(target / 4));
      const deficit = Math.min(perTick, target - activeHazards());
      for (let i = 0; i < deficit; i++) spawnOne(diff);
    };

    const makeBall = (w, offset = 0) => ({
      axis: w.axis,
      lane: w.lane,
      dir: w.dir,
      p: (w.dir > 0 ? -0.8 : GRID + 0.8) - w.dir * offset,
      v: lerp(cfg.speed[0], cfg.speed[1], w.diff) * (0.9 + Math.random() * 0.2),
      r: cfg.radius,
      rot: Math.random() * Math.PI * 2,
      craters: Array.from({ length: 5 }, () => ({
        a: Math.random() * Math.PI * 2,
        d: Math.random() * 0.55,
        r: 0.09 + Math.random() * 0.09
      }))
    });

    const fireWarn = (w) => {
      if (modeKey === 'laser') {
        beams.push({ axis: w.axis, lane: w.lane, t: cfg.fireMs, total: cfg.fireMs });
      } else {
        balls.push(makeBall(w));
        // Iron cannons occasionally fire a two-shot volley down the same lane.
        if (
          modeKey === 'cannons' &&
          w.diff > 0.35 &&
          Math.random() < 0.35 &&
          activeHazards() < (cfg.maxHazards ?? MAX_HAZARDS)
        ) {
          balls.push(makeBall(w, 1.7));
        }
      }
    };

    /* ----------------------------- death ------------------------------ */

    const die = () => {
      player.alive = false;
      phaseL = 'dead';
      deadT = 0;
      shake = 11;
      // Slam cue on the fatal hit, then cut the soundtrack for the game-over screen.
      playDeathHit();
      stopMusic();
      const pos = renderPos();
      const px = PAD + pos.x * CELL;
      const py = PAD + pos.y * CELL;
      for (let i = 0; i < 22; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 60 + Math.random() * 200;
        parts.push({
          x: px,
          y: py,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 70,
          life: 0.45 + Math.random() * 0.5,
          color: ['#ef4444', '#f97316', '#fbbf24', '#16181d'][(Math.random() * 4) | 0]
        });
      }
      const score = Math.round(elapsed * 10) / 10;
      const prev = readBest(modeKey, difficulty);
      const isNew = score > prev;
      if (isNew) storeBest(modeKey, difficulty, score);
      setBest(isNew ? score : prev);
      setResult({ score, waves, best: isNew ? score : prev, isNew });
      setPhase('dead');
    };

    /* ----------------------------- update ----------------------------- */

    const update = (dt, dtMs) => {
      player.animT += dtMs;
      player.moveCd -= dtMs;
      if (player.alive && held.length && player.moveCd <= 0) {
        const dir = DIRS[held[held.length - 1]];
        tryStep(dir[0], dir[1]);
      }
      const moving = player.animT < STEP_ANIM_MS;
      player.walk = moving ? player.walk + dt * 22 : 0;

      if (phaseL === 'countdown') {
        countdownT -= dtMs;
        if (countdownT <= 0) {
          phaseL = 'playing';
          setPhase('playing');
        }
        return;
      }

      if (phaseL === 'playing') {
        elapsed += dt;
        if (scoreRef.current) scoreRef.current.textContent = elapsed.toFixed(1);
        const diff = hard ? 1 : Math.min(1, elapsed / RAMP_SECONDS);
        spawnT -= dtMs;
        if (spawnT <= 0) {
          advanceWave();
          topUpHazards(diff);
          spawnT = (cfg.tickMs ?? SPAWN_TICK_MS) * (0.75 + Math.random() * 0.5);
        }
      }

      warns = warns.filter((w) => {
        w.t -= dtMs;
        if (w.t > 0) return true;
        fireWarn(w);
        return false;
      });

      const pos = renderPos();
      balls = balls.filter((b) => {
        b.p += b.v * b.dir * dt;
        b.rot += (b.v * dt) / b.r * b.dir * (b.axis === 'row' ? 1 : -1);
        if (player.alive) {
          const bx = b.axis === 'row' ? b.p : b.lane + 0.5;
          const by = b.axis === 'row' ? b.lane + 0.5 : b.p;
          const dx = bx - pos.x;
          const dy = by - pos.y;
          if (dx * dx + dy * dy < (b.r + 0.22) * (b.r + 0.22)) die();
        }
        return b.p > -1.5 && b.p < GRID + 1.5;
      });

      beams = beams.filter((bm) => {
        bm.t -= dtMs;
        if (player.alive && bm.t < bm.total - 60 && bm.t > 80) {
          const laneCoord = bm.axis === 'row' ? pos.y : pos.x;
          if (Math.abs(laneCoord - (bm.lane + 0.5)) < 0.38) die();
        }
        return bm.t > 0;
      });

      parts = parts.filter((p) => {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 320 * dt;
        return p.life > 0;
      });

      if (milestone) {
        milestone.t -= dtMs;
        if (milestone.t <= 0) milestone = null;
      }

      if (phaseL === 'dead') deadT += dtMs;
      shake *= Math.exp(-6 * dt);
    };

    /* ----------------------------- drawing ---------------------------- */

    const drawBoard = () => {
      // Gutter zone — pale grid like the original's outer margin.
      ctx.fillStyle = '#e9ebee';
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.strokeStyle = '#d7dade';
      ctx.lineWidth = 1;
      for (let i = 0; i <= SIZE; i += CELL) {
        ctx.beginPath();
        ctx.moveTo(i + 0.5, 0);
        ctx.lineTo(i + 0.5, SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i + 0.5);
        ctx.lineTo(SIZE, i + 0.5);
        ctx.stroke();
      }

      // Playfield with a soft drop shadow.
      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.25)';
      ctx.shadowBlur = 22;
      ctx.fillStyle = theme.board;
      ctx.fillRect(PAD, PAD, GRID * CELL, GRID * CELL);
      ctx.restore();

      ctx.strokeStyle = '#dee1e6';
      for (let i = 1; i < GRID; i++) {
        ctx.beginPath();
        ctx.moveTo(PAD + i * CELL + 0.5, PAD);
        ctx.lineTo(PAD + i * CELL + 0.5, PAD + GRID * CELL);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(PAD, PAD + i * CELL + 0.5);
        ctx.lineTo(PAD + GRID * CELL, PAD + i * CELL + 0.5);
        ctx.stroke();
      }

      // Mode-accent boundary ring.
      ctx.strokeStyle = theme.frame;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(PAD - 4, PAD - 4, GRID * CELL + 8, GRID * CELL + 8);
    };

    // Watermark callout behind the action on each 100th wave: fades in fast,
    // holds at 40% opacity, fades out.
    const drawMilestone = () => {
      if (!milestone) return;
      const a = 0.4 * clamp(Math.min((2200 - milestone.t) / 200, milestone.t / 500), 0, 1);
      ctx.fillStyle = `rgba(22, 24, 29, ${a})`;
      ctx.font = "700 34px 'Space Grotesk', 'Segoe UI', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('WAVE', SIZE / 2, SIZE / 2 - 34);
      ctx.font = "700 96px 'Space Grotesk', 'Segoe UI', sans-serif";
      ctx.fillText(String(milestone.value), SIZE / 2, SIZE / 2 + 58);
    };

    const laneCenter = (lane) => PAD + (lane + 0.5) * CELL;

    const drawArrow = (w, time) => {
      const along = laneCenter(w.lane);
      const edge = w.dir > 0 ? PAD - 26 : SIZE - PAD + 26;
      const x = w.axis === 'row' ? edge : along;
      const y = w.axis === 'row' ? along : edge;
      const angle =
        w.axis === 'row' ? (w.dir > 0 ? 0 : Math.PI) : w.dir > 0 ? Math.PI / 2 : -Math.PI / 2;

      const blink = 0.55 + 0.45 * Math.sin(time * 0.022);
      const nudge = 3 * Math.sin(time * 0.012);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.translate(nudge, 0);
      ctx.globalAlpha = blink;

      ctx.beginPath();
      ctx.moveTo(-26, -7);
      ctx.lineTo(-2, -7);
      ctx.lineTo(-2, -14);
      ctx.lineTo(17, 0);
      ctx.lineTo(-2, 14);
      ctx.lineTo(-2, 7);
      ctx.lineTo(-26, 7);
      ctx.closePath();

      const grad = ctx.createLinearGradient(-26, 0, 17, 0);
      grad.addColorStop(0, '#fb923c');
      grad.addColorStop(1, '#dc2626');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Laser warnings also tint the doomed lane.
      if (modeKey === 'laser') {
        const pulse = 0.05 + 0.06 * Math.sin(time * 0.02);
        ctx.fillStyle = `rgba(251, 146, 60, ${pulse})`;
        if (w.axis === 'row') {
          ctx.fillRect(PAD, laneCenter(w.lane) - CELL / 2, GRID * CELL, CELL);
        } else {
          ctx.fillRect(laneCenter(w.lane) - CELL / 2, PAD, CELL, GRID * CELL);
        }
      }
    };

    const drawStone = (b) => {
      const cx = PAD + (b.axis === 'row' ? b.p : b.lane + 0.5) * CELL;
      const cy = PAD + (b.axis === 'row' ? b.lane + 0.5 : b.p) * CELL;
      const R = b.r * CELL;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
      ctx.beginPath();
      ctx.ellipse(cx + 3, cy + R * 0.75, R * 0.95, R * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      const grad = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.15, cx, cy, R);
      grad.addColorStop(0, '#e2b285');
      grad.addColorStop(0.6, '#b57c46');
      grad.addColorStop(1, '#7c4f24');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Craters rotate with the ball to sell the rolling.
      ctx.fillStyle = 'rgba(90, 55, 20, 0.4)';
      for (const c of b.craters) {
        const a = c.a + b.rot;
        const d = c.d * R;
        const px = cx + Math.cos(a) * d;
        const py = cy + Math.sin(a) * d;
        const edgeFade = 1 - (d / R) * 0.5;
        ctx.beginPath();
        ctx.ellipse(px, py, c.r * R * edgeFade, c.r * R * 0.7 * edgeFade, a, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawCannonball = (b) => {
      const cx = PAD + (b.axis === 'row' ? b.p : b.lane + 0.5) * CELL;
      const cy = PAD + (b.axis === 'row' ? b.lane + 0.5 : b.p) * CELL;
      const R = b.r * CELL;

      // Motion-blur ghosts trailing behind.
      for (let g = 1; g <= 2; g++) {
        const off = g * 0.34 * b.dir * CELL;
        const gx = b.axis === 'row' ? cx - off : cx;
        const gy = b.axis === 'row' ? cy : cy - off;
        ctx.fillStyle = `rgba(17, 24, 39, ${0.14 / g})`;
        ctx.beginPath();
        ctx.arc(gx, gy, R * (1 - g * 0.12), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
      ctx.beginPath();
      ctx.ellipse(cx + 3, cy + R * 0.8, R * 0.9, R * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();

      const grad = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.1, cx, cy, R);
      grad.addColorStop(0, '#64748b');
      grad.addColorStop(0.45, '#1f2937');
      grad.addColorStop(1, '#05070c');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.ellipse(cx - R * 0.38, cy - R * 0.42, R * 0.2, R * 0.13, -0.6, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawBeam = (bm, time) => {
      const gone = 1 - bm.t / bm.total;
      const env =
        gone < 0.14 ? gone / 0.14 : bm.t < 120 ? bm.t / 120 : 1; // ramp in, hold, ramp out
      const c = laneCenter(bm.lane);
      const jitter = 1 + 0.1 * Math.sin(time * 0.09);
      const horizontal = bm.axis === 'row';

      ctx.save();
      if (!horizontal) {
        ctx.translate(SIZE / 2, SIZE / 2);
        ctx.rotate(Math.PI / 2);
        ctx.translate(-SIZE / 2, -SIZE / 2);
      }
      const y = horizontal ? c : SIZE - c; // rotation mirrors the lane axis

      const glowH = CELL * 0.95 * jitter;
      const glow = ctx.createLinearGradient(0, y - glowH / 2, 0, y + glowH / 2);
      glow.addColorStop(0, 'rgba(255, 140, 40, 0)');
      glow.addColorStop(0.5, `rgba(255, 150, 50, ${0.75 * env})`);
      glow.addColorStop(1, 'rgba(255, 140, 40, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, y - glowH / 2, SIZE, glowH);

      const coreH = CELL * (0.3 + 0.05 * Math.sin(time * 0.13)) * env;
      ctx.fillStyle = `rgba(255, 253, 240, ${0.95 * env})`;
      ctx.fillRect(0, y - coreH / 2, SIZE, coreH);

      // Sparks where the beam meets the arena walls.
      ctx.fillStyle = `rgba(255, 170, 60, ${0.9 * env})`;
      for (const wx of [PAD - 4, SIZE - PAD + 4]) {
        for (let i = 0; i < 5; i++) {
          const a = Math.sin(time * 0.05 + i * 2.1 + bm.lane) * Math.PI;
          const len = 6 + 10 * Math.abs(Math.sin(time * 0.03 + i * 1.7));
          ctx.beginPath();
          ctx.moveTo(wx, y);
          ctx.lineTo(wx + Math.cos(a) * len, y + Math.sin(a) * len * 1.6);
          ctx.lineTo(wx + Math.cos(a) * len * 0.4, y + Math.sin(a + 0.5) * len);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    };

    const drawStickman = (time) => {
      const pos = renderPos();
      const px = PAD + pos.x * CELL;
      const py = PAD + pos.y * CELL;
      const s = CELL;
      const moving = player.animT < STEP_ANIM_MS;
      const dead = !player.alive;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
      ctx.beginPath();
      ctx.ellipse(px, py + s * 0.36, s * 0.18, s * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(px, py + (dead ? s * 0.2 : Math.sin(time * 0.006) * 1.2));
      if (dead) {
        ctx.rotate(Math.PI / 2 * Math.min(1, deadT / 220));
      } else if (moving) {
        ctx.rotate(player.leanX * 0.14 + 0.04 * Math.sin(player.walk));
      }

      ctx.strokeStyle = '#16181d';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const headR = s * 0.115;
      const headY = -s * 0.28;
      ctx.beginPath();
      ctx.arc(0, headY, headR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, headY + headR);
      ctx.lineTo(0, s * 0.1);
      ctx.stroke();

      const swing = moving ? Math.sin(player.walk) * s * 0.09 : 0;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.08);
      ctx.lineTo(-s * 0.13, s * 0.04 + swing);
      ctx.moveTo(0, -s * 0.08);
      ctx.lineTo(s * 0.13, s * 0.04 - swing);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, s * 0.1);
      ctx.lineTo(-s * 0.1 - swing, s * 0.34);
      ctx.moveTo(0, s * 0.1);
      ctx.lineTo(s * 0.1 + swing, s * 0.34);
      ctx.stroke();
      ctx.restore();
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.save();
      if (shake > 0.3) {
        ctx.translate((Math.random() * 2 - 1) * shake, (Math.random() * 2 - 1) * shake);
      }

      drawBoard();
      drawMilestone();
      for (const w of warns) drawArrow(w, time);
      for (const b of balls) (modeKey === 'stones' ? drawStone : drawCannonball)(b);
      drawStickman(time);
      for (const bm of beams) drawBeam(bm, time);

      for (const p of parts) {
        ctx.globalAlpha = clamp(p.life * 2, 0, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const loop = (now) => {
      if (!running) return;
      const dtMs = Math.min(50, now - last);
      last = now;
      update(dtMs / 1000, dtMs);
      draw(now);
      rafId = requestAnimationFrame(loop);
    };

    setPhase('countdown');
    setResult(null);
    setBest(readBest(modeKey, difficulty));
    // (Re)start the soundtrack for this run — a retry only bumps runId, so the
    // GamesPage effect won't refire to bring it back after a death stops it.
    startMusic();
    if (scoreRef.current) scoreRef.current.textContent = '0.0';
    if (waveRef.current) waveRef.current.textContent = '0';
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    rafId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [modeKey, difficulty, runId, onExit]);

  return (
    <div className="oops-stage">
      <div className="oops-hud">
        <button className="oops-hud-btn" onClick={onExit} title="Back to mode select (Esc)">
          ← Modes
        </button>
        <div className="oops-hud-title">
          {title}
          <span className={`oops-diff-chip ${difficulty}`}>
            {difficulty === 'hard' ? 'Hard' : 'Normal'}
          </span>
        </div>
        <div className="oops-hud-scores">
          <span className="oops-hud-wave">
            Wave <em ref={waveRef}>0</em>
          </span>
          <span className="oops-hud-score">
            <em ref={scoreRef}>0.0</em>s
          </span>
          <span className="oops-hud-best">Best {best.toFixed(1)}s</span>
          <button
            className="oops-hud-mute"
            onClick={() => setMutedState(setMuted(!muted))}
            title={muted ? 'Unmute sound' : 'Mute sound'}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      <div className="oops-frame" data-mode={modeKey}>
        <canvas
          ref={canvasRef}
          className="oops-canvas"
          style={{ width: '100%', height: '100%' }}
          aria-label={`Mr. Oops — ${title}`}
        />

        {phase === 'countdown' && (
          <div className="oops-overlay">
            <div className="oops-countdown">
              <span className="oops-ready">READY…</span>
              <span className="oops-go">GO!</span>
            </div>
          </div>
        )}

        {phase === 'dead' && result && (
          <div className="oops-overlay oops-overlay-dim">
            <div className="oops-gameover">
              <div className="oops-oops-text">OOPS!!</div>
              <div className="oops-final">
                Survived <strong>{result.score.toFixed(1)}s</strong> · reached wave{' '}
                <strong>{result.waves}</strong>
              </div>
              {result.isNew ? (
                <div className="oops-newbest">★ NEW BEST ★</div>
              ) : (
                <div className="oops-prevbest">Best {result.best.toFixed(1)}s</div>
              )}
              <div className="oops-gameover-actions">
                <button className="oops-btn primary" onClick={() => setRunId((r) => r + 1)}>
                  Play again <kbd>Space</kbd>
                </button>
                <button className="oops-btn" onClick={onExit}>
                  Change mode <kbd>Esc</kbd>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="oops-controls-hint">
        Move with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or <kbd>←</kbd><kbd>↑</kbd>
        <kbd>↓</kbd><kbd>→</kbd> · survive as long as you can
      </div>
    </div>
  );
}
