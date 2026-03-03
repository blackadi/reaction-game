// ═══════════════════════════════════════════════════════════════
// DIFFICULTY DEFINITIONS
// Each difficulty sets the wait window, XP multiplier, target
// reaction time for "success", and Three.js visual intensity.
// ═══════════════════════════════════════════════════════════════
const DIFFICULTIES = {
  novice:  { label:'Novice',   icon:'🟢', color:'#10B981', delayMin:2000, delayMax:4500, targetMs:400, xpMult:1.0, threeIntensity:0.8 },
  warrior: { label:'Warrior',  icon:'🔵', color:'#06B6D4', delayMin:1500, delayMax:3500, targetMs:300, xpMult:1.5, threeIntensity:1.2 },
  hunter:  { label:'Hunter',   icon:'🟠', color:'#F59E0B', delayMin:1000, delayMax:2500, targetMs:220, xpMult:2.0, threeIntensity:1.6 },
  legend:  { label:'Legend',   icon:'🔴', color:'#F43F5E', delayMin:600,  delayMax:1800, targetMs:160, xpMult:3.0, threeIntensity:2.2 },
};

// ═══════════════════════════════════════════════════════════════
// LEVEL DEFINITIONS — 10 progressive levels
// Each level unlocks a title and adjusts dragon behaviour.
// ═══════════════════════════════════════════════════════════════
const LEVELS = [
  { level:1,  xpNeeded:0,   title:'Dragon Hatchling', burst:'🥚', desc:'Your journey begins. The dragon watches.',          targetHint:'Beat 400ms consistently' },
  { level:2,  xpNeeded:100, title:'Dragon Fledgling',  burst:'🐣', desc:'Wings forming. You\'re finding your rhythm.',       targetHint:'Hit sub-300ms on Warrior' },
  { level:3,  xpNeeded:250, title:'Dragon Scout',      burst:'🐲', desc:'The dragon dips its head. Speed is improving.',     targetHint:'Try Hunter difficulty' },
  { level:4,  xpNeeded:450, title:'Dragon Warrior',    burst:'⚔️', desc:'Your reflexes are sharpening. Keep pushing.',       targetHint:'200ms is within reach' },
  { level:5,  xpNeeded:700, title:'Dragon Knight',     burst:'🛡️', desc:'Half way there. The dragon flies faster for you.',  targetHint:'Aim for sub-200ms' },
  { level:6,  xpNeeded:1000,title:'Dragon Hunter',     burst:'🏹', desc:'Elite reflexes. Most players never get here.',      targetHint:'Conquer Hunter mode' },
  { level:7,  xpNeeded:1400,title:'Dragon Slayer',     burst:'🗡️', desc:'The dragon acknowledges your mastery.',             targetHint:'180ms is the new target' },
  { level:8,  xpNeeded:1900,title:'Dragon Master',     burst:'🔮', desc:'Legendary status is close. Don\'t blink.',          targetHint:'Attempt Legend difficulty' },
  { level:9,  xpNeeded:2500,title:'Dragon Champion',   burst:'🏆', desc:'One of the finest. Legend mode demands your best.', targetHint:'Sub-160ms on Legend' },
  { level:10, xpNeeded:3200,title:'Dragon Legend',     burst:'🐉', desc:'Maximum level. You ARE the dragon.',                targetHint:'Perfection achieved' },
];

const MAX_ROUNDS = 5;
const MAX_LEVEL  = LEVELS.length;

// ═══════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════
const game = {
  state:        'idle',
  stimulusTime: null,
  waitTimeout:  null,
  rounds:       [],
  bestEver:     null,
  lastResult:   null,
  difficulty:   'novice',    // current selected difficulty key
  xp:           0,           // cumulative XP this session
  level:        1,           // current player level (1–10)
  pendingLevelUp: null,      // level data to show in overlay
};

// ═══════════════════════════════════════════════════════════════
// DOM REFERENCES
// ═══════════════════════════════════════════════════════════════
const panels = {
  idle:     document.getElementById('state-idle'),
  waiting:  document.getElementById('state-waiting'),
  stimulus: document.getElementById('state-stimulus'),
  results:  document.getElementById('state-results'),
};

const el = {
  btnStart:         document.getElementById('btn-start'),
  btnClick:         document.getElementById('btn-click'),
  btnAgain:         document.getElementById('btn-again'),
  btnReset:         document.getElementById('btn-reset'),
  btnLevelUpCont:   document.getElementById('btn-levelup-continue'),
  earlyWarning:     document.getElementById('early-warning'),
  resultTime:       document.getElementById('result-time'),
  resultLabel:      document.getElementById('result-label'),
  resultAvg:        document.getElementById('result-avg'),
  resultBest:       document.getElementById('result-best'),
  resultRounds:     document.getElementById('result-rounds'),
  resultBestBadge:  document.getElementById('result-best-badge'),
  resultXpEarned:   document.getElementById('result-xp-earned'),
  waitingDots:      document.getElementById('waiting-dots'),
  resultDots:       document.getElementById('result-dots'),
  waitingDiffBadge: document.getElementById('waiting-diff-badge'),
  // Score HUD
  hud:              document.getElementById('score-hud'),
  hudBest:          document.getElementById('hud-best-val'),
  hudAvg:           document.getElementById('hud-avg-val'),
  hudRounds:        document.getElementById('hud-rounds-val'),
  // Level HUD
  levelHud:         document.getElementById('level-hud'),
  lhudLevel:        document.getElementById('lhud-level-text'),
  lhudRank:         document.getElementById('lhud-rank-text'),
  lhudXpFill:       document.getElementById('lhud-xp-fill'),
  lhudXpLabel:      document.getElementById('lhud-xp-label'),
  // Level-up overlay
  levelupOverlay:   document.getElementById('levelup-overlay'),
  luBurst:          document.getElementById('lu-burst'),
  luName:           document.getElementById('lu-name'),
  luDesc:           document.getElementById('lu-desc'),
  luStat:           document.getElementById('lu-stat'),
};

const PERF_CSS = { excellent:'var(--accent)', good:'var(--success)', average:'var(--warning)', slow:'var(--danger)' };

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function showPanel(name) {
  Object.entries(panels).forEach(([k, p]) => {
    if (k === name) {
      p.classList.add('active');
      const card = p.querySelector('.card');
      if (card) {
        card.classList.remove('glint');
        requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('glint')));
      }
    } else {
      p.classList.remove('active');
    }
  });
  game.state = name;
}

function classify(ms) {
  if (ms < 200) return { key:'excellent', label:'⚡ Excellent!',      cls:'perf-excellent' };
  if (ms < 350) return { key:'good',      label:'✅ Good Reflexes',   cls:'perf-good'      };
  if (ms < 500) return { key:'average',   label:'👌 Average',         cls:'perf-average'   };
                return { key:'slow',      label:'🐢 Keep Practicing', cls:'perf-slow'      };
}

function renderDots(container, filled) {
  container.innerHTML = '';
  for (let i = 0; i < MAX_ROUNDS; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i < filled ? ' filled pop' : '');
    container.appendChild(d);
  }
}

function avg(arr) { return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : null; }
function getDiff() { return DIFFICULTIES[game.difficulty]; }

function calcXP(ms) {
  const diff = getDiff();
  let base = 20;
  const ratio = diff.targetMs / ms;
  if (ratio >= 1.5) base += 50;
  else if (ratio >= 1.2) base += 30;
  else if (ratio >= 1.0) base += 15;
  else if (ratio < 0.6)  base -= 5;
  return Math.max(5, Math.round(base * diff.xpMult));
}

function levelFromXP(xp) {
  let lvl = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpNeeded) { lvl = LEVELS[i].level; break; }
  }
  return Math.min(lvl, MAX_LEVEL);
}

function xpProgress(xp, level) {
  const curr = LEVELS[level - 1].xpNeeded;
  const next = level < MAX_LEVEL ? LEVELS[level].xpNeeded : curr + 500;
  return { curr: xp - curr, total: next - curr, pct: Math.min(100, ((xp - curr) / (next - curr)) * 100) };
}

// ═══════════════════════════════════════════════════════════════
// HUD UPDATES
// ═══════════════════════════════════════════════════════════════
function updateScoreHUD() {
  el.hudBest.textContent   = game.bestEver + 'ms';
  el.hudBest.style.color   = PERF_CSS[classify(game.bestEver).key];
  el.hudAvg.textContent    = avg(game.rounds) + 'ms';
  el.hudRounds.textContent = game.rounds.length;
  el.hud.classList.add('visible');
}

function updateLevelHUD(animated = true) {
  const lvl  = game.level;
  const data = LEVELS[lvl - 1];
  const prog = xpProgress(game.xp, lvl);
  const diff = getDiff();
  el.lhudLevel.textContent       = `Level ${lvl}`;
  el.lhudRank.textContent        = data.title;
  el.lhudXpFill.style.width      = (animated ? prog.pct : 0) + '%';
  el.lhudXpFill.style.background = diff.color;
  el.lhudXpLabel.textContent     = lvl < MAX_LEVEL ? `${prog.curr} / ${prog.total} XP` : 'MAX LEVEL 🐉';
  el.levelHud.classList.add('visible');
  if (animated) {
    el.lhudXpFill.classList.remove('flash-earn');
    requestAnimationFrame(() => requestAnimationFrame(() => el.lhudXpFill.classList.add('flash-earn')));
  }
}

function renderDiffBadge() {
  const diff = getDiff();
  el.waitingDiffBadge.textContent = `${diff.icon} ${diff.label} — Target <${diff.targetMs}ms`;
  el.waitingDiffBadge.style.color = diff.color;
}

// ═══════════════════════════════════════════════════════════════
// GAME STATES
// ═══════════════════════════════════════════════════════════════
function goIdle() { showPanel('idle'); setThreeState('idle'); }

function goWaiting(isRetry = false) {
  showPanel('waiting');
  setThreeState('waiting');
  el.earlyWarning.textContent = isRetry ? '⚠️ Too early! Wait for GO…' : '';
  renderDots(el.waitingDots, game.rounds.length);
  renderDiffBadge();
  const diff  = getDiff();
  const delay = diff.delayMin + Math.random() * (diff.delayMax - diff.delayMin);
  game.waitTimeout = setTimeout(goStimulus, delay);
}

function goStimulus() {
  showPanel('stimulus');
  setThreeState('stimulus');
  game.stimulusTime = performance.now();
  // Screen flash
  const flash = document.getElementById('screen-flash');
  flash.classList.remove('flash');
  requestAnimationFrame(() => requestAnimationFrame(() => flash.classList.add('flash')));
  // Screenshake
  document.body.classList.add('shake');
  setTimeout(() => document.body.classList.remove('shake'), 420);
  // 2D particle burst
  if (window.fxBurst) window.fxBurst(window.innerWidth/2, window.innerHeight/2, ['#06B6D4','#38bdf8','#ffffff'], 38, 'go');
}

function goResults(ms) {
  game.lastResult = ms;
  game.rounds.push(ms);
  const isNewBest = game.bestEver === null || ms < game.bestEver;
  if (isNewBest) game.bestEver = ms;

  const xpEarned = calcXP(ms);
  const prevLevel = game.level;
  game.xp        += xpEarned;
  game.level      = levelFromXP(game.xp);
  const leveledUp = game.level > prevLevel;
  const perf      = classify(ms);

  // Animated count-up
  el.resultTime.className = 'result-time ' + perf.cls;
  el.resultTime.classList.remove('revealed');
  const target = ms, duration = 550, startVal = Math.min(ms + Math.round(ms * 0.4 + 80), 999);
  const t0 = performance.now();
  function countUp(now) {
    const p = Math.min(1, (now - t0) / duration);
    const e = 1 - Math.pow(1 - p, 3);
    el.resultTime.textContent = Math.round(startVal + (target - startVal) * e);
    if (p < 1) requestAnimationFrame(countUp);
    else { el.resultTime.textContent = target; el.resultTime.classList.add('revealed'); }
  }
  requestAnimationFrame(countUp);

  // Glow ring
  const ring = document.getElementById('result-glow-ring');
  ring.className = `result-glow-ring glow-${perf.key}`;

  el.resultLabel.textContent    = perf.label;
  el.resultLabel.className      = 'result-label ' + perf.cls;
  el.resultAvg.textContent      = avg(game.rounds) + 'ms';
  el.resultBest.textContent     = game.bestEver + 'ms';
  el.resultRounds.textContent   = game.rounds.length;
  el.resultBestBadge.style.display = (isNewBest && game.rounds.length > 1) ? 'inline-block' : 'none';
  el.btnAgain.style.display     = game.rounds.length >= MAX_ROUNDS ? 'none' : 'inline-block';
  el.resultXpEarned.textContent = `+${xpEarned} XP earned`;
  el.resultXpEarned.style.color = getDiff().color;

  renderDots(el.resultDots, game.rounds.length);
  updateScoreHUD();
  updateLevelHUD();
  showPanel('results');
  setThreeState('results', perf.key);

  // Stats stagger reveal
  const statsRow = document.getElementById('result-stats-row');
  if (statsRow) { statsRow.classList.remove('revealed'); setTimeout(() => statsRow.classList.add('revealed'), 200); }

  // Particle burst
  if (window.fxBurst) {
    const card = document.querySelector('#state-results .card');
    if (card) {
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width * 0.5, cy = r.top + r.height * 0.28;
      const palettes = {
        excellent: ['#06B6D4','#38bdf8','#a5f3fc','#ffffff','#818cf8'],
        good:      ['#10B981','#34d399','#6ee7b7','#ffffff'],
        average:   ['#F59E0B','#fbbf24','#fde68a','#ffffff'],
        slow:      ['#F43F5E','#fb7185','#fecdd3','#ffffff'],
      };
      window.fxBurst(cx, cy, palettes[perf.key], perf.key === 'excellent' ? 65 : 38, perf.key);
    }
  }

  if (leveledUp && game.level <= MAX_LEVEL) setTimeout(() => showLevelUp(game.level), 800);
}

// ═══════════════════════════════════════════════════════════════
// LEVEL-UP OVERLAY
// ═══════════════════════════════════════════════════════════════
function showLevelUp(newLevel) {
  const data = LEVELS[newLevel - 1];
  const diff = getDiff();
  el.luBurst.textContent = data.burst;
  el.luName.textContent  = data.title;
  el.luDesc.textContent  = data.desc;
  el.luStat.textContent  = data.targetHint;
  el.luStat.style.color  = diff.color;
  el.luStat.style.borderColor = diff.color;
  el.luStat.style.background  = diff.color + '22';
  el.levelupOverlay.classList.add('show');
}

el.btnLevelUpCont.addEventListener('click', () => {
  el.levelupOverlay.classList.remove('show');
});

// ═══════════════════════════════════════════════════════════════
// DIFFICULTY SELECTOR
// ═══════════════════════════════════════════════════════════════
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    game.difficulty = btn.dataset.diff;
    // Update Three.js intensity to preview the selected difficulty feel
    const d = getDiff();
    MAT_GLOW.emissiveIntensity   = d.threeIntensity;
    MAT_BODY.emissiveIntensity   = d.threeIntensity * 0.65;
    MAT_BRIGHT.emissiveIntensity = d.threeIntensity * 1.8;
    keyLight.color.set(d.color);
    dragonGlow.color.set(d.color);
  });
});

// ═══════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════
el.btnStart.addEventListener('click', () => {
  updateLevelHUD(false); // show level HUD immediately on first start
  goWaiting(false);
});

panels.waiting.addEventListener('click', () => {
  if (game.state !== 'waiting') return;
  clearTimeout(game.waitTimeout);
  goWaiting(true);
});

el.btnClick.addEventListener('click', e => {
  e.stopPropagation();
  if (game.state !== 'stimulus' || !game.stimulusTime) return;
  const ms = Math.round(performance.now() - game.stimulusTime);
  game.stimulusTime = null;
  goResults(ms);
});

document.addEventListener('keydown', e => {
  if (e.code !== 'Space' && e.code !== 'Enter') return;
  e.preventDefault();
  // Don't intercept if level-up overlay is open
  if (el.levelupOverlay.classList.contains('show')) {
    el.levelupOverlay.classList.remove('show');
    return;
  }
  if (game.state === 'idle')     return goWaiting(false);
  if (game.state === 'waiting')  { clearTimeout(game.waitTimeout); return goWaiting(true); }
  if (game.state === 'stimulus') return el.btnClick.click();
  if (game.state === 'results')  return goWaiting(false);
});

el.btnAgain.addEventListener('click', () => goWaiting(false));

el.btnReset.addEventListener('click', () => {
  game.rounds     = [];
  game.lastResult = null;
  game.bestEver   = null;
  game.xp         = 0;
  game.level      = 1;
  el.hud.classList.remove('visible');
  el.levelHud.classList.remove('visible');
  goIdle();
});

goIdle();