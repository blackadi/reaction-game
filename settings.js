// ═══════════════════════════════════════════════════════════════
// SETTINGS STATE
// ═══════════════════════════════════════════════════════════════
const settings = {
  musicOn: true,
  sfxOn:   true,
  musicVol: 0.30,
  sfxVol:   0.55,
};

// ── Settings panel toggle ──────────────────────────────────────
const settingsBtn   = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
let settingsOpen = false;

settingsBtn.addEventListener('click', () => {
  settingsOpen = !settingsOpen;
  settingsBtn.classList.toggle('open', settingsOpen);
  settingsPanel.classList.toggle('open', settingsOpen);
});

// Close panel when clicking outside
document.addEventListener('click', e => {
  if (settingsOpen && !settingsPanel.contains(e.target) && e.target !== settingsBtn) {
    settingsOpen = false;
    settingsBtn.classList.remove('open');
    settingsPanel.classList.remove('open');
  }
});

// ── Toggle + volume wiring ─────────────────────────────────────
const toggleMusic = document.getElementById('toggle-music');
const toggleSfx   = document.getElementById('toggle-sfx');
const musicVol    = document.getElementById('music-vol');
const sfxVol      = document.getElementById('sfx-vol');
const musicViz    = document.getElementById('music-viz');

toggleMusic.addEventListener('change', () => {
  settings.musicOn = toggleMusic.checked;
  if (settings.musicOn) {
    resumeMusic();
    musicViz.classList.remove('paused');
  } else {
    pauseMusic();
    musicViz.classList.add('paused');
  }
});

toggleSfx.addEventListener('change', () => { settings.sfxOn = toggleSfx.checked; });

musicVol.addEventListener('input', () => {
  settings.musicVol = parseFloat(musicVol.value);
  if (musicGainNode) musicGainNode.gain.setTargetAtTime(settings.musicVol, actx.currentTime, 0.05);
});

sfxVol.addEventListener('input', () => { settings.sfxVol = parseFloat(sfxVol.value); });

// ═══════════════════════════════════════════════════════════════
// WEB AUDIO ENGINE
// All sounds synthesized procedurally — zero external files.
// ═══════════════════════════════════════════════════════════════
let actx          = null;   // AudioContext (created on first interaction)
let musicGainNode = null;   // master gain for ambient music
let musicPlaying  = false;
let musicNodes    = [];     // refs to running music oscillators

// Lazy-init AudioContext (browsers require user gesture)
function getACtx() {
  if (!actx) {
    actx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}

// ── Master SFX helper ─────────────────────────────────────────
// Plays a synthesized sound described by a list of oscillator
// + envelope segments. Returns immediately (non-blocking).
function playTone({ freq=440, type='sine', attack=0.01, decay=0.1, sustain=0.3, release=0.2,
                    gainPeak=0.6, detune=0, filterFreq=null, filterQ=1, delay=0 } = {}) {
  if (!settings.sfxOn) return;
  const ctx = getACtx();
  const t   = ctx.currentTime + delay;

  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();

  if (filterFreq) {
    const filt = ctx.createBiquadFilter();
    filt.type            = 'lowpass';
    filt.frequency.value = filterFreq;
    filt.Q.value         = filterQ;
    osc.connect(filt);
    filt.connect(gain);
  } else {
    osc.connect(gain);
  }

  const masterSfx = ctx.createGain();
  masterSfx.gain.value = settings.sfxVol;
  gain.connect(masterSfx);
  masterSfx.connect(ctx.destination);

  osc.type            = type;
  osc.frequency.value = freq;
  osc.detune.value    = detune;

  // ADSR envelope
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(gainPeak, t + attack);
  gain.gain.linearRampToValueAtTime(gainPeak * sustain, t + attack + decay);
  gain.gain.setValueAtTime(gainPeak * sustain, t + attack + decay);
  gain.gain.linearRampToValueAtTime(0, t + attack + decay + release);

  osc.start(t);
  osc.stop(t + attack + decay + release + 0.05);
}

// ── SOUND EFFECTS ─────────────────────────────────────────────

// Countdown tick — light click sound during waiting state
function sfxTick() {
  playTone({ freq:800, type:'triangle', attack:0.004, decay:0.04, sustain:0.1, release:0.06, gainPeak:0.4 });
}

// Early click penalty — descending buzz
function sfxEarly() {
  playTone({ freq:220, type:'sawtooth', attack:0.01, decay:0.15, sustain:0.2, release:0.2, gainPeak:0.5, filterFreq:600 });
  playTone({ freq:180, type:'sawtooth', attack:0.01, decay:0.18, sustain:0.1, release:0.25, gainPeak:0.4, delay:0.05, filterFreq:500 });
}

// GO! stimulus — punchy rising synth stab
function sfxGo() {
  // Bright attack stab
  playTone({ freq:523, type:'square', attack:0.004, decay:0.05, sustain:0.3, release:0.12, gainPeak:0.55, filterFreq:2000 });
  // Layered fifth for richness
  playTone({ freq:784, type:'square', attack:0.005, decay:0.06, sustain:0.25, release:0.15, gainPeak:0.35, filterFreq:3000 });
  // Sub thump
  playTone({ freq:80, type:'sine', attack:0.006, decay:0.08, sustain:0.1, release:0.1, gainPeak:0.6 });
}

// Reaction registered — satisfying click/pop
function sfxClick() {
  playTone({ freq:1200, type:'sine', attack:0.003, decay:0.04, sustain:0, release:0.06, gainPeak:0.5 });
  playTone({ freq:900,  type:'sine', attack:0.003, decay:0.06, sustain:0, release:0.08, gainPeak:0.3, delay:0.02 });
}

// Excellent result — ascending arpeggio sparkle
function sfxExcellent() {
  [523, 659, 784, 1047].forEach((f, i) => {
    playTone({ freq:f, type:'sine', attack:0.01, decay:0.08, sustain:0.3, release:0.18, gainPeak:0.45, delay:i*0.07 });
  });
  // Shimmer high end
  playTone({ freq:2093, type:'sine', attack:0.015, decay:0.12, sustain:0.1, release:0.3, gainPeak:0.25, delay:0.28 });
}

// Good result — double chime
function sfxGood() {
  [659, 784].forEach((f, i) => {
    playTone({ freq:f, type:'sine', attack:0.01, decay:0.1, sustain:0.2, release:0.2, gainPeak:0.42, delay:i*0.1 });
  });
}

// Average result — neutral single tone
function sfxAverage() {
  playTone({ freq:440, type:'triangle', attack:0.01, decay:0.1, sustain:0.15, release:0.2, gainPeak:0.38 });
}

// Slow result — low warble
function sfxSlow() {
  playTone({ freq:220, type:'triangle', attack:0.02, decay:0.15, sustain:0.2, release:0.3, gainPeak:0.35 });
  playTone({ freq:196, type:'triangle', attack:0.02, decay:0.18, sustain:0.15, release:0.3, gainPeak:0.25, delay:0.08 });
}

// Level up — triumphant fanfare
function sfxLevelUp() {
  const fanfare = [523, 659, 784, 523, 659, 1047];
  fanfare.forEach((f, i) => {
    playTone({ freq:f, type:'square', attack:0.01, decay:0.08, sustain:0.4, release:0.18, gainPeak:0.4, delay:i*0.09, filterFreq:4000 });
  });
  // Bass hit
  playTone({ freq:131, type:'sine', attack:0.01, decay:0.2, sustain:0.3, release:0.4, gainPeak:0.55, delay:0.0 });
}

// New best — special sparkle sequence
function sfxNewBest() {
  [880, 1047, 1319, 1760].forEach((f, i) => {
    playTone({ freq:f, type:'sine', attack:0.008, decay:0.07, sustain:0.2, release:0.22, gainPeak:0.38, delay:i*0.06 });
  });
}

// Button hover micro-click
function sfxHover() {
  playTone({ freq:1600, type:'sine', attack:0.003, decay:0.025, sustain:0, release:0.04, gainPeak:0.18 });
}

// Difficulty select
function sfxSelect() {
  playTone({ freq:660, type:'triangle', attack:0.005, decay:0.06, sustain:0.1, release:0.1, gainPeak:0.3 });
}

// ── AMBIENT MUSIC ENGINE ──────────────────────────────────────
// A procedural drone-ambient loop built from:
// 1. Root drone pad (slow, evolving)
// 2. Harmonic fifth pad
// 3. Arpeggiated melody line (pentatonic scale, random walk)
// 4. Sub bass pulse
// All routed through a shared master gain.

const PENTA_SCALE = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00];

function startMusic() {
  if (musicPlaying || !settings.musicOn) return;
  const ctx = getACtx();
  musicPlaying = true;

  musicGainNode = ctx.createGain();
  musicGainNode.gain.setValueAtTime(0, ctx.currentTime);
  musicGainNode.gain.linearRampToValueAtTime(settings.musicVol, ctx.currentTime + 3.0);
  musicGainNode.connect(ctx.destination);

  // ── Master reverb (convolver with synthetic impulse) ─────────
  const convolver = ctx.createConvolver();
  const irLen   = ctx.sampleRate * 2.5;
  const irBuf   = ctx.createBuffer(2, irLen, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = irBuf.getChannelData(c);
    for (let i = 0; i < irLen; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/irLen, 2.2);
  }
  convolver.buffer = irBuf;

  const dryGain = ctx.createGain(); dryGain.gain.value = 0.65;
  const wetGain = ctx.createGain(); wetGain.gain.value = 0.42;
  convolver.connect(wetGain);
  wetGain.connect(musicGainNode);
  dryGain.connect(musicGainNode);

  function makeOsc(freq, type, detune=0) {
    const o = ctx.createOscillator();
    o.type = type; o.frequency.value = freq; o.detune.value = detune;
    return o;
  }
  function makeGain(val) {
    const g = ctx.createGain(); g.gain.value = val; return g;
  }

  // ── 1. Root drone — two detuned sines for shimmer ───────────
  const drone1 = makeOsc(65.41, 'sine',  0);   // C2
  const drone2 = makeOsc(65.41, 'sine', +6);   // slightly detuned
  const droneG = makeGain(0.28);
  drone1.connect(droneG); drone2.connect(droneG);
  droneG.connect(dryGain); droneG.connect(convolver);

  // Slow LFO on drone volume
  const droneLfo = makeOsc(0.18, 'sine');
  const droneLfoG = makeGain(0.08);
  droneLfo.connect(droneLfoG); droneLfoG.connect(droneG.gain);

  // ── 2. Fifth pad — G2 ────────────────────────────────────────
  const fifth1 = makeOsc(98.00, 'triangle',  0);
  const fifth2 = makeOsc(98.00, 'triangle', -8);
  const fifthG = makeGain(0.16);
  fifth1.connect(fifthG); fifth2.connect(fifthG);
  fifthG.connect(dryGain); fifthG.connect(convolver);

  // Slow LFO on fifth volume (out of phase with drone)
  const fifthLfo = makeOsc(0.13, 'sine');
  const fifthLfoG = makeGain(0.06);
  fifthLfo.connect(fifthLfoG); fifthLfoG.connect(fifthG.gain);

  // ── 3. Sub pulse — 0.5Hz rhythm ─────────────────────────────
  const sub = makeOsc(32.70, 'sine');
  const subG = makeGain(0.0);
  const subPulseLfo = makeOsc(0.5, 'sine');
  const subPulseLfoG = makeGain(0.14);
  sub.connect(subG); subG.connect(dryGain);
  subPulseLfo.connect(subPulseLfoG); subPulseLfoG.connect(subG.gain);

  // ── 4. Melody arpeggio (scheduled notes) ─────────────────────
  const melodyG = makeGain(0.0);
  melodyG.connect(dryGain); melodyG.connect(convolver);

  let melodyIdx  = 0;
  let melodyDir  = 1;
  let melodyTime = ctx.currentTime + 1.5;
  const NOTE_LEN = 0.55;
  const NOTE_GAP = 0.70;
  let melodyTimer;

  function scheduleNote() {
    if (!musicPlaying) return;
    const now = ctx.currentTime;

    // Random walk up/down pentatonic
    melodyIdx += melodyDir;
    if (melodyIdx >= PENTA_SCALE.length - 1) { melodyDir = -1; melodyIdx = PENTA_SCALE.length - 2; }
    if (melodyIdx <= 0)                       { melodyDir =  1; melodyIdx = 1; }

    // Occasionally skip to a random note
    if (Math.random() < 0.2) melodyIdx = Math.floor(Math.random() * PENTA_SCALE.length);

    const freq = PENTA_SCALE[melodyIdx] * 2; // up an octave for brightness
    const osc  = ctx.createOscillator();
    const env  = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    env.gain.setValueAtTime(0, melodyTime);
    env.gain.linearRampToValueAtTime(0.18, melodyTime + 0.04);
    env.gain.linearRampToValueAtTime(0.10, melodyTime + NOTE_LEN * 0.6);
    env.gain.linearRampToValueAtTime(0,    melodyTime + NOTE_LEN);
    osc.connect(env); env.connect(melodyG);
    osc.start(melodyTime); osc.stop(melodyTime + NOTE_LEN + 0.05);

    melodyTime += NOTE_GAP;
    musicNodes.push(osc);

    melodyTimer = setTimeout(scheduleNote, NOTE_GAP * 1000 * 0.8);
  }

  // Start all oscillators
  [drone1, drone2, droneLfo, fifth1, fifth2, fifthLfo, sub, subPulseLfo].forEach(o => {
    o.start(); musicNodes.push(o);
  });

  setTimeout(scheduleNote, 1500);
  musicViz.classList.remove('paused');

  // Store timer so we can clear it
  musicNodes._melodyTimer = melodyTimer;
}

function pauseMusic() {
  if (!musicPlaying) return;
  if (musicGainNode) {
    musicGainNode.gain.setTargetAtTime(0, actx.currentTime, 0.4);
  }
  setTimeout(() => {
    musicNodes.forEach(o => { try { o.stop(); } catch(e){} });
    musicNodes = [];
    musicPlaying = false;
  }, 600);
  musicViz.classList.add('paused');
}

function resumeMusic() {
  if (musicPlaying) return;
  startMusic();
}

// ── Wire SFX to game events ───────────────────────────────────
// We hook into the existing game functions by wrapping them.

// Intercept goWaiting to play tick & early sounds
const _origGoWaiting = goWaiting;
window.goWaiting = function(isRetry = false) {
  _origGoWaiting(isRetry);
  if (isRetry) sfxEarly();
};
// Override globally
goWaiting = window.goWaiting;

// Intercept goStimulus for GO sound
const _origGoStimulus = goStimulus;
window.goStimulus = function() {
  _origGoStimulus();
  sfxGo();
};
goStimulus = window.goStimulus;

// Intercept goResults for reaction + result sounds
const _origGoResults = goResults;
window.goResults = function(ms) {
  sfxClick();
  setTimeout(() => {
    const perf = ms < 200 ? 'excellent' : ms < 350 ? 'good' : ms < 500 ? 'average' : 'slow';
    if (perf === 'excellent') sfxExcellent();
    else if (perf === 'good') sfxGood();
    else if (perf === 'average') sfxAverage();
    else sfxSlow();
  }, 120);
  _origGoResults(ms);
};
goResults = window.goResults;

// Level-up sound via MutationObserver on overlay
const luObserver = new MutationObserver(muts => {
  muts.forEach(m => {
    if (m.target.classList.contains('show')) sfxLevelUp();
  });
});
luObserver.observe(document.getElementById('levelup-overlay'), { attributes: true, attributeFilter: ['class'] });

// New best sound via badge visibility change
const bestObserver = new MutationObserver(() => {
  const badge = document.getElementById('result-best-badge');
  if (badge.style.display !== 'none') sfxNewBest();
});
bestObserver.observe(document.getElementById('result-best-badge'), { attributes: true, attributeFilter: ['style'] });

// Hover micro-feedback on primary buttons
document.querySelectorAll('.btn-primary, .diff-btn').forEach(btn => {
  btn.addEventListener('mouseenter', () => sfxHover());
});
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => sfxSelect());
});

// ── Start music on first user interaction ─────────────────────
let audioStarted = false;
function initAudio() {
  if (audioStarted) return;
  audioStarted = true;
  startMusic();
}
document.addEventListener('click',      initAudio, { once: false });
document.addEventListener('touchstart', initAudio, { once: false });

// ── Scheduled countdown ticks during waiting state ────────────
let tickInterval = null;

const _origShowPanel = showPanel;
window.showPanel = function(name) {
  _origShowPanel(name);
  // Start ticking when waiting
  if (name === 'waiting') {
    clearInterval(tickInterval);
    // Ticks every 800ms while waiting — creates tension
    tickInterval = setInterval(() => {
      if (game.state === 'waiting') sfxTick();
      else clearInterval(tickInterval);
    }, 800);
  } else {
    clearInterval(tickInterval);
  }
};
showPanel = window.showPanel;