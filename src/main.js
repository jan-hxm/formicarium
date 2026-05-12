'use strict';

import { canvas, resize, viewport } from './canvas.js';
import { bindControls, onParamsChange, params } from './controls.js';
import { draw, initSprites, initBackground } from './renderer.js';
import { setPheromoneData } from './pheromones.js';

const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

let latestSnapshot = null;

worker.onmessage = (e) => {
  const m = e.data;
  if (m.type === 'snapshot') {
    latestSnapshot = m;
    if (m.phero) setPheromoneData(m.phero);
  }
};

onParamsChange((p) => {
  worker.postMessage({ type: 'params', params: { ...p } });
});

bindControls(() => {
  worker.postMessage({ type: 'reset', params: { ...params } });
});

window.addEventListener('resize', () => {
  worker.postMessage({ type: 'resize', viewport: { W: viewport.W, H: viewport.H } });
});

canvas.addEventListener('click', e => {
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  for (let i = 0; i < 5; i++) {
    worker.postMessage({
      type: 'spawnFood',
      x: x + (Math.random() - .5) * 40,
      y: y + (Math.random() - .5) * 40,
    });
  }
});

function tick() {
  if (latestSnapshot) {
    draw(latestSnapshot);
    document.getElementById('stat-ants').textContent   = latestSnapshot.stats.ants;
    document.getElementById('stat-food').textContent   = latestSnapshot.stats.food;
    document.getElementById('stat-stored').textContent = latestSnapshot.stats.stored;
    document.getElementById('stat-born').textContent   = latestSnapshot.stats.born;
  }
  requestAnimationFrame(tick);
}

resize();
initBackground();
initSprites();

worker.postMessage({
  type: 'init',
  viewport: { W: viewport.W, H: viewport.H },
  params: { ...params },
});

requestAnimationFrame(tick);
