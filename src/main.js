'use strict';

import { canvas, resize } from './canvas.js';
import { bindControls } from './controls.js';
import { init, spawnFood } from './entities.js';
import { update } from './simulation.js';
import { draw } from './renderer.js';
import { sim } from './state.js';

bindControls(() => init());

canvas.addEventListener('click', e => {
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  for (let i = 0; i < 5; i++) {
    spawnFood(x + (Math.random() - .5) * 40, y + (Math.random() - .5) * 40);
  }
});

let lastTime = performance.now();

function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  update(dt);
  draw();
  document.getElementById('stat-ants').textContent   = sim.ants.length;
  document.getElementById('stat-food').textContent   = sim.food.length;
  document.getElementById('stat-stored').textContent = sim.stats.stored;
  document.getElementById('stat-born').textContent   = sim.stats.born;
  requestAnimationFrame(tick);
}

resize();
init();
requestAnimationFrame(tick);
