'use strict';

import { ctx, viewport } from './canvas.js';

let _off = null, _offCtx = null, _img = null;
let _cols = 0, _rows = 0;
let _data = null;

export function setPheromoneData(payload) {
  if (!payload) return;
  if (_cols !== payload.cols || _rows !== payload.rows) {
    _cols = payload.cols;
    _rows = payload.rows;
    _off = document.createElement('canvas');
    _off.width  = _cols;
    _off.height = _rows;
    _offCtx = _off.getContext('2d');
    _img = _offCtx.createImageData(_cols, _rows);
  }
  _data = payload;
  const d = _img.data;
  const { food, home } = payload;
  for (let i = 0, n = _cols * _rows; i < n; i++) {
    const fv = food[i];
    const hv = home[i];
    if (fv < 0.01 && hv < 0.01) { d[(i << 2) + 3] = 0; continue; }
    const p = i << 2;
    d[p]     = Math.min(255, fv * 360 + hv *  70) | 0;
    d[p + 1] = Math.min(255, fv * 170 + hv * 255) | 0;
    d[p + 2] = Math.min(255,            hv * 255) | 0;
    d[p + 3] = Math.min(180, fv * 255 + hv * 180) | 0;
  }
  _offCtx.putImageData(_img, 0, 0);
}

export function drawPheromones(show) {
  if (!show || !_off || !_data) return;
  const { W, H } = viewport;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(_off, 0, 0, _cols, _rows, 0, 0, W, H);
}
