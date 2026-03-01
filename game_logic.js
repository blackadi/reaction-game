const MAX_ROUNDS = 5;
const game = { state:'idle', stimulusTime:null, waitTimeout:null, rounds:[], bestEver:null, lastResult:null };

const panels = {
  idle:     document.getElementById('state-idle'),
  waiting:  document.getElementById('state-waiting'),
  stimulus: document.getElementById('state-stimulus'),
  results:  document.getElementById('state-results'),
};

const el = {
  btnStart:        document.getElementById('btn-start'),
  btnClick:        document.getElementById('btn-click'),
  btnAgain:        document.getElementById('btn-again'),
  btnReset:        document.getElementById('btn-reset'),
  earlyWarning:    document.getElementById('early-warning'),
  resultTime:      document.getElementById('result-time'),
  resultLabel:     document.getElementById('result-label'),
  resultAvg:       document.getElementById('result-avg'),
  resultBest:      document.getElementById('result-best'),
  resultRounds:    document.getElementById('result-rounds'),
  resultBestBadge: document.getElementById('result-best-badge'),
  waitingDots:     document.getElementById('waiting-dots'),
  resultDots:      document.getElementById('result-dots'),
  hud:             document.getElementById('score-hud'),
  hudBest:         document.getElementById('hud-best-val'),
  hudAvg:          document.getElementById('hud-avg-val'),
  hudRounds:       document.getElementById('hud-rounds-val'),
};

const PERF_CSS = { excellent:'var(--accent)', good:'var(--success)', average:'var(--warning)', slow:'var(--danger)' };

function showPanel(name) { Object.entries(panels).forEach(([k,p])=>p.classList.toggle('active',k===name)); game.state=name; }
function classify(ms) {
  if (ms<200) return { key:'excellent', label:'⚡ Excellent!',       cls:'perf-excellent' };
  if (ms<350) return { key:'good',      label:'✅ Good Reflexes',    cls:'perf-good'      };
  if (ms<500) return { key:'average',   label:'👌 Average',          cls:'perf-average'   };
              return { key:'slow',      label:'🐢 Keep Practicing',  cls:'perf-slow'      };
}
function renderDots(container, filled) {
  container.innerHTML='';
  for(let i=0;i<MAX_ROUNDS;i++){const d=document.createElement('div');d.className='dot'+(i<filled?' filled':'');container.appendChild(d);}
}
function avg(arr) { return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : null; }

function updateHUD() {
  el.hudBest.textContent   = game.bestEver + 'ms';
  el.hudBest.style.color   = PERF_CSS[classify(game.bestEver).key];
  el.hudAvg.textContent    = avg(game.rounds) + 'ms';
  el.hudRounds.textContent = game.rounds.length;
  el.hud.classList.add('visible');
}

function goIdle()   { showPanel('idle');   setThreeState('idle'); }
function goWaiting(isRetry=false) {
  showPanel('waiting'); setThreeState('waiting');
  el.earlyWarning.textContent = isRetry ? '⚠️ Too early! Wait for GO…' : '';
  renderDots(el.waitingDots, game.rounds.length);
  game.waitTimeout = setTimeout(goStimulus, 1500 + Math.random()*2500);
}
function goStimulus() { showPanel('stimulus'); setThreeState('stimulus'); game.stimulusTime=performance.now(); }
function goResults(ms) {
  game.lastResult=ms; game.rounds.push(ms);
  const isNewBest = game.bestEver===null || ms<game.bestEver;
  if(isNewBest) game.bestEver=ms;
  const perf=classify(ms);
  el.resultTime.textContent     = ms;
  el.resultTime.className       = 'result-time '+perf.cls;
  el.resultLabel.textContent    = perf.label;
  el.resultLabel.className      = 'result-label '+perf.cls;
  el.resultAvg.textContent      = avg(game.rounds)+'ms';
  el.resultBest.textContent     = game.bestEver+'ms';
  el.resultRounds.textContent   = game.rounds.length;
  el.resultBestBadge.style.display = (isNewBest&&game.rounds.length>1)?'inline-block':'none';
  el.btnAgain.style.display     = game.rounds.length>=MAX_ROUNDS?'none':'inline-block';
  renderDots(el.resultDots, game.rounds.length);
  updateHUD();
  showPanel('results'); setThreeState('results', perf.key);
}

// Event listeners — support both click and touch
el.btnStart.addEventListener('click', ()=>goWaiting(false));

panels.waiting.addEventListener('click', ()=>{
  if(game.state!=='waiting') return;
  clearTimeout(game.waitTimeout); goWaiting(true);
});

el.btnClick.addEventListener('click', e=>{
  e.stopPropagation();
  if(game.state!=='stimulus'||!game.stimulusTime) return;
  const ms=Math.round(performance.now()-game.stimulusTime);
  game.stimulusTime=null; goResults(ms);
});

// Keyboard support
document.addEventListener('keydown', e=>{
  if(e.code!=='Space'&&e.code!=='Enter') return;
  e.preventDefault();
  if(game.state==='idle')     return goWaiting(false);
  if(game.state==='waiting')  { clearTimeout(game.waitTimeout); return goWaiting(true); }
  if(game.state==='stimulus') return el.btnClick.click();
  if(game.state==='results')  return goWaiting(false);
});

el.btnAgain.addEventListener('click', ()=>goWaiting(false));
el.btnReset.addEventListener('click', ()=>{
  game.rounds=[]; game.lastResult=null; game.bestEver=null;
  el.hud.classList.remove('visible');
  goIdle();
});

goIdle();