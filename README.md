# Formicarium

A pure client-side ant colony simulation. Workers forage, deposit pheromone trails, return food to the nest, and the queen grows the colony — all running in the browser, no backend, no build step.

## Vision

Formicarium is a study of **emergent colony behavior**: how a few simple per-ant rules (attraction, repulsion, pheromone deposition, gradient following) produce trails, foraging routes, and colony-scale patterns no single ant is aware of. The simulation is designed to **scale to hundreds of ants at moderate CPU**, so the emergent behaviors are observable without the page turning into a space heater.

## Current features

- **Physics-based cohesion** — `F = k · (1 − d/r)` attraction within a tunable detection radius, close-range repulsion to prevent overlap
- **Stigmergic pathfinding** — carrier ants deposit a food-trail pheromone on the way home; foragers sample the gradient through three forward sensors and steer up-gradient toward known food sources
- **Home-trail haze** — foragers deposit a teal pheromone while exploring, giving a visual record of explored territory
- **Colony growth** — queen hatches one new worker per 5 food units stored (`N_new = ⌊S/5⌋`)
- **Live parameter tuning** — cohesion strength, radius, repulsion, damping, max speed, food rate, wander noise, evaporation rate, trail influence — all adjustable mid-run
- **Interactive** — click to scatter food anywhere on the canvas
- **Reset** — rebuild the colony from current slider values without reloading

## Architecture

The simulation is split into focused ES modules; no bundler is used.

```
formicarium/
├── index.html
├── styles/
│   ├── base.css        # tokens, reset, body grid
│   ├── panel.css       # sidebar layout, stat cards
│   ├── controls.css    # sliders, toggles, equation cards
│   └── canvas.css      # stage, HUD overlay, legend
└── src/
    ├── main.js         # entry — spawns the worker, renders from snapshots, forwards input
    ├── canvas.js       # canvas setup, DPR scaling, shared viewport
    ├── controls.js     # params object, UI bindings, slider → worker change notifier
    ├── renderer.js     # draw() — sprite-cached canvas 2D rendering, background + food gradient caches
    ├── pheromones.js   # main-thread pheromone visualizer (data delivered via snapshot)
    └── worker.js       # off-thread physics: ant AI, spatial grid cohesion, pheromone grids, snapshot publisher
```

### Performance design

Hundreds of moving ants at 30 fps would melt a single thread if done naively. The pieces that make it cheap:

- **Spatial hash grid** — ant-ant cohesion is `O(n)` instead of `O(n²)`. Each ant only checks neighbors in its own cell + the 8 surrounding cells of a coarse spatial grid. At 200 ants that's ~2,000 pair checks per frame instead of 19,900.
- **Web Worker physics** — `worker.js` owns the simulation tick. The main thread receives a snapshot per frame and only renders. Physics and rendering run on separate CPU cores.
- **Sprite cache** — each ant body is rendered once to an `OffscreenCanvas` per discrete size, then blitted with `drawImage`. The queen and nest are likewise pre-rendered. Replaces ~30 canvas API calls per ant per frame with one image draw.
- **Cached gradients** — the background radial gradient is built once at startup (and on resize) and reused every frame. Food gradients are stored on each food object when spawned.
- **Throttled evaporation** — pheromone evaporation runs every 3rd frame with a 3× rate factor; visualization redraws every 4th frame. Behavior is identical, work is a fraction.
- **Cached food targets** — each forager keeps a reference to its current target food, invalidated only on claim or removal. Eliminates the per-frame `O(n·m)` nearest-food scan.

### Physics model

| Parameter | Formula | Description |
|-----------|---------|-------------|
| Cohesion | `F = k · (1 − d/r)` | Linear attraction within radius `r`, scaled by `k`. Spatial-hashed for O(n). |
| Repulsion | `F = repulsion / d` | Short-range push (d < 10 px) to prevent overlap. |
| Velocity step | `v = (v + F · dt) · δ` | Damped integration, capped at `v_max`. |
| Spawn | `N_new = ⌊S/5⌋` | Queen hatches 1 worker per 5 food stored. |
| Evaporation | `C' = C · (1 − λ · dt)` | Pheromone concentration decays each frame (throttled to every 3rd frame, rate ×3). |
| Trail sensing | `θ̂ = argmax(C_L, C_C, C_R)` | Three forward sensors at ±θ steer the ant toward the strongest pheromone reading. |

## Planned features

- **Reynolds flocking** — add separation and alignment forces on top of the existing cohesion, for true three-rule boids behavior
- **Multiple food types** — distinct nutritional values, preferred by different worker states
- **Ant lifespan + colony health meter** — workers age and die; the panel surfaces an overall health metric
- **Soldier caste** — second worker type that patrols the nest perimeter and defends against threats
- **Day / night cycle** — global modulation of ant activity, with reduced foraging at night
- **Multiple competing colonies** — two or more nests sharing the same map, competing for food

## Running locally

ES modules require a local HTTP server (browsers block them over `file://`).

**Python (no install):**
```bash
python -m http.server 8000
```
Then open <http://localhost:8000>.

**Node:**
```bash
npx serve .
```

**VS Code:** right-click `index.html` → *Open with Live Server*.

## Performance notes for contributors

- **Test at 200+ ants.** Bump `colonysize` to 40 and let the colony grow — the simulation should stay smooth under sustained load. If a change makes things worse at high ant counts, it's a regression.
- **Profile in the Performance tab.** The two budgets that matter are the worker tick (physics) and the main-thread frame (render + DOM). Either spiking means a hot loop has been introduced.
- **Allocations inside loops are forbidden.** No `new`, no array literals, no `Map.entries()` per ant. The simulation runs at 30 fps × 200 ants × N inner loops — any per-iteration allocation creates GC pressure that shows up as periodic jank.
- **Prefer squared distances.** Skip the `Math.sqrt` in proximity tests when only the comparison matters.
- **Snapshot, don't share.** The worker posts plain `Float32Array` snapshots back to the main thread per frame. Don't reach across the boundary in either direction.
