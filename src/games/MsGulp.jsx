import { useEffect, useRef, useState } from 'react';
import { playSwipe, playDeathHit, startMusic, stopMusic, isMuted, setMuted } from './audio';

// Ms. Gulp!! — VV Arcade's hidden second cabinet, revealed by the keypad on
// the games menu. A neon serpent glides around a dark star-grid gulping
// stardust to grow; every few gulps a gold bonus star appears on a timer.
// Same architecture as Mr. Oops: pure canvas rendering driven by a fixed
// requestAnimationFrame loop; React only handles the HUD and overlays.

const GRID = 16; // cells per side
const CELL = 34; // px per cell (logical, pre-DPR)
const PAD = 28; // gutter so the board matches Mr. Oops' 600px footprint
const SIZE = GRID * CELL + PAD * 2;

const COUNTDOWN_MS = 1500;
const QUEUE_MAX = 2; // buffered turns so quick zig-zags feel responsive
const START_LEN = 3;
const BONUS_EVERY = 5; // a bonus star appears every N stardust gulped
const BONUS_TTL_MS = 6000;
const BONUS_POINTS = 5;
const STEP_ACCEL_MS = 2; // each stardust shaves this off the step interval
const STEP_MS = { normal: [150, 72], hard: [108, 60] }; // [start, floor]

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

const bestKey = (difficulty) => `vv-gulp-best${difficulty === 'hard' ? '-hard' : ''}`;

export const readBest = (difficulty) => {
  try {
    return Number(localStorage.getItem(bestKey(difficulty))) || 0;
  } catch {
    return 0;
  }
};

const storeBest = (difficulty, value) => {
  try {
    localStorage.setItem(bestKey(difficulty), String(value));
  } catch {
    /* private mode — session best only */
  }
};

export default function MsGulp({ difficulty, onExit }) {
  const canvasRef = useRef(null);
  const scoreRef = useRef(null);
  const lenRef = useRef(null);
  const [phase, setPhase] = useState('countdown'); // countdown | playing | dead
  const [result, setResult] = useState(null); // { score, len, best, isNew, win }
  const [best, setBest] = useState(() => readBest(difficulty));
  const [runId, setRunId] = useState(0);
  const [muted, setMutedState] = useState(isMuted);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const [stepStart, stepFloor] = STEP_MS[difficulty === 'hard' ? 'hard' : 'normal'];

    let rafId = 0;
    let running = true;
    let last = performance.now();
    let phaseL = 'countdown';
    let countdownT = COUNTDOWN_MS;
    let stepT = 0;
    let shake = 0;
    let wonL = false;

    // Head first; the serpent starts mid-board, sliding right.
    let snake = Array.from({ length: START_LEN }, (_, i) => ({ x: 8 - i, y: 8 }));
    let prev = snake.map((s) => ({ ...s })); // positions before the last step, for lerp
    let dir = { x: 1, y: 0 };
    const queue = []; // buffered turns, applied one per step
    let grow = 0; // pending tail segments
    let eaten = 0; // stardust count (drives the speed ramp)
    let score = 0;
    let food = null;
    let bonus = null; // { x, y, t }
    let parts = []; // burst particles
    let floats = []; // { x, y, txt, color, life } score popups

    // Faint fixed stars twinkling behind the grid.
    const stars = Array.from({ length: 40 }, () => ({
      x: PAD + Math.random() * GRID * CELL,
      y: PAD + Math.random() * GRID * CELL,
      phase: Math.random() * Math.PI * 2
    }));

    const emptyCells = () => {
      const occ = new Set(snake.map((s) => s.x + s.y * GRID));
      if (food) occ.add(food.x + food.y * GRID);
      if (bonus) occ.add(bonus.x + bonus.y * GRID);
      const out = [];
      for (let i = 0; i < GRID * GRID; i++) {
        if (!occ.has(i)) out.push({ x: i % GRID, y: (i / GRID) | 0 });
      }
      return out;
    };

    const spawnFood = () => {
      const cells = emptyCells();
      return cells.length ? cells[(Math.random() * cells.length) | 0] : null;
    };
    food = spawnFood();

    const headPx = () => ({
      x: PAD + (snake[0].x + 0.5) * CELL,
      y: PAD + (snake[0].y + 0.5) * CELL
    });

    const burst = (cx, cy, colors, n = 14) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 50 + Math.random() * 160;
        parts.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 50,
          life: 0.4 + Math.random() * 0.45,
          color: colors[(Math.random() * colors.length) | 0]
        });
      }
    };

    const addFloat = (txt, color) => {
      const p = headPx();
      floats.push({ x: p.x, y: p.y - CELL * 0.5, txt, color, life: 0.9 });
    };

    const updateHud = () => {
      if (scoreRef.current) scoreRef.current.textContent = String(score);
      if (lenRef.current) lenRef.current.textContent = String(snake.length);
    };

    const finish = (win) => {
      phaseL = 'dead';
      wonL = win;
      shake = win ? 4 : 10;
      if (!win) playDeathHit();
      stopMusic();
      const p = headPx();
      burst(p.x, p.y, win ? ['#fbbf24', '#6ee7b7', '#22d3ee'] : ['#34d399', '#065f46', '#fbbf24', '#0e162b'], 24);
      const prevBest = readBest(difficulty);
      const isNew = score > prevBest;
      if (isNew) storeBest(difficulty, score);
      setBest(isNew ? score : prevBest);
      setResult({ score, len: snake.length, best: isNew ? score : prevBest, isNew, win });
      setPhase('dead');
    };

    const doStep = () => {
      prev = snake.map((s) => ({ ...s }));
      if (queue.length) dir = queue.shift();
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) return finish(false);
      // The tail cell vacates this step unless the serpent is growing.
      const body = grow > 0 ? snake : snake.slice(0, -1);
      if (body.some((s) => s.x === head.x && s.y === head.y)) return finish(false);
      snake.unshift(head);
      if (grow > 0) grow--;
      else snake.pop();

      if (bonus && head.x === bonus.x && head.y === bonus.y) {
        score += BONUS_POINTS;
        grow += 2;
        bonus = null;
        addFloat(`+${BONUS_POINTS}`, '#fbbf24');
        burst(headPx().x, headPx().y, ['#fbbf24', '#fde68a']);
        playSwipe();
      }
      if (food && head.x === food.x && head.y === food.y) {
        score += 1;
        eaten += 1;
        grow += 1;
        addFloat('+1', '#f9a8d4');
        burst(headPx().x, headPx().y, ['#f472b6', '#f9a8d4'], 10);
        playSwipe();
        if (eaten % BONUS_EVERY === 0 && !bonus) {
          const cell = spawnFood();
          if (cell) bonus = { ...cell, t: BONUS_TTL_MS };
        }
        food = spawnFood();
        if (!food) return finish(true); // board is full — a legend retires
      }
      // Every step: pending growth from a previous gulp lands here, so the
      // length readout is only correct if refreshed unconditionally.
      updateHud();
    };

    const currentStepMs = () => Math.max(stepFloor, stepStart - eaten * STEP_ACCEL_MS);

    /* ------------------------------ input ------------------------------ */

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
      const d = DIRS[e.code];
      if (!d) return;
      e.preventDefault();
      if (e.repeat) return;
      // Compare against where the serpent will actually be pointing once the
      // queue drains — blocks 180° reversals and duplicate turns.
      const lastDir = queue.length ? queue[queue.length - 1] : dir;
      if (d[0] === lastDir.x && d[1] === lastDir.y) return;
      if (d[0] === -lastDir.x && d[1] === -lastDir.y) return;
      if (queue.length < QUEUE_MAX) queue.push({ x: d[0], y: d[1] });
    };

    /* ------------------------------ update ----------------------------- */

    const update = (dt, dtMs) => {
      if (phaseL === 'countdown') {
        countdownT -= dtMs;
        if (countdownT <= 0) {
          phaseL = 'playing';
          setPhase('playing');
        }
      } else if (phaseL === 'playing') {
        stepT += dtMs;
        while (phaseL === 'playing' && stepT >= currentStepMs()) {
          stepT -= currentStepMs();
          doStep();
        }
        if (bonus) {
          bonus.t -= dtMs;
          if (bonus.t <= 0) bonus = null;
        }
      }

      parts = parts.filter((p) => {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 300 * dt;
        return p.life > 0;
      });
      floats = floats.filter((f) => {
        f.life -= dt;
        f.y -= 34 * dt;
        return f.life > 0;
      });
      shake *= Math.exp(-6 * dt);
    };

    /* ------------------------------ drawing ---------------------------- */

    const drawBoard = (time) => {
      ctx.fillStyle = '#070b19';
      ctx.fillRect(0, 0, SIZE, SIZE);

      ctx.save();
      ctx.shadowColor = 'rgba(52, 211, 153, 0.22)';
      ctx.shadowBlur = 26;
      ctx.fillStyle = '#0c1226';
      ctx.fillRect(PAD, PAD, GRID * CELL, GRID * CELL);
      ctx.restore();

      for (const s of stars) {
        ctx.globalAlpha = 0.25 + 0.25 * Math.sin(time * 0.0012 + s.phase);
        ctx.fillStyle = '#94a3ff';
        ctx.fillRect(s.x, s.y, 1.5, 1.5);
      }
      ctx.globalAlpha = 1;

      ctx.strokeStyle = 'rgba(148, 163, 255, 0.09)';
      ctx.lineWidth = 1;
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

      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(PAD - 4, PAD - 4, GRID * CELL + 8, GRID * CELL + 8);
    };

    const drawFood = (time) => {
      if (!food) return;
      const cx = PAD + (food.x + 0.5) * CELL;
      const cy = PAD + (food.y + 0.5) * CELL;
      const R = CELL * 0.26 * (1 + 0.12 * Math.sin(time * 0.006));
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.6);
      glow.addColorStop(0, 'rgba(244, 114, 182, 0.5)');
      glow.addColorStop(1, 'rgba(244, 114, 182, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 2.6, 0, Math.PI * 2);
      ctx.fill();
      const core = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
      core.addColorStop(0, '#ffffff');
      core.addColorStop(0.5, '#f9a8d4');
      core.addColorStop(1, '#ec4899');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
    };

    const starPath = (cx, cy, outer, inner, rot) => {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    const drawBonus = (time) => {
      if (!bonus) return;
      const cx = PAD + (bonus.x + 0.5) * CELL;
      const cy = PAD + (bonus.y + 0.5) * CELL;
      // Blink urgently through the final stretch of the timer.
      const blink = bonus.t < 1800 ? (Math.sin(time * 0.02) > 0 ? 1 : 0.3) : 1;
      ctx.save();
      ctx.globalAlpha = blink;
      ctx.shadowColor = 'rgba(251, 191, 36, 0.85)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#fbbf24';
      starPath(cx, cy, CELL * 0.32, CELL * 0.14, time * 0.0012);
      ctx.fill();
      ctx.restore();
      // Remaining-time ring.
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.7 * blink})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, CELL * 0.44, -Math.PI / 2, -Math.PI / 2 + (bonus.t / BONUS_TTL_MS) * Math.PI * 2);
      ctx.stroke();
    };

    const drawSnake = (t) => {
      const pts = snake.map((s, i) => {
        const pv = prev[Math.min(i, prev.length - 1)] ?? s;
        return {
          x: PAD + (lerp(pv.x, s.x, t) + 0.5) * CELL,
          y: PAD + (lerp(pv.y, s.y, t) + 0.5) * CELL
        };
      });

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const denom = Math.max(1, pts.length - 1);
      for (let i = pts.length - 1; i > 0; i--) {
        const k = i / denom;
        ctx.strokeStyle = `hsl(158, 72%, ${52 - k * 24}%)`;
        ctx.lineWidth = CELL * (0.62 - k * 0.2);
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[i - 1].x, pts[i - 1].y);
        ctx.stroke();
      }

      const head = pts[0];
      ctx.save();
      ctx.shadowColor = 'rgba(52, 211, 153, 0.8)';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#6ee7b7';
      ctx.beginPath();
      ctx.arc(head.x, head.y, CELL * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Eyes look where she's headed; X-ed out after the fatal bite.
      const px = -dir.y;
      const py = dir.x;
      for (const s of [-1, 1]) {
        const ox = head.x + dir.x * CELL * 0.12 + px * s * CELL * 0.13;
        const oy = head.y + dir.y * CELL * 0.12 + py * s * CELL * 0.13;
        if (phaseL === 'dead' && !wonL) {
          ctx.strokeStyle = '#052e1f';
          ctx.lineWidth = 2;
          const r = CELL * 0.07;
          ctx.beginPath();
          ctx.moveTo(ox - r, oy - r);
          ctx.lineTo(ox + r, oy + r);
          ctx.moveTo(ox + r, oy - r);
          ctx.lineTo(ox - r, oy + r);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ox, oy, CELL * 0.085, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#052e1f';
          ctx.beginPath();
          ctx.arc(ox + dir.x * 1.6, oy + dir.y * 1.6, CELL * 0.045, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const draw = (time, t) => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.save();
      if (shake > 0.3) {
        ctx.translate((Math.random() * 2 - 1) * shake, (Math.random() * 2 - 1) * shake);
      }

      drawBoard(time);
      drawFood(time);
      drawBonus(time);
      drawSnake(t);

      for (const p of parts) {
        ctx.globalAlpha = clamp(p.life * 2, 0, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.font = "700 16px 'Space Grotesk', 'Segoe UI', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      for (const f of floats) {
        ctx.globalAlpha = clamp(f.life * 1.6, 0, 1);
        ctx.fillStyle = f.color;
        ctx.fillText(f.txt, f.x, f.y);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const loop = (now) => {
      if (!running) return;
      const dtMs = Math.min(50, now - last);
      last = now;
      update(dtMs / 1000, dtMs);
      const t = phaseL === 'playing' ? clamp(stepT / currentStepMs(), 0, 1) : 1;
      draw(now, t);
      rafId = requestAnimationFrame(loop);
    };

    setPhase('countdown');
    setResult(null);
    setBest(readBest(difficulty));
    // (Re)start the soundtrack for this run — a retry only bumps runId, so the
    // GamesPage effect won't refire to bring it back after a death stops it.
    startMusic();
    if (scoreRef.current) scoreRef.current.textContent = '0';
    if (lenRef.current) lenRef.current.textContent = String(START_LEN);
    window.addEventListener('keydown', onKeyDown);
    rafId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [difficulty, runId, onExit]);

  return (
    <div className="oops-stage">
      <div className="oops-hud">
        <button className="oops-hud-btn" onClick={onExit} title="Back to the arcade (Esc)">
          ← Arcade
        </button>
        <div className="oops-hud-title">
          Ms. Gulp!!
          <span className={`oops-diff-chip ${difficulty}`}>
            {difficulty === 'hard' ? 'Hard' : 'Normal'}
          </span>
        </div>
        <div className="oops-hud-scores">
          <span className="oops-hud-wave">
            Length <em ref={lenRef}>{START_LEN}</em>
          </span>
          <span className="oops-hud-score">
            <em ref={scoreRef}>0</em> pts
          </span>
          <span className="oops-hud-best">Best {best}</span>
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

      <div className="oops-frame" data-mode="gulp">
        <canvas
          ref={canvasRef}
          className="oops-canvas"
          style={{ width: '100%', height: '100%' }}
          aria-label="Ms. Gulp — secret serpent game"
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
              <div className="oops-oops-text gulp">{result.win ? 'LEGEND!!' : 'GULP!!'}</div>
              <div className="oops-final">
                {result.win ? 'She filled the whole board — ' : ''}
                Scored <strong>{result.score} pts</strong> · length{' '}
                <strong>{result.len}</strong>
              </div>
              {result.isNew ? (
                <div className="oops-newbest">★ NEW BEST ★</div>
              ) : (
                <div className="oops-prevbest">Best {result.best} pts</div>
              )}
              <div className="oops-gameover-actions">
                <button className="oops-btn primary" onClick={() => setRunId((r) => r + 1)}>
                  Play again <kbd>Space</kbd>
                </button>
                <button className="oops-btn" onClick={onExit}>
                  Back to arcade <kbd>Esc</kbd>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="oops-controls-hint">
        Turn with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows · gulp pink
        stardust, snag gold stars before they fade · walls and your own tail end the run
      </div>
    </div>
  );
}
