# Formicarium

An ant colony simulation running in the browser. Workers forage for food, carry it back to the nest, and the queen hatches new ants as the colony grows. The cohesion and detection physics are tunable in real time via the sidebar.

## Features

- **Physics-based cohesion** — ant-ant attraction force `F = k · (1 − d/r)`, tunable strength and detection radius
- **Colony growth** — queen hatches one worker per 5 food units stored (`N_new = ⌊S/5⌋`)
- **Food foraging** — workers seek the nearest unclaimed food item, carry it home, then resume wandering
- **Interactive** — click anywhere on the canvas to scatter food; adjust parameters live via sliders
- **DPI-aware canvas** — crisp rendering on HiDPI/Retina displays

## Running locally

ES modules require a local HTTP server (browsers block them over `file://`).

**Option A — Python (no install needed):**
```bash
python -m http.server 8000
```
Then open [http://localhost:8000](http://localhost:8000).

**Option B — Node `serve`:**
```bash
npx serve .
```

**Option C — VS Code Live Server extension:** right-click `index.html` → *Open with Live Server*.

## Project structure

```
formicarium/
├── index.html          # Shell — HTML structure only
├── styles/
│   ├── base.css        # CSS custom properties, reset, body grid
│   ├── panel.css       # Sidebar panel, headings, stat cards, groups
│   ├── controls.css    # Sliders, toggles, buttons, math equation cards
│   └── canvas.css      # Canvas stage, HUD overlay, legend, animations
└── src/
    ├── canvas.js       # Canvas setup, DPR scaling, shared viewport dimensions
    ├── state.js        # Single shared simulation state object (sim)
    ├── controls.js     # params object, UI event bindings
    ├── entities.js     # init(), spawnAnt(), spawnFood()
    ├── simulation.js   # update() — physics, AI, particle decay
    ├── renderer.js     # draw() — background, nest, queen, ants, food, particles
    └── main.js         # Entry point — tick loop, DOM stat updates
```

## Physics model

| Parameter | Formula | Description |
|-----------|---------|-------------|
| Cohesion force | `F = k · (1 − d/r)` | Linear attraction between ants within detection radius `r`, scaled by strength `k` |
| Repulsion | `F = 20 / d` | Short-range (< 10 px) push to prevent overlap |
| Spawn condition | `N_new = ⌊S/5⌋` | Queen hatches one ant for every 5 food units delivered |

Ant velocity is integrated with `Δt`-scaled forces and a damping factor of 0.88 per frame, capped at 60 px/s.

## Planned additions

- Pheromone trail system (stigmergic pathfinding)
- Separation / alignment / cohesion steering (Reynolds flocking)
- Multiple food types with different nutritional values
- Colony health / ant lifespan
