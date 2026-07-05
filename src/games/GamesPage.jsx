import { useCallback, useEffect, useState } from 'react';
import CosmicCanvas from '../CosmicCanvas';
import MrOops, {
  readBest,
  readRepeatDelay,
  storeRepeatDelay,
  REPEAT_DELAY_RANGE
} from './MrOops';
import { startMusic, stopMusic } from './audio';
import rollingStonesImg from '../../games/rolling_stones.jpeg';
import ironCannonsImg from '../../games/iron_cannons.jpeg';
import laserWeaponImg from '../../games/laser_weapon.jpeg';

const DESKTOP_QUERY = '(min-width: 900px)';

const MODES = [
  {
    key: 'stones',
    title: 'Rolling Stones',
    tagline: 'Slow, relentless boulders that crowd the arena — nowhere feels safe.',
    image: rollingStonesImg,
    pace: 'Warm-up'
  },
  {
    key: 'cannons',
    title: 'Iron Cannons',
    tagline: 'Cannonballs scream past — faster shots, shorter warnings, volleys.',
    image: ironCannonsImg,
    pace: 'Fast'
  },
  {
    key: 'laser',
    title: 'Laser Weapon',
    tagline: 'Beams vaporize entire lanes at once. Trust the warning arrows.',
    image: laserWeaponImg,
    pace: 'Brutal'
  }
];

const readDifficulty = () => {
  try {
    return localStorage.getItem('vv-oops-difficulty') === 'hard' ? 'hard' : 'normal';
  } catch {
    return 'normal';
  }
};

export default function GamesPage() {
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia(DESKTOP_QUERY).matches
  );
  const [modeKey, setModeKey] = useState(null);
  const [sel, setSel] = useState(0);
  const [difficulty, setDifficulty] = useState(readDifficulty);
  const [repeatDelay, setRepeatDelay] = useState(readRepeatDelay);
  const [bests, setBests] = useState({});

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Refresh per-mode bests whenever the menu is shown or difficulty changes.
  useEffect(() => {
    if (modeKey !== null) return;
    setBests(Object.fromEntries(MODES.map((m) => [m.key, readBest(m.key, difficulty)])));
  }, [modeKey, difficulty]);

  const pickDifficulty = (d) => {
    setDifficulty(d);
    try {
      localStorage.setItem('vv-oops-difficulty', d);
    } catch {
      /* session only */
    }
  };

  const onRepeatDelayChange = (value) => {
    setRepeatDelay(value);
    storeRepeatDelay(value);
  };

  // Menu keyboard: ←→/AD choose game, ↑↓/WS switch difficulty, Enter/Space
  // play, 1-3 quick start.
  useEffect(() => {
    if (modeKey !== null || !isDesktop) return;
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return; // don't fight the slider
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        setSel((s) => (s + 1) % MODES.length);
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        setSel((s) => (s + MODES.length - 1) % MODES.length);
      } else if (['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        pickDifficulty(difficulty === 'hard' ? 'normal' : 'hard');
      } else if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        setSel((s) => {
          setModeKey(MODES[s].key);
          return s;
        });
      } else if (/^Digit[123]$/.test(e.code)) {
        e.preventDefault();
        const idx = Number(e.code.slice(-1)) - 1;
        setSel(idx);
        setModeKey(MODES[idx].key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modeKey, isDesktop, difficulty]);

  const exitToMenu = useCallback(() => setModeKey(null), []);

  const activeMode = MODES.find((m) => m.key === modeKey);

  // Loop the soundtrack while a game is in progress; silence it on the menu.
  // Retries keep modeKey set, so the track plays continuously across them.
  useEffect(() => {
    if (modeKey !== null) startMusic();
    else stopMusic();
    return stopMusic;
  }, [modeKey]);

  return (
    <div className="games-page">
      <CosmicCanvas />
      <div className="games-aurora" aria-hidden="true" />
      <div className="games-grid-overlay" aria-hidden="true" />

      <header className="games-header">
        <a className="games-back" href="/">
          ← Victor Varian
        </a>
        <div className="games-brand">
          <span className="games-brand-vv">VV</span> Arcade
        </div>
      </header>

      <main className="games-main">
        {!isDesktop ? (
          <div className="games-mobile-notice">
            <div className="games-mobile-icon">🕹️</div>
            <h1>Desktop only, sorry!</h1>
            <p>
              Mr. Oops!! is played with a keyboard (WASD or arrow keys), so it needs a
              desktop-sized screen. Come back on a computer to play.
            </p>
            <a className="oops-btn primary" href="/">
              Back to portfolio
            </a>
          </div>
        ) : activeMode ? (
          <MrOops
            modeKey={activeMode.key}
            difficulty={difficulty}
            title={activeMode.title}
            onExit={exitToMenu}
          />
        ) : (
          <div className="games-menu">
            <p className="games-kicker">VV Arcade · 01</p>
            <h1 className="games-title">
              Mr. Oops<span className="games-title-bang">!!</span>
            </h1>
            <p className="games-subtitle">
              Recreating my childhood game. Pick your hazard, watch the warning
              arrows, and survive as long as you can.
            </p>

            <div className="games-diff-row">
              <div className="games-diff-toggle" role="radiogroup" aria-label="Difficulty">
                <button
                  className={difficulty === 'normal' ? 'active' : ''}
                  onClick={() => pickDifficulty('normal')}
                  role="radio"
                  aria-checked={difficulty === 'normal'}
                >
                  Normal
                </button>
                <button
                  className={`hard ${difficulty === 'hard' ? 'active' : ''}`}
                  onClick={() => pickDifficulty('hard')}
                  role="radio"
                  aria-checked={difficulty === 'hard'}
                >
                  ⚡ Hard
                </button>
              </div>
              <p className="games-diff-note">
                {difficulty === 'hard'
                  ? 'Straight into late-game chaos — the arena stays crowded from second one.'
                  : 'Starts with 1–2 hazards and slowly builds to late-game chaos.'}
              </p>
            </div>

            <div className="games-mode-grid">
              {MODES.map((mode, i) => (
                <button
                  key={mode.key}
                  className={`games-mode-card ${sel === i ? 'selected' : ''}`}
                  onClick={() => {
                    setSel(i);
                    setModeKey(mode.key);
                  }}
                  onMouseEnter={() => setSel(i)}
                >
                  <span className="games-mode-shot">
                    <img src={mode.image} alt={`${mode.title} gameplay`} loading="lazy" />
                    <span className="games-mode-pace">{mode.pace}</span>
                  </span>
                  <span className="games-mode-body">
                    <span className="games-mode-name">
                      <kbd>{i + 1}</kbd> {mode.title}
                    </span>
                    <span className="games-mode-tagline">{mode.tagline}</span>
                    <span className="games-mode-best">
                      {bests[mode.key] > 0
                        ? `Best (${difficulty === 'hard' ? 'Hard' : 'Normal'}) · ${bests[mode.key].toFixed(1)}s`
                        : 'Not played yet'}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <p className="games-menu-hint">
              <kbd>←</kbd><kbd>→</kbd> choose · <kbd>↑</kbd><kbd>↓</kbd> difficulty ·{' '}
              <kbd>Enter</kbd> play · in-game move with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd>
              <kbd>D</kbd> or arrow keys
            </p>

            <div className="games-settings">
              <div className="games-settings-row">
                <label htmlFor="oops-resistance">Input resistance</label>
                <input
                  id="oops-resistance"
                  type="range"
                  min={REPEAT_DELAY_RANGE[0]}
                  max={REPEAT_DELAY_RANGE[1]}
                  step={20}
                  value={repeatDelay}
                  onChange={(e) => onRepeatDelayChange(Number(e.target.value))}
                />
                <span className="games-settings-value">{repeatDelay} ms</span>
              </div>
              <p className="games-settings-note">
                How long a key must stay held before your runner auto-repeats a step. Raise it
                if a single tap sometimes moves you two cells.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="games-footer">
        © 2026 Victor Varian · Mr. Oops!! is a loving fan remake of the iOS original — all
        credit to its creators ✦
      </footer>
    </div>
  );
}
