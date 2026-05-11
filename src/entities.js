'use strict';

import { sim } from './state.js';
import { viewport } from './canvas.js';
import { params } from './controls.js';

export function init() {
  const { W, H } = viewport;
  sim.nest  = { x: W / 2, y: H / 2, r: 38 };
  sim.queen = { x: sim.nest.x, y: sim.nest.y, fed: 0, angle: 0, wobble: 0 };
  sim.ants      = [];
  sim.food      = [];
  sim.particles = [];
  sim.stats.stored = 0;
  sim.stats.born   = 0;
  sim.foodAccum    = 0;
  for (let i = 0; i < params.colonySize; i++) spawnAnt();
}

export function spawnAnt() {
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
    wander: Math.random() * Math.PI * 2,
    size: 0.85 + Math.random() * 0.3,
  });
}

export function spawnFood(x, y) {
  const { W, H } = viewport;
  sim.food.push({
    x: x ?? Math.random() * W,
    y: y ?? Math.random() * H,
    r: 4 + Math.random() * 3,
    claimed: false,
    bob: Math.random() * Math.PI * 2,
    hue: Math.random() < 0.7 ? 'green' : 'red',
  });
}
