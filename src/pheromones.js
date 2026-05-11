'use strict';

import { ctx, viewport } from './canvas.js';

const CELL = 12;

export const phero = {
  cols: 0, rows: 0,
  food: null,  // deposited by carriers → foragers follow it to food
  home: null,  // deposited by foragers → visual only (exploration haze)
};

let _off = null, _offCtx = null, _img = null, _frame = 0;

export function initPheromones() {
  const { W, H } = viewport;
  phero.cols = Math.ceil(W / CELL);
  phero.rows = Math.ceil(H / CELL);
  const n = phero.cols * phero.rows;
  phero.food = new Float32Array(n);
  phero.home = new Float32Array(n);
  _off = document.createElement('canvas');
  _off.width  = phero.cols;
  _off.height = phero.rows;
  _offCtx = _off.getContext('2d');
  _img = _offCtx.createImageData(phero.cols, phero.rows);
}

export function deposit(grid, x, y, amount) {
  if (!grid) return;
  const col = (x / CELL) | 0;
  const row = (y / CELL) | 0;
  if (col >= 0 && col < phero.cols && row >= 0 && row < phero.rows) {
    const i = row * phero.cols + col;
    const v = grid[i] + amount;
    grid[i] = v < 1 ? v : 1;
  }
}

export function sample(grid, x, y) {
  if (!grid) return 0;
  const col = (x / CELL) | 0;
  const row = (y / CELL) | 0;
  if (col < 0 || col >= phero.cols || row < 0 || row >= phero.rows) return 0;
  return grid[row * phero.cols + col];
}

export function evaporate(dt, rate) {
  const f = 1 - rate * dt;
  const { food, home } = phero;
  for (let i = 0, n = food.length; i < n; i++) {
    food[i] *= f;
    home[i] *= f;
  }
}

export function drawPheromones(show) {
  if (!show || !_img) return;
  // Recompute pixels every 2nd frame — pheromones change slowly enough
  if (++_frame % 2 === 0) {
    const { cols, rows, food, home } = phero;
    const d = _img.data;
    for (let i = 0, n = cols * rows; i < n; i++) {
      const fv = food[i];
      const hv = home[i];
      if (fv < 0.01 && hv < 0.01) { d[(i << 2) + 3] = 0; continue; }
      const p  = i << 2;
      d[p]     = Math.min(255, fv * 360 + hv *  70) | 0;  // R — amber / teal
      d[p + 1] = Math.min(255, fv * 170 + hv * 255) | 0;  // G
      d[p + 2] = Math.min(255,            hv * 255) | 0;  // B
      d[p + 3] = Math.min(180, fv * 255 + hv * 180) | 0;  // A
    }
    _offCtx.putImageData(_img, 0, 0);
  }
  const { W, H } = viewport;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(_off, 0, 0, phero.cols, phero.rows, 0, 0, W, H);
}

// Resize pheromone grids whenever the canvas resizes (canvas.js fires first)
window.addEventListener('resize', () => { if (phero.cols) initPheromones(); });
