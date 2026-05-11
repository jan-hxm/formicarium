'use strict';

import { sim } from './state.js';
import { viewport } from './canvas.js';
import { params } from './controls.js';
import { spawnAnt, spawnFood } from './entities.js';

export function update(dt) {
  const { nest, queen, ants, food, stats } = sim;

  // Periodic food spawning
  sim.foodAccum += dt * params.foodRate;
  if (sim.foodAccum > 1.2 && food.length < 40) {
    sim.foodAccum = 0;
    spawnFood();
  }

  // Queen animation and ant hatching
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

  // Ant AI + physics
  for (const ant of ants) {
    let fx = 0, fy = 0;

    if (ant.carrying) {
      // Head back to nest
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
      // Seek nearest unclaimed food
      let nearest = null, nd = 200;
      for (const f of food) {
        if (f.claimed) continue;
        const dx = f.x - ant.x, dy = f.y - ant.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < nd) { nd = d; nearest = f; }
      }
      if (nearest) {
        const dx = nearest.x - ant.x, dy = nearest.y - ant.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        fx += (dx / d) * 60;
        fy += (dy / d) * 60;
        if (d < 6) {
          nearest.claimed = true;
          ant.carrying = nearest;
        }
      } else {
        // Wander
        ant.wander += (Math.random() - 0.5) * 0.3;
        fx += Math.cos(ant.wander) * 40;
        fy += Math.sin(ant.wander) * 40;
      }
    }

    // Ant-ant cohesion (F = k · (1 − d/r)) and close-range repulsion
    for (const other of ants) {
      if (other === ant) continue;
      const dx = other.x - ant.x, dy = other.y - ant.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 0 && d < params.radius) {
        const strength = params.attraction * (1 - d / params.radius) * 30;
        fx += (dx / d) * strength;
        fy += (dy / d) * strength;
      }
      if (d > 0 && d < 10) {
        fx -= (dx / d) * 20;
        fy -= (dy / d) * 20;
      }
    }

    // Velocity integration with damping
    ant.vx = (ant.vx + fx * dt) * 0.88;
    ant.vy = (ant.vy + fy * dt) * 0.88;
    const speed = Math.sqrt(ant.vx * ant.vx + ant.vy * ant.vy);
    const maxSpeed = 60;
    if (speed > maxSpeed) {
      ant.vx = ant.vx / speed * maxSpeed;
      ant.vy = ant.vy / speed * maxSpeed;
    }
    ant.x += ant.vx * dt;
    ant.y += ant.vy * dt;

    // Boundary bounce
    const { W, H } = viewport;
    if (ant.x < 8)     { ant.x = 8;     ant.vx *= -.5; }
    if (ant.x > W - 8) { ant.x = W - 8; ant.vx *= -.5; }
    if (ant.y < 8)     { ant.y = 8;     ant.vy *= -.5; }
    if (ant.y > H - 8) { ant.y = H - 8; ant.vy *= -.5; }

    if (speed > 1) ant.angle = Math.atan2(ant.vy, ant.vx);
    ant.legPhase += speed * dt * 0.5;
  }

  // Food bob animation
  for (const f of food) f.bob += dt * 3;

  // Particle decay
  for (const p of sim.particles) {
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.95; p.vy *= 0.95;
    p.life -= dt * 1.5;
  }
  sim.particles = sim.particles.filter(p => p.life > 0);
}
