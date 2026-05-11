'use strict';

import { ctx, viewport } from './canvas.js';
import { sim } from './state.js';
import { params } from './controls.js';
import { drawPheromones } from './pheromones.js';

export function draw() {
  drawBackground();
  drawPheromones(params.showPheromones);
  drawNest();
  for (const f of sim.food) drawFood(f);
  drawQueen();
  for (const ant of sim.ants) drawAnt(ant);
  for (const p of sim.particles) drawParticle(p);
}

function drawBackground() {
  const { W, H } = viewport;
  const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, Math.max(W, H));
  g.addColorStop(0, '#4a3320');
  g.addColorStop(0.6, '#332014');
  g.addColorStop(1, '#1f1308');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawNest() {
  const { nest } = sim;
  for (let i = 4; i > 0; i--) {
    ctx.beginPath();
    ctx.arc(nest.x, nest.y, nest.r + i * 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(212, 184, 150, ${0.04 + i * 0.02})`;
    ctx.fill();
  }
  const g = ctx.createRadialGradient(nest.x, nest.y, 0, nest.x, nest.y, nest.r);
  g.addColorStop(0, '#1a0f08');
  g.addColorStop(0.6, '#2b1d12');
  g.addColorStop(1, '#5a3a23');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(nest.x, nest.y, nest.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#7a5638';
  const seed = 17;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + seed;
    const r = nest.r + 6 + Math.sin(i * seed) * 3;
    ctx.beginPath();
    ctx.arc(nest.x + Math.cos(a) * r, nest.y + Math.sin(a) * r, 1.5 + Math.abs(Math.sin(i * 3)) * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawQueen() {
  const { queen } = sim;
  ctx.save();
  ctx.translate(queen.x, queen.y);
  ctx.rotate(Math.sin(queen.wobble * 0.4) * 0.15);

  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 22);
  glow.addColorStop(0, 'rgba(217,119,6,0.4)');
  glow.addColorStop(1, 'rgba(217,119,6,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();

  // Abdomen with stripes
  ctx.fillStyle = '#b8451f';
  ctx.beginPath();
  ctx.ellipse(0, 6, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#6b1f0e';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(0, 3 + i * 4, 8 - i, 1.2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Thorax
  ctx.fillStyle = '#8b2c0e';
  ctx.beginPath();
  ctx.ellipse(0, -2, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.fillStyle = '#6b1f0e';
  ctx.beginPath();
  ctx.arc(0, -8, 4, 0, Math.PI * 2);
  ctx.fill();
  // Crown
  ctx.fillStyle = '#f5c842';
  ctx.beginPath();
  ctx.moveTo(-4, -12); ctx.lineTo(-3, -15); ctx.lineTo(-1, -13);
  ctx.lineTo(0, -16);  ctx.lineTo(1, -13);  ctx.lineTo(3, -15);
  ctx.lineTo(4, -12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a6612';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.fillStyle = '#b8451f';
  ctx.beginPath();
  ctx.arc(0, -13.5, 0.8, 0, Math.PI * 2);
  ctx.fill();
  // Antennae
  ctx.strokeStyle = '#3d1505';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-1.5, -10); ctx.quadraticCurveTo(-4, -14, -3, -17);
  ctx.moveTo(1.5, -10);  ctx.quadraticCurveTo(4, -14, 3, -17);
  ctx.stroke();

  ctx.restore();
}

function drawAnt(ant) {
  ctx.save();
  ctx.translate(ant.x, ant.y);
  ctx.rotate(ant.angle + Math.PI / 2);
  ctx.scale(ant.size, ant.size);

  // Legs — 3 pairs, animated — all in one path
  ctx.strokeStyle = '#1a0f08';
  ctx.lineWidth = 0.7;
  ctx.lineCap = 'round';
  const lp = ant.legPhase;
  ctx.beginPath();
  for (const [legY, offset] of [[-2, 0], [0, Math.PI], [2, 0]]) {
    const sw = Math.sin(lp + offset) * 1.5;
    ctx.moveTo(-1, legY); ctx.quadraticCurveTo(-3, legY + sw, -5, legY + sw * 1.5);
    ctx.moveTo(1, legY);  ctx.quadraticCurveTo(3, legY - sw, 5, legY - sw * 1.5);
  }
  ctx.stroke();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0.5, 0.5, 4.5, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Abdomen
  ctx.fillStyle = '#1a0f08';
  ctx.beginPath();
  ctx.ellipse(0, 3.5, 3, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(244,232,208,0.15)';
  ctx.beginPath();
  ctx.ellipse(-0.8, 2.5, 1, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Thorax
  ctx.fillStyle = '#0d0805';
  ctx.beginPath();
  ctx.ellipse(0, -0.5, 2, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#1a0f08';
  ctx.beginPath();
  ctx.arc(0, -4, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Mandibles + Antennae — same colour, one stroke call
  const sway = Math.sin(lp * 1.5) * 0.5;
  ctx.strokeStyle = '#1a0f08';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-1, -5.5);  ctx.lineTo(-1.5, -6.5);
  ctx.moveTo(1, -5.5);   ctx.lineTo(1.5, -6.5);
  ctx.moveTo(-0.8, -5);  ctx.quadraticCurveTo(-2 + sway, -7, -2.5 + sway, -8.5);
  ctx.moveTo(0.8, -5);   ctx.quadraticCurveTo(2 - sway, -7, 2.5 - sway, -8.5);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#5a3a23';
  ctx.beginPath();
  ctx.arc(-1.2, -4.2, 0.4, 0, Math.PI * 2);
  ctx.arc(1.2, -4.2, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Detection radius overlay (drawn in world space, after ctx.restore)
  if (params.showRadius) {
    ctx.strokeStyle = 'rgba(217,119,6,0.18)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(ant.x, ant.y, params.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(217,119,6,0.04)';
    ctx.beginPath();
    ctx.arc(ant.x, ant.y, params.radius, 0, Math.PI * 2);
    ctx.fill();
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
    const g = ctx.createRadialGradient(f.x - f.r * 0.3, bobY - f.r * 0.3, 0, f.x, bobY, f.r);
    g.addColorStop(0, '#d63d6a');
    g.addColorStop(1, '#8b2c4a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x, bobY, f.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(f.x - f.r * 0.35, bobY - f.r * 0.35, f.r * 0.3, 0, Math.PI * 2);
    ctx.fill();
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
