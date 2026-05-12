'use strict';

// Owns all simulation state. Runs the tick at 30 fps. Posts snapshots to the main
// thread for rendering. Receives params updates, food clicks, resize, and reset.

const SENSOR_DIST = 28;
const SENSOR_ANGLE = 0.8;
const COHESION_CELL = 32;
const PHERO_CELL = 12;
const EVAP_EVERY = 3;
const DRAW_PHERO_EVERY = 4;
const TICK_MS = 1000 / 30;
const MAX_FOOD = 40;

let viewport = { W: 800, H: 600 };
let params = null;

const phero = {
  cols: 0, rows: 0,
  food: null,
  home: null,
};
let evapTick = 0;
let frameCount = 0;

const sim = {
  nest: null,
  queen: null,
  ants: [],
  food: [],
  particles: [],
  stats: { stored: 0, born: 0 },
  foodAccum: 0,
};

let foodIdSeq = 1;
const cohesionGrid = new Map();
const bucketPool = [];

// ─── pheromones ──────────────────────────────────────────────────────────────

function initPheromones() {
  const { W, H } = viewport;
  phero.cols = Math.ceil(W / PHERO_CELL);
  phero.rows = Math.ceil(H / PHERO_CELL);
  const n = phero.cols * phero.rows;
  phero.food = new Float32Array(n);
  phero.home = new Float32Array(n);
}

function deposit(grid, x, y, amount) {
  if (!grid) return;
  const col = (x / PHERO_CELL) | 0;
  const row = (y / PHERO_CELL) | 0;
  if (col >= 0 && col < phero.cols && row >= 0 && row < phero.rows) {
    const i = row * phero.cols + col;
    const v = grid[i] + amount;
    grid[i] = v < 1 ? v : 1;
  }
}

function sample(grid, x, y) {
  if (!grid) return 0;
  const col = (x / PHERO_CELL) | 0;
  const row = (y / PHERO_CELL) | 0;
  if (col < 0 || col >= phero.cols || row < 0 || row >= phero.rows) return 0;
  return grid[row * phero.cols + col];
}

function evaporate(dt, rate) {
  if (++evapTick % EVAP_EVERY !== 0) return;
  const f = 1 - rate * dt * EVAP_EVERY;
  const { food, home } = phero;
  for (let i = 0, n = food.length; i < n; i++) {
    food[i] *= f;
    home[i] *= f;
  }
}

// ─── entities ────────────────────────────────────────────────────────────────

function spawnAnt() {
  const { nest } = sim;
  const a = Math.random() * Math.PI * 2;
  const d = nest.r + Math.random() * 10;
  sim.ants.push({
    x: nest.x + Math.cos(a) * d,
    y: nest.y + Math.sin(a) * d,
    vx: 0, vy: 0,
    angle: a,
    legPhase: Math.random() * Math.PI * 2,
    carrying: null,
    target: null,
    wander: Math.random() * Math.PI * 2,
    size: 0.85 + Math.random() * 0.3,
  });
}

function spawnFood(x, y) {
  const { W, H } = viewport;
  sim.food.push({
    id: foodIdSeq++,
    x: x ?? Math.random() * W,
    y: y ?? Math.random() * H,
    r: 4 + Math.random() * 3,
    claimed: false,
    bob: Math.random() * Math.PI * 2,
    hue: Math.random() < 0.7 ? 'green' : 'red',
  });
}

function initSim() {
  const { W, H } = viewport;
  sim.nest = { x: W / 2, y: H / 2, r: 38 };
  sim.queen = { x: sim.nest.x, y: sim.nest.y, fed: 0, wobble: 0 };
  sim.ants = [];
  sim.food = [];
  sim.particles = [];
  sim.stats.stored = 0;
  sim.stats.born = 0;
  sim.foodAccum = 0;
  for (let i = 0; i < params.colonySize; i++) spawnAnt();
}

// ─── physics ─────────────────────────────────────────────────────────────────

function rebuildCohesionGrid(ants) {
  for (const bucket of cohesionGrid.values()) {
    bucket.length = 0;
    bucketPool.push(bucket);
  }
  cohesionGrid.clear();
  for (const ant of ants) {
    const cx = (ant.x / COHESION_CELL) | 0;
    const cy = (ant.y / COHESION_CELL) | 0;
    const key = cx * 4096 + cy;
    let bucket = cohesionGrid.get(key);
    if (bucket === undefined) {
      bucket = bucketPool.pop() ?? [];
      cohesionGrid.set(key, bucket);
    }
    bucket.push(ant);
  }
}

function update(dt) {
  const { nest, queen, ants, food, stats } = sim;
  const { W, H } = viewport;

  sim.foodAccum += dt * params.foodRate;
  if (sim.foodAccum > 1.2 && food.length < MAX_FOOD) {
    sim.foodAccum = 0;
    spawnFood();
  }

  queen.wobble += dt * 2;
  queen.x = nest.x + Math.cos(queen.wobble * 0.3) * 3;
  queen.y = nest.y + Math.sin(queen.wobble * 0.5) * 2;
  while (queen.fed >= 5) {
    queen.fed -= 5;
    spawnAnt();
    stats.born++;
    for (let i = 0; i < 8; i++) {
      sim.particles.push({
        x: nest.x, y: nest.y,
        vx: (Math.random() - .5) * 3,
        vy: (Math.random() - .5) * 3,
        life: 1, color: '#f4e8d0',
      });
    }
  }

  const cohesionR2 = params.radius * params.radius;
  rebuildCohesionGrid(ants);

  for (const ant of ants) {
    let fx = 0, fy = 0;

    if (ant.carrying) {
      deposit(phero.food, ant.x, ant.y, 2.0 * dt);
      const dx = nest.x - ant.x, dy = nest.y - ant.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      fx += (dx / d) * 80;
      fy += (dy / d) * 80;
      ant.carrying.x = ant.x + Math.cos(ant.angle) * 8;
      ant.carrying.y = ant.y + Math.sin(ant.angle) * 8;

      if (d < nest.r) {
        stats.stored++;
        queen.fed++;
        const idx = food.indexOf(ant.carrying);
        if (idx >= 0) food.splice(idx, 1);
        ant.carrying = null;
        for (let i = 0; i < 4; i++) {
          sim.particles.push({
            x: nest.x, y: nest.y,
            vx: (Math.random() - .5) * 2,
            vy: (Math.random() - .5) * 2,
            life: 0.6, color: '#98c267',
          });
        }
      }
    } else {
      if (ant.target && ant.target.claimed) ant.target = null;

      if (!ant.target) {
        let nearest = null, nd = 200;
        for (const f of food) {
          if (f.claimed) continue;
          const dx = f.x - ant.x, dy = f.y - ant.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < nd) { nd = d; nearest = f; }
        }
        ant.target = nearest;
      }

      if (ant.target) {
        const nearest = ant.target;
        const dx = nearest.x - ant.x, dy = nearest.y - ant.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        fx += (dx / d) * 60;
        fy += (dy / d) * 60;
        if (d < 6) {
          nearest.claimed = true;
          ant.carrying = nearest;
          ant.target = null;
        }
      } else {
        deposit(phero.home, ant.x, ant.y, 0.8 * dt);

        const sa = ant.angle;
        const fL = sample(phero.food, ant.x + Math.cos(sa - SENSOR_ANGLE) * SENSOR_DIST, ant.y + Math.sin(sa - SENSOR_ANGLE) * SENSOR_DIST);
        const fC = sample(phero.food, ant.x + Math.cos(sa) * SENSOR_DIST,                ant.y + Math.sin(sa) * SENSOR_DIST);
        const fR = sample(phero.food, ant.x + Math.cos(sa + SENSOR_ANGLE) * SENSOR_DIST, ant.y + Math.sin(sa + SENSOR_ANGLE) * SENSOR_DIST);

        if (params.pheroStrength > 0 && fL + fC + fR > 0.04) {
          const t = params.pheroStrength;
          if (fR > fL && fR > fC) {
            ant.wander += (0.35 + (Math.random() - 0.5) * 0.15) * t;
          } else if (fL > fR && fL > fC) {
            ant.wander -= (0.35 + (Math.random() - 0.5) * 0.15) * t;
          } else {
            ant.wander += (Math.random() - 0.5) * 0.1;
          }
        } else {
          ant.wander += (Math.random() - 0.5) * params.wanderStrength;
        }
        fx += Math.cos(ant.wander) * 40;
        fy += Math.sin(ant.wander) * 40;
      }
    }

    const cx = (ant.x / COHESION_CELL) | 0;
    const cy = (ant.y / COHESION_CELL) | 0;
    for (let gx = -1; gx <= 1; gx++) {
      for (let gy = -1; gy <= 1; gy++) {
        const bucket = cohesionGrid.get((cx + gx) * 4096 + (cy + gy));
        if (bucket === undefined) continue;
        for (let oi = 0, ol = bucket.length; oi < ol; oi++) {
          const other = bucket[oi];
          if (other === ant) continue;
          const dx = other.x - ant.x, dy = other.y - ant.y;
          const d2 = dx * dx + dy * dy;
          if (d2 === 0 || d2 >= cohesionR2) continue;
          const d = Math.sqrt(d2);
          const strength = params.attraction * (1 - d / params.radius) * 30;
          fx += (dx / d) * strength;
          fy += (dy / d) * strength;
          if (d < 10) {
            fx -= (dx / d) * params.repulsion;
            fy -= (dy / d) * params.repulsion;
          }
        }
      }
    }

    ant.vx = (ant.vx + fx * dt) * params.damping;
    ant.vy = (ant.vy + fy * dt) * params.damping;
    const speed = Math.sqrt(ant.vx * ant.vx + ant.vy * ant.vy);
    const maxSpeed = params.maxSpeed;
    if (speed > maxSpeed) {
      ant.vx = ant.vx / speed * maxSpeed;
      ant.vy = ant.vy / speed * maxSpeed;
    }
    ant.x += ant.vx * dt;
    ant.y += ant.vy * dt;

    if (ant.x < 8)     { ant.x = 8;     ant.vx *= -.5; }
    if (ant.x > W - 8) { ant.x = W - 8; ant.vx *= -.5; }
    if (ant.y < 8)     { ant.y = 8;     ant.vy *= -.5; }
    if (ant.y > H - 8) { ant.y = H - 8; ant.vy *= -.5; }

    if (speed > 1) ant.angle = Math.atan2(ant.vy, ant.vx);
    ant.legPhase += speed * dt * 0.5;
  }

  for (const f of food) f.bob += dt * 3;

  for (const p of sim.particles) {
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.95; p.vy *= 0.95;
    p.life -= dt * 1.5;
  }
  sim.particles = sim.particles.filter(p => p.life > 0);

  evaporate(dt, params.evapRate);
}

// ─── snapshot ────────────────────────────────────────────────────────────────

function postSnapshot() {
  const antCount = sim.ants.length;
  const antBuf = new Float32Array(antCount * 5);
  for (let i = 0; i < antCount; i++) {
    const a = sim.ants[i];
    const o = i * 5;
    antBuf[o]     = a.x;
    antBuf[o + 1] = a.y;
    antBuf[o + 2] = a.angle;
    antBuf[o + 3] = a.legPhase;
    antBuf[o + 4] = a.size;
  }

  const foods = new Array(sim.food.length);
  for (let i = 0; i < sim.food.length; i++) {
    const f = sim.food[i];
    foods[i] = { id: f.id, x: f.x, y: f.y, r: f.r, bob: f.bob, hue: f.hue };
  }

  const particles = new Array(sim.particles.length);
  for (let i = 0; i < sim.particles.length; i++) {
    const p = sim.particles[i];
    particles[i] = { x: p.x, y: p.y, life: p.life, color: p.color };
  }

  const includePhero = params.showPheromones && (frameCount % DRAW_PHERO_EVERY === 0);
  const pheroPayload = includePhero
    ? { cols: phero.cols, rows: phero.rows, food: new Float32Array(phero.food), home: new Float32Array(phero.home) }
    : null;

  const transfer = [antBuf.buffer];
  if (pheroPayload) {
    transfer.push(pheroPayload.food.buffer, pheroPayload.home.buffer);
  }

  postMessage({
    type: 'snapshot',
    antBuf,
    antCount,
    food: foods,
    particles,
    queen: { x: sim.queen.x, y: sim.queen.y, wobble: sim.queen.wobble },
    nest: { x: sim.nest.x, y: sim.nest.y, r: sim.nest.r },
    stats: { ants: antCount, food: foods.length, stored: sim.stats.stored, born: sim.stats.born },
    phero: pheroPayload,
  }, transfer);
}

let lastTime = performance.now();

function tick() {
  if (!params || !sim.nest) return;
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  update(dt);
  frameCount++;
  postSnapshot();
}

let tickHandle = null;
function startTicking() {
  if (tickHandle !== null) return;
  lastTime = performance.now();
  tickHandle = setInterval(tick, TICK_MS);
}

onmessage = (e) => {
  const m = e.data;
  switch (m.type) {
    case 'init':
      viewport = m.viewport;
      params = m.params;
      initPheromones();
      initSim();
      startTicking();
      break;
    case 'params':
      Object.assign(params, m.params);
      break;
    case 'resize':
      viewport = m.viewport;
      initPheromones();
      // Keep ants inside the new bounds.
      for (const ant of sim.ants) {
        if (ant.x > viewport.W - 8) ant.x = viewport.W - 8;
        if (ant.y > viewport.H - 8) ant.y = viewport.H - 8;
      }
      if (sim.nest) { sim.nest.x = viewport.W / 2; sim.nest.y = viewport.H / 2; }
      break;
    case 'spawnFood':
      spawnFood(m.x, m.y);
      break;
    case 'reset':
      Object.assign(params, m.params);
      initPheromones();
      initSim();
      break;
  }
};
