// Sound for the arcade: a looping background track that plays while a game is
// in progress, and a short swipe cue on every move. Both respect a persisted
// mute preference. Audio is created lazily so nothing loads (or trips the
// browser's autoplay block) until the player actually starts a game.
import musicUrl from '../../assets/song/High_Score_Horizon.mp3';
import swipeUrl from '../../assets/song/swipe.wav';
import deathHitUrl from '../../assets/song/DoorMetalWoodHit.wav';

const MUTE_KEY = 'vv-oops-muted';
const SWIPE_VOICES = 5; // pool size so rapid steps overlap instead of cutting off

let muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
})();

let music = null;
let swipePool = null;
let swipeIdx = 0;
let deathHit = null;

const ensureMusic = () => {
  if (!music) {
    music = new Audio(musicUrl);
    music.loop = true;
    music.volume = 0.4;
  }
  return music;
};

const ensureDeathHit = () => {
  if (!deathHit) {
    deathHit = new Audio(deathHitUrl);
    deathHit.volume = 0.8;
  }
  return deathHit;
};

const ensureSwipePool = () => {
  if (!swipePool) {
    swipePool = Array.from({ length: SWIPE_VOICES }, () => {
      const a = new Audio(swipeUrl);
      a.volume = 0.5;
      return a;
    });
  }
  return swipePool;
};

export const isMuted = () => muted;

export const setMuted = (value) => {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    /* session only */
  }
  if (music) music.muted = value;
  return muted;
};

// Loop the background track. Safe to call repeatedly — it resumes rather than
// restarts if already playing. play() may reject if no gesture has happened
// yet; we swallow that and the next call (post-gesture) succeeds.
export const startMusic = () => {
  const m = ensureMusic();
  m.muted = muted;
  const p = m.play();
  if (p && p.catch) p.catch(() => {});
};

export const stopMusic = () => {
  if (!music) return;
  music.pause();
  music.currentTime = 0;
};

// Fire-and-forget swipe cue, cycled through a small voice pool.
export const playSwipe = () => {
  if (muted) return;
  const pool = ensureSwipePool();
  const a = pool[swipeIdx];
  swipeIdx = (swipeIdx + 1) % SWIPE_VOICES;
  try {
    a.currentTime = 0;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  } catch {
    /* ignore — a dropped swipe cue is harmless */
  }
};

// Impact cue for the player's death (struck by a rolling stone, iron cannonball,
// or laser beam). Fire-and-forget, from the top each time. Respects mute.
export const playDeathHit = () => {
  if (muted) return;
  const a = ensureDeathHit();
  try {
    a.currentTime = 0;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  } catch {
    /* ignore — a dropped death cue is harmless */
  }
};
