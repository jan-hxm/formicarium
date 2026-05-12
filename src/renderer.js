'use strict';

import { ctx, viewport } from './canvas.js';
import { params } from './controls.js';
import { drawPheromones } from './pheromones.js';

let _bgGradient = null;
let _bgW = 0, _bgH = 0;

const SIZE_BUCKETS = 4;
const PHASE_BUCKETS = 8;
const SPRITE_W = 32, SPRITE_H = 32;
const SIZE_MIN = 0.85, SIZE_MAX = 1.15;

let _antSprites = null;
let _queenSprite = null;
let _nestSprite = null;
let _nestSpriteR = 0;

const _foodGradients = new Map();

function offscreen(w, h) {
  const dpr = window.devicePixelRatio || 1;
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * dpr);
  c.height = Math.ceil(h * dpr);
  const cx = c.getContext('2d');
  cx.scale(dpr, dpr);
  return { canvas: c, ctx: cx };
}

export function initBackground() {
  const { W, H } = viewport;
  _bgGradient = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, Math.max(W, H));
  _bgGradient.addColorStop(0, '#4a3320');
  _bgGradient.addColorStop(0.6, '#332014');
  _bgGradient.addColorStop(1, '#1f1308');
  _bgW = W; _bgH = H;
}

export function initSprites() {
  _antSprites = new Array(SIZE_BUCKETS);
  for (let s = 0; s < SIZE_BUCKETS; s++) {
    const t = SIZE_BUCKETS === 1 ? 0 : s / (SIZE_BUCKETS - 1);
    const size = SIZE_MIN + t * (SIZE_MAX - SIZE_MIN);
    const row = new Array(PHASE_BUCKETS);
    for (let p = 0; p < PHASE_BUCKETS; p++) {
      const phase = (p / PHASE_BUCKETS) * Math.PI * 2;
      row[p] = renderAntSprite(size, phase);
    }
    _antSprites[s] = row;
  }
  _queenSprite = renderQueenSprite();
}

function renderAntSprite(size, legPhase) {
  const off = offscreen(SPRITE_W, SPRITE_H);
  const c = off.ctx;
  c.translate(SPRITE_W / 2, SPRITE_H / 2);
  c.scale(size, size);
  paintAntBody(c, legPhase);
  return off.canvas;
}

function paintAntBody(c, lp) {
  c.strokeStyle = '#1a0f08';
  c.lineWidth = 0.7;
  c.lineCap = 'round';
  c.beginPath();
  for (const [legY, offset] of [[-2, 0], [0, Math.PI], [2, 0]]) {
    const sw = Math.sin(lp + offset) * 1.5;
    c.moveTo(-1, legY); c.quadraticCurveTo(-3, legY + sw, -5, legY + sw * 1.5);
    c.moveTo(1, legY);  c.quadraticCurveTo(3, legY - sw, 5, legY - sw * 1.5);
  }
  c.stroke();

  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.beginPath();
  c.ellipse(0.5, 0.5, 4.5, 6.5, 0, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#1a0f08';
  c.beginPath();
  c.ellipse(0, 3.5, 3, 4.5, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(244,232,208,0.15)';
  c.beginPath();
  c.ellipse(-0.8, 2.5, 1, 2.2, 0, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#0d0805';
  c.beginPath();
  c.ellipse(0, -0.5, 2, 2.5, 0, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#1a0f08';
  c.beginPath();
  c.arc(0, -4, 2.2, 0, Math.PI * 2);
  c.fill();

  const sway = Math.sin(lp * 1.5) * 0.5;
  c.strokeStyle = '#1a0f08';
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(-1, -5.5);  c.lineTo(-1.5, -6.5);
  c.moveTo(1, -5.5);   c.lineTo(1.5, -6.5);
  c.moveTo(-0.8, -5);  c.quadraticCurveTo(-2 + sway, -7, -2.5 + sway, -8.5);
  c.moveTo(0.8, -5);   c.quadraticCurveTo(2 - sway, -7, 2.5 - sway, -8.5);
  c.stroke();

  c.fillStyle = '#5a3a23';
  c.beginPath();
  c.arc(-1.2, -4.2, 0.4, 0, Math.PI * 2);
  c.arc(1.2, -4.2, 0.4, 0, Math.PI * 2);
  c.fill();
}

function renderQueenSprite() {
  const W = 48, H = 48;
  const off = offscreen(W, H);
  const c = off.ctx;
  c.translate(W / 2, H / 2);

  const glow = c.createRadialGradient(0, 0, 0, 0, 0, 22);
  glow.addColorStop(0, 'rgba(217,119,6,0.4)');
  glow.addColorStop(1, 'rgba(217,119,6,0)');
  c.fillStyle = glow;
  c.beginPath(); c.arc(0, 0, 22, 0, Math.PI * 2); c.fill();

  c.fillStyle = '#b8451f';
  c.beginPath();
  c.ellipse(0, 6, 9, 12, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#6b1f0e';
  c.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.ellipse(0, 3 + i * 4, 8 - i, 1.2, 0, 0, Math.PI * 2);
    c.stroke();
  }
  c.fillStyle = '#8b2c0e';
  c.beginPath();
  c.ellipse(0, -2, 5, 4, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#6b1f0e';
  c.beginPath();
  c.arc(0, -8, 4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#f5c842';
  c.beginPath();
  c.moveTo(-4, -12); c.lineTo(-3, -15); c.lineTo(-1, -13);
  c.lineTo(0, -16);  c.lineTo(1, -13);  c.lineTo(3, -15);
  c.lineTo(4, -12);
  c.closePath();
  c.fill();
  c.strokeStyle = '#8a6612';
  c.lineWidth = 0.5;
  c.stroke();
  c.fillStyle = '#b8451f';
  c.beginPath();
  c.arc(0, -13.5, 0.8, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#3d1505';
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-1.5, -10); c.quadraticCurveTo(-4, -14, -3, -17);
  c.moveTo(1.5, -10);  c.quadraticCurveTo(4, -14, 3, -17);
  c.stroke();

  return off.canvas;
}

function renderNestSprite(r) {
  const pad = 24;
  const size = (r + pad) * 2;
  const off = offscreen(size, size);
  const c = off.ctx;
  c.translate(size / 2, size / 2);

  for (let i = 4; i > 0; i--) {
    c.beginPath();
    c.arc(0, 0, r + i * 4, 0, Math.PI * 2);
    c.fillStyle = `rgba(212, 184, 150, ${0.04 + i * 0.02})`;
    c.fill();
  }
  const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, '#1a0f08');
  g.addColorStop(0.6, '#2b1d12');
  g.addColorStop(1, '#5a3a23');
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#7a5638';
  const seed = 17;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + seed;
    const rr = r + 6 + Math.sin(i * seed) * 3;
    c.beginPath();
    c.arc(Math.cos(a) * rr, Math.sin(a) * rr, 1.5 + Math.abs(Math.sin(i * 3)) * 1.5, 0, Math.PI * 2);
    c.fill();
  }
  return { canvas: off.canvas, half: size / 2 };
}

function getFoodGradient(f) {
  let g = _foodGradients.get(f.id);
  if (!g) {
    g = ctx.createRadialGradient(-f.r * 0.3, -f.r * 0.3, 0, 0, 0, f.r);
    g.addColorStop(0, '#d63d6a');
    g.addColorStop(1, '#8b2c4a');
    _foodGradients.set(f.id, g);
  }
  return g;
}

function pruneFoodGradients(foodArr) {
  // Cheap heuristic: only sweep when the cache has more than 2× the live count.
  if (_foodGradients.size <= foodArr.length * 2) return;
  const live = new Set();
  for (const f of foodArr) live.add(f.id);
  for (const id of _foodGradients.keys()) {
    if (!live.has(id)) _foodGradients.delete(id);
  }
}

export function draw(snap) {
  drawBackground();
  drawPheromones(params.showPheromones);
  if (!snap || !snap.nest) return;
  drawNest(snap.nest);
  for (const f of snap.food) drawFood(f);
  drawQueen(snap.queen);
  drawAnts(snap.antBuf, snap.antCount);
  for (const p of snap.particles) drawParticle(p);
  pruneFoodGradients(snap.food);
}

function drawBackground() {
  const { W, H } = viewport;
  if (_bgGradient === null || _bgW !== W || _bgH !== H) initBackground();
  ctx.fillStyle = _bgGradient;
  ctx.fillRect(0, 0, W, H);
}

function drawNest(nest) {
  if (_nestSprite === null || _nestSpriteR !== nest.r) {
    _nestSprite = renderNestSprite(nest.r);
    _nestSpriteR = nest.r;
  }
  const { canvas: img, half } = _nestSprite;
  ctx.drawImage(img, nest.x - half, nest.y - half, half * 2, half * 2);
}

function drawQueen(queen) {
  ctx.save();
  ctx.translate(queen.x, queen.y);
  ctx.rotate(Math.sin(queen.wobble * 0.4) * 0.15);
  ctx.drawImage(_queenSprite, -24, -24, 48, 48);
  ctx.restore();
}

function antSpriteFor(size, legPhase) {
  let sIdx = Math.round(((size - SIZE_MIN) / (SIZE_MAX - SIZE_MIN)) * (SIZE_BUCKETS - 1));
  if (sIdx < 0) sIdx = 0; else if (sIdx >= SIZE_BUCKETS) sIdx = SIZE_BUCKETS - 1;
  const phaseNorm = (((legPhase / (Math.PI * 2)) % 1) + 1) % 1;
  const pIdx = Math.floor(phaseNorm * PHASE_BUCKETS) % PHASE_BUCKETS;
  return _antSprites[sIdx][pIdx];
}

function drawAnts(antBuf, count) {
  const showRadius = params.showRadius;
  const radius = params.radius;
  for (let i = 0; i < count; i++) {
    const o = i * 5;
    const x = antBuf[o];
    const y = antBuf[o + 1];
    const angle = antBuf[o + 2];
    const legPhase = antBuf[o + 3];
    const size = antBuf[o + 4];
    const sprite = antSpriteFor(size, legPhase);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.drawImage(sprite, -SPRITE_W / 2, -SPRITE_H / 2, SPRITE_W, SPRITE_H);
    ctx.restore();

    if (showRadius) {
      ctx.strokeStyle = 'rgba(217,119,6,0.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(217,119,6,0.04)';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawFood(f) {
  const bobY = f.y + Math.sin(f.bob) * 0.5;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(f.x + 1, bobY + f.r + 1, f.r * 0.8, f.r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  if (f.hue === 'green') {
    ctx.fillStyle = '#6b8e3d';
    ctx.beginPath();
    ctx.ellipse(f.x, bobY, f.r, f.r * 0.7, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#98c267';
    ctx.beginPath();
    ctx.ellipse(f.x - f.r * 0.2, bobY - f.r * 0.2, f.r * 0.5, f.r * 0.3, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4a6b2a';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(f.x - f.r * 0.5, bobY + f.r * 0.4);
    ctx.lineTo(f.x + f.r * 0.5, bobY - f.r * 0.4);
    ctx.stroke();
  } else {
    ctx.save();
    ctx.translate(f.x, bobY);
    ctx.fillStyle = getFoodGradient(f);
    ctx.beginPath();
    ctx.arc(0, 0, f.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(-f.r * 0.35, -f.r * 0.35, f.r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawParticle(p) {
  ctx.fillStyle = p.color;
  ctx.globalAlpha = p.life;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

window.addEventListener('resize', () => {
  _bgGradient = null;
  _nestSprite = null;
});
