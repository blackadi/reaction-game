// ── Renderer ─────────────────────────────────────────────────
const canvas   = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x060A14, 1);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 7;
scene.fog = new THREE.FogExp2(0x060A14, 0.045);

// ── Lights ────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x0a1a2e, 1.0));

// Key light — cyan, mimics the reference image glow
const keyLight = new THREE.PointLight(0x00d4ff, 8, 30);
keyLight.position.set(2, 2, 4);
scene.add(keyLight);

// Fill light — deep blue
const fillLight = new THREE.PointLight(0x0044aa, 4, 25);
fillLight.position.set(-4, -1, 2);
scene.add(fillLight);

// Rim light — bright white/cyan from behind
const rimLight = new THREE.PointLight(0x88eeff, 5, 20);
rimLight.position.set(0, 4, -3);
scene.add(rimLight);

// Dragon body glow light — tracks dragon position
const dragonGlow = new THREE.PointLight(0x00d4ff, 6, 14);
scene.add(dragonGlow);

// ────────────────────────────────────────────────────────────
// GLOWING ENERGY DRAGON
// Inspired by the reference: S-curve coiled body, tribal
// swept-back wings, glowing cyan/white emissive materials,
// sharp angular head, energy trail particles
// ────────────────────────────────────────────────────────────

const dragonGroup = new THREE.Group();
scene.add(dragonGroup);

// Shared materials — high emissive for the glowing neon look
const MAT_GLOW   = new THREE.MeshStandardMaterial({ color:0x00d4ff, emissive:0x00d4ff, emissiveIntensity:1.2, roughness:0.15, metalness:0.7 });
const MAT_BRIGHT = new THREE.MeshStandardMaterial({ color:0xaaf4ff, emissive:0xaaf4ff, emissiveIntensity:2.0, roughness:0.05, metalness:0.9 });
const MAT_BODY   = new THREE.MeshStandardMaterial({ color:0x00a8cc, emissive:0x006688, emissiveIntensity:0.8, roughness:0.2, metalness:0.75 });
const MAT_WING   = new THREE.MeshStandardMaterial({ color:0x003d55, emissive:0x005577, emissiveIntensity:0.5, roughness:0.6, metalness:0.1, transparent:true, opacity:0.82, side:THREE.DoubleSide });
const MAT_ACCENT = new THREE.MeshStandardMaterial({ color:0xffffff, emissive:0x88ffff, emissiveIntensity:2.5, roughness:0.0, metalness:1.0 });

function geoAdd(geo, mat, px, py, pz, rx=0, ry=0, rz=0, sx=1, sy=1, sz=1) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(px, py, pz);
  m.rotation.set(rx, ry, rz);
  m.scale.set(sx, sy, sz);
  dragonGroup.add(m);
  return m;
}

// ── S-CURVE BODY ─────────────────────────────────────────────
// The reference shows an S/coil shape. We lay out spine points
// along an S-curve, each segment a tapered glowing ellipsoid.
const spinePoints = [
  // [x,    y,     z,    sx,   sy,   sz,   rz]   <- S-curve from neck to tail
  [-0.2,   1.6,   0,   0.30, 0.28, 0.30,  0.0 ],  // neck top
  [ 0.1,   1.1,   0,   0.35, 0.32, 0.32,  0.15],  // upper neck
  [ 0.35,  0.5,   0,   0.42, 0.38, 0.38,  0.3 ],  // chest (wide)
  [ 0.2,  -0.1,   0,   0.45, 0.40, 0.40,  0.1 ],  // belly (widest)
  [-0.1,  -0.65,  0,   0.40, 0.36, 0.36, -0.15],  // lower belly
  [-0.4,  -1.2,   0,   0.34, 0.30, 0.30, -0.35],  // hip
  [-0.5,  -1.75,  0,   0.24, 0.22, 0.22, -0.5 ],  // tail base
  [-0.35, -2.2,   0,   0.16, 0.14, 0.14, -0.3 ],  // tail mid
  [-0.1,  -2.6,   0,   0.10, 0.09, 0.09,  0.0 ],  // tail tip
];
spinePoints.forEach(([px,py,pz,sx,sy,sz,rz]) => {
  geoAdd(new THREE.SphereGeometry(0.5, 10, 8), MAT_BODY, px, py, pz, 0, 0, rz, sx, sy, sz);
});

// Bright ridge line along top of body (dorsal glow strip)
const ridgePoints = [[-0.15,1.7,0],[ 0.15,1.2,0],[0.4,0.6,0],[0.3,-0.0,0],[0.0,-0.6,0],[-0.35,-1.15,0]];
ridgePoints.forEach(([px,py,pz]) => {
  geoAdd(new THREE.SphereGeometry(0.065, 7, 6), MAT_BRIGHT, px, py+0.18, pz);
});

// ── HEAD — angular, dragon-like ──────────────────────────────
// Upper skull
geoAdd(new THREE.SphereGeometry(0.38, 10, 8), MAT_BODY, -0.45, 2.15, 0, 0,0,-0.3, 1.15, 0.88, 1.0);
// Snout — elongated forward
geoAdd(new THREE.SphereGeometry(0.22, 8, 6), MAT_BODY, -0.80, 2.08, 0, 0,0,-0.15, 1.55, 0.68, 0.85);
// Lower jaw
geoAdd(new THREE.SphereGeometry(0.18, 8, 6), MAT_BODY, -0.76, 1.90, 0, 0,0,-0.10, 1.4, 0.55, 0.80);
// Jaw accent glow line
geoAdd(new THREE.SphereGeometry(0.06, 6, 5), MAT_BRIGHT, -0.85, 1.98, 0);
geoAdd(new THREE.SphereGeometry(0.04, 6, 5), MAT_BRIGHT, -1.02, 1.94, 0);

// ── EYES — bright glowing ────────────────────────────────────
geoAdd(new THREE.SphereGeometry(0.072, 8, 7), MAT_ACCENT, -0.62, 2.22,  0.20);
geoAdd(new THREE.SphereGeometry(0.072, 8, 7), MAT_ACCENT, -0.62, 2.22, -0.20);
// Inner iris glow dot
geoAdd(new THREE.SphereGeometry(0.038, 7, 6), new THREE.MeshStandardMaterial({ color:0xffffff, emissive:0xffffff, emissiveIntensity:4, roughness:0 }), -0.68, 2.22,  0.21);
geoAdd(new THREE.SphereGeometry(0.038, 7, 6), new THREE.MeshStandardMaterial({ color:0xffffff, emissive:0xffffff, emissiveIntensity:4, roughness:0 }), -0.68, 2.22, -0.21);

// ── HORNS — swept back, glowing tips ─────────────────────────
// Main horns — curved shape using tapered cones
geoAdd(new THREE.ConeGeometry(0.058, 0.55, 6), MAT_GLOW, -0.28, 2.55,  0.18, 0, 0, -0.55);
geoAdd(new THREE.ConeGeometry(0.058, 0.55, 6), MAT_GLOW, -0.28, 2.55, -0.18, 0, 0, -0.55);
// Secondary horns
geoAdd(new THREE.ConeGeometry(0.038, 0.35, 5), MAT_GLOW, -0.14, 2.52,  0.30, 0, 0.2, -0.7);
geoAdd(new THREE.ConeGeometry(0.038, 0.35, 5), MAT_GLOW, -0.14, 2.52, -0.30, 0,-0.2, -0.7);
// Horn tips — bright accent
geoAdd(new THREE.SphereGeometry(0.03, 6, 5), MAT_ACCENT, -0.10, 2.84,  0.28);
geoAdd(new THREE.SphereGeometry(0.03, 6, 5), MAT_ACCENT, -0.10, 2.84, -0.28);

// ── DORSAL SPINES ────────────────────────────────────────────
const spineData = [
  [-0.05, 1.92, 0, 0, 0,-0.05, 0.04, 0.28, 0.04],
  [ 0.22, 0.72, 0, 0, 0, 0.20, 0.04, 0.30, 0.04],
  [ 0.18, 0.08, 0, 0, 0, 0.25, 0.04, 0.26, 0.04],
  [-0.05,-0.52, 0, 0, 0, 0.10, 0.03, 0.22, 0.03],
  [-0.30,-1.05, 0, 0, 0,-0.10, 0.03, 0.18, 0.03],
];
spineData.forEach(([px,py,pz,rx,ry,rz,sx,sy,sz]) => {
  geoAdd(new THREE.ConeGeometry(1, 1, 5), MAT_GLOW, px, py, pz, rx, ry, rz, sx, sy, sz);
});

// ── WINGS — tribal swept fan shape ───────────────────────────
// Inspired by the reference: large swept-back bat-like wings
// built from multiple overlapping membrane panels + bright edge lines
function buildGlowWing(side) { // side: 1 = right (+z), -1 = left (-z)
  const wg = new THREE.Group();

  // Main arm bone — sweeps outward and back
  const armAngle = side * 1.1;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 1.4, 7), MAT_GLOW);
  arm.position.set(0.3, 0.5, side * 0.15);
  arm.rotation.set(0.1, side * 0.35, side * -0.7);
  wg.add(arm);

  // Three finger spars fanning out
  const sparAngles = [0.0, 0.45, 0.85];
  sparAngles.forEach((fa, fi) => {
    const sparLen = 1.6 - fi * 0.22;
    const spar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.012, sparLen, 5), MAT_GLOW);
    spar.position.set(0.35, 0.7 - fi*0.15, side * (0.55 + fi * 0.45));
    spar.rotation.set(fa * 0.25, side * 0.25, side * (-0.9 + fa * 0.35));
    wg.add(spar);

    // Glowing spar tip
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), MAT_ACCENT);
    tip.position.set(
      spar.position.x + Math.sin(spar.rotation.z) * sparLen * 0.45,
      spar.position.y + Math.cos(spar.rotation.z) * sparLen * 0.45,
      spar.position.z + side * sparLen * 0.2
    );
    wg.add(tip);
  });

  // Wing membrane panels — three overlapping dark panels with glowing edges
  const panelDefs = [
    { w:1.1, h:0.012, d:0.7, px:0.3,  py:0.7,  pz:side*0.65,  rx:0.15, ry:side*0.2,  rz:side*-0.75 },
    { w:0.9, h:0.012, d:0.6, px:0.25, py:0.55, pz:side*1.1,  rx:0.2,  ry:side*0.25, rz:side*-0.85 },
    { w:0.7, h:0.012, d:0.5, px:0.2,  py:0.4,  pz:side*1.55, rx:0.25, ry:side*0.3,  rz:side*-0.95 },
  ];
  panelDefs.forEach(d => {
    const pm = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, d.d), MAT_WING);
    pm.position.set(d.px, d.py, d.pz);
    pm.rotation.set(d.rx, d.ry, d.rz);
    wg.add(pm);
    // Edge glow line along top of each panel
    const edgeMat = new THREE.MeshStandardMaterial({ color:0x00d4ff, emissive:0x00d4ff, emissiveIntensity:1.5, roughness:0.1 });
    const edge = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.95, 0.02, 0.025), edgeMat);
    edge.position.set(d.px, d.py + 0.04, d.pz);
    edge.rotation.set(d.rx, d.ry, d.rz);
    wg.add(edge);
  });

  // Lower membrane connecting body to wing (armpit fill)
  const fillMem = new THREE.Mesh(new THREE.SphereGeometry(0.5, 7, 5), MAT_WING);
  fillMem.position.set(0.32, 0.2, side * 0.3);
  fillMem.scale.set(0.7, 1.1, 0.25);
  wg.add(fillMem);

  dragonGroup.add(wg);
  return wg;
}

const wingR = buildGlowWing( 1);
const wingL = buildGlowWing(-1);

// ── FRONT CLAWS ──────────────────────────────────────────────
[[ 0.4, -0.5,  0.22], [ 0.4, -0.5, -0.22]].forEach(([px,py,pz]) => {
  geoAdd(new THREE.CylinderGeometry(0.05, 0.04, 0.38, 6), MAT_BODY, px, py, pz, 0.4, 0, 0);
  [-0.07, 0, 0.07].forEach(cx =>
    geoAdd(new THREE.ConeGeometry(0.022, 0.16, 5), MAT_ACCENT, px+cx, py-0.22, pz, 0.7, 0, 0)
  );
});

// ── REAR LEGS ────────────────────────────────────────────────
[[-0.45, -1.15,  0.26], [-0.45, -1.15, -0.26]].forEach(([px,py,pz]) => {
  geoAdd(new THREE.CylinderGeometry(0.055, 0.04, 0.42, 6), MAT_BODY, px, py, pz, 0.35, 0, 0);
  [-0.06, 0, 0.06].forEach(cx =>
    geoAdd(new THREE.ConeGeometry(0.02, 0.14, 5), MAT_ACCENT, px+cx, py-0.24, pz, 0.7, 0, 0)
  );
});

// ── TAIL TIP — spade/flame shape ─────────────────────────────
geoAdd(new THREE.TetrahedronGeometry(0.18, 0), MAT_GLOW, 0.0, -2.78, 0, 0, 0, Math.PI * 0.15);
geoAdd(new THREE.SphereGeometry(0.06, 7, 6), MAT_ACCENT, 0.0, -2.96, 0);

// ── ENERGY PARTICLES along body (tribal glow effect) ─────────
const energyCount = 40;
const energyGeo   = new THREE.BufferGeometry();
const energyPos   = new Float32Array(energyCount * 3);
const energyVel   = [];
for (let i = 0; i < energyCount; i++) {
  // Distribute along the S-curve spine
  const t  = i / energyCount;
  const sx = (Math.sin(t * Math.PI * 1.5) * 0.5 - 0.1);
  const sy = 2.0 - t * 4.8;
  energyPos[i*3]   = sx + (Math.random()-0.5)*0.4;
  energyPos[i*3+1] = sy + (Math.random()-0.5)*0.3;
  energyPos[i*3+2] = (Math.random()-0.5)*0.3;
  energyVel.push({ vx:(Math.random()-0.5)*0.01, vy:(Math.random())*0.012+0.003, life:Math.random() });
}
energyGeo.setAttribute('position', new THREE.BufferAttribute(energyPos, 3));
const energyParticles = new THREE.Points(energyGeo, new THREE.PointsMaterial({ color:0x00d4ff, size:0.06, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false }));
dragonGroup.add(energyParticles);

// ── AMBIENT SPARK TRAIL behind dragon ────────────────────────
const sparkCount = 80;
const sparkGeo   = new THREE.BufferGeometry();
const sparkPos   = new Float32Array(sparkCount * 3);
for (let i = 0; i < sparkCount; i++) {
  sparkPos[i*3]   = (Math.random()-0.5)*1.5;
  sparkPos[i*3+1] = (Math.random()-0.5)*5.5;
  sparkPos[i*3+2] = (Math.random()-0.5)*0.5;
}
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
const sparkParticles = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color:0x88eeff, size:0.03, transparent:true, opacity:0.7, blending:THREE.AdditiveBlending, depthWrite:false }));
dragonGroup.add(sparkParticles);

// ────────────────────────────────────────────────────────────
// BACKGROUND SHAPES (smaller, don't compete with dragon)
// ────────────────────────────────────────────────────────────

// Crystal octahedron — right background
const crystalGroup = new THREE.Group();
crystalGroup.position.set(4.5, 0.5, -3.0);
scene.add(crystalGroup);
const coreMat = new THREE.MeshStandardMaterial({ color:0x005588, emissive:0x003355, emissiveIntensity:0.5, roughness:0.1, metalness:0.9 });
crystalGroup.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 1), coreMat));
crystalGroup.add((() => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 1), new THREE.MeshBasicMaterial({ color:0x00aadd, wireframe:true, transparent:true, opacity:0.12 })); return m; })());

// DNA helix — left background
const helixGroup = new THREE.Group();
helixGroup.position.set(-5.0, 0, -3.5);
scene.add(helixGroup);
for (let strand = 0; strand < 2; strand++) {
  const phOff = strand * Math.PI;
  const col   = strand === 0 ? 0x0088aa : 0x005577;
  for (let i = 0; i < 16; i++) {
    const tt = i/15, ang = tt*Math.PI*3+phOff;
    const sph = new THREE.Mesh(new THREE.SphereGeometry(0.065, 7, 7), new THREE.MeshStandardMaterial({ color:col, emissive:col, emissiveIntensity:0.6, roughness:0.1 }));
    sph.position.set(Math.cos(ang)*0.5, (tt-0.5)*4.2, Math.sin(ang)*0.5);
    helixGroup.add(sph);
  }
}

// Orrery — bottom
const orreryGroup = new THREE.Group();
orreryGroup.position.set(1.0, -4.2, -3.0);
scene.add(orreryGroup);
[[0x0088aa,0,0],[0x0055aa,Math.PI/2,0],[0x006688,Math.PI/4,Math.PI/4]].forEach(([col,rx,rz]) => {
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.018, 12, 64), new THREE.MeshStandardMaterial({ color:col, emissive:col, emissiveIntensity:0.6, roughness:0.1, metalness:0.8 }));
  m.rotation.set(rx, 0, rz);
  orreryGroup.add(m);
});
orreryGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), new THREE.MeshStandardMaterial({ color:0xffffff, emissive:0x00d4ff, emissiveIntensity:1.5, roughness:0 })));

// Global particle field
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(200 * 3);
for (let i = 0; i < 200; i++) { pPos[i*3]=(Math.random()-0.5)*28; pPos[i*3+1]=(Math.random()-0.5)*28; pPos[i*3+2]=(Math.random()-0.5)*16; }
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color:0x336688, size:0.028, transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, depthWrite:false })));

// ── Visual state machine ──────────────────────────────────────
const vState = { current:'idle', targetEmissive: new THREE.Color(0x006688), exploding:false, explodeT:0 };
const PERF_HEX = { excellent:0x00d4ff, good:0x10B981, average:0xF59E0B, slow:0xF43F5E };

function setThreeState(state, perfKey) {
  vState.current = state;
  const glowCol = state==='waiting' ? 0x003355 : state==='results' ? (PERF_HEX[perfKey]||PERF_HEX.good) : 0x00d4ff;
  keyLight.color.set(state==='waiting' ? 0x001a33 : glowCol);
  dragonGlow.color.set(glowCol);
  if (state==='stimulus') { vState.exploding=true; vState.explodeT=0; }
  // Update dragon emissive materials
  const ei = state==='waiting' ? 0.3 : state==='stimulus' ? 2.5 : 1.2;
  MAT_GLOW.emissiveIntensity   = ei;
  MAT_BODY.emissiveIntensity   = ei * 0.65;
  MAT_BRIGHT.emissiveIntensity = ei * 1.8;
}

// ── Animation loop ────────────────────────────────────────────
const clock = new THREE.Clock();
// Dragon flight — figure-8 path
let flightT = 0;

function animate() {
  requestAnimationFrame(animate);
  const t  = clock.getElapsedTime();
  const st = vState.current;

  // ── Dragon flight path ──────────────────────────────────────
  const spd = st==='stimulus' ? 0.007 : st==='waiting' ? 0.002 : 0.004;
  flightT += spd;

  // Elegant figure-8: Lissajous x=sin(t), y=sin(2t)/2
  const fx = Math.sin(flightT)       * 4.2;
  const fy = Math.sin(flightT*2+0.4) * 2.0;
  const fz = Math.cos(flightT*0.8)   * 2.5 - 0.8;

  dragonGroup.position.set(fx, fy, fz);

  // Orientation: face the direction of travel
  const vx = Math.cos(flightT)       * 4.2;
  const vy = Math.cos(flightT*2+0.4) * 4.0;
  const vz = -Math.sin(flightT*0.8)  * 2.0;
  const vel = new THREE.Vector3(vx, vy, vz);
  if (vel.length() > 0.01) {
    vel.normalize();
    const right = new THREE.Vector3().crossVectors(vel, new THREE.Vector3(0,1,0)).normalize();
    const upVec = new THREE.Vector3().crossVectors(right, vel);
    const rm = new THREE.Matrix4().makeBasis(right, upVec, vel.clone().negate());
    const tq = new THREE.Quaternion().setFromRotationMatrix(rm);
    dragonGroup.quaternion.slerp(tq, 0.06);
  }

  // Wing flap
  const flapSpd = st==='stimulus' ? 5.0 : 2.8;
  const flapAmt = Math.sin(t * flapSpd) * 0.42 + (st==='stimulus' ? 0.25 : 0.05);
  wingR.rotation.z =  flapAmt;
  wingL.rotation.z = -flapAmt;

  // Explosive burst on GO
  if (vState.exploding) {
    vState.explodeT += 0.05;
    dragonGroup.scale.setScalar(1 + Math.sin(vState.explodeT * Math.PI) * 0.4);
    if (vState.explodeT >= 1) { vState.exploding = false; dragonGroup.scale.setScalar(1); }
  }

  // Animate energy particles (drift upward, reset when off-body)
  const ePos = energyParticles.geometry.attributes.position.array;
  for (let i = 0; i < energyCount; i++) {
    ePos[i*3+1] += energyVel[i].vy * (st==='stimulus' ? 2.5 : 1.0);
    ePos[i*3]   += energyVel[i].vx;
    energyVel[i].life += 0.02;
    if (energyVel[i].life > 1) {
      // Reset to spine position
      const tt2 = (i / energyCount);
      ePos[i*3]   = Math.sin(tt2 * Math.PI * 1.5) * 0.5 - 0.1 + (Math.random()-0.5)*0.4;
      ePos[i*3+1] = 2.0 - tt2 * 4.8 + (Math.random()-0.5)*0.3;
      ePos[i*3+2] = (Math.random()-0.5)*0.3;
      energyVel[i].life = 0;
    }
  }
  energyParticles.geometry.attributes.position.needsUpdate = true;

  // Dragon glow follows dragon
  dragonGlow.position.copy(dragonGroup.position);
  dragonGlow.intensity = st==='stimulus' ? 10 : st==='waiting' ? 1.5 : 4;

  // ── Background shapes ────────────────────────────────────────
  crystalGroup.rotation.y = t * 0.18;
  crystalGroup.rotation.x = Math.sin(t*0.12)*0.1;

  helixGroup.rotation.y = t * (st==='stimulus' ? 0.9 : 0.3);
  helixGroup.position.y = Math.sin(t*0.3)*0.3;

  const rSpd = st==='stimulus' ? 2.5 : 0.6;
  orreryGroup.children[0].rotation.z = t * rSpd;
  orreryGroup.children[1].rotation.x = t * rSpd * 0.7;
  orreryGroup.children[2].rotation.y = t * rSpd * 0.5;
  orreryGroup.position.y = -4.2 + Math.sin(t*0.4)*0.35;

  // ── Camera gentle drift ──────────────────────────────────────
  camera.position.x = Math.sin(t*0.07) * 0.3;
  camera.position.y = Math.cos(t*0.09) * 0.2;

  renderer.render(scene, camera);
}

animate();

// ── Responsive resize ─────────────────────────────────────────
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener('resize', onResize);
// Also handle orientation change on mobile
window.addEventListener('orientationchange', () => setTimeout(onResize, 150));