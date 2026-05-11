'use strict';

export const canvas = document.getElementById('cv');
export const ctx = canvas.getContext('2d');

// Mutable viewport dimensions — updated by resize(), read by other modules
export const viewport = { W: 0, H: 0 };

export function resize() {
  const r = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = r.width * dpr;
  canvas.height = r.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  viewport.W = r.width;
  viewport.H = r.height;
}

window.addEventListener('resize', resize);
