# Breakout — Reverse Engineering Report

> Source: https://s11311195-ops.github.io/mein-game/
> GitHub: https://github.com/s11311195-ops/mein-game

---

## Architecture Overview

The game is a classic **Breakout clone** built with vanilla JavaScript and HTML5 Canvas. It has **no build system, no bundler, no framework** — just 5 global-scope script files loaded in order.

```
index.html
├── css/style.css
└── js/
    ├── config.js   ← constants & tuning knobs (loaded first)
    ├── enemy.js    ← bricks, balls, powerups, particles, collision
    ├── player.js   ← paddle state & rendering
    ├── game.js     ← main loop, state machine, HUD, input
    └── main.js     ← DOMContentLoaded entry point (loaded last)
```

All variables are **global** (`var`). Files rely on load order for dependency resolution.

---

## Module Breakdown

### `config.js` — Constants

| Constant | Value | Meaning |
|---|---|---|
| `BASE_W / BASE_H` | 680 × 520 | Logical canvas size (scaled to screen) |
| `NORMAL_BALL_R` | 7 | Normal ball radius |
| `BIG_BALL_R` | 22 | Easter-egg big ball radius |
| `BALL_SPEED` | 4.5 | Base ball speed (px/frame at level 1) |
| `BRICK_ROWS` | 6 | Rows of bricks |
| `BRICK_COLS` | 10 | Columns of bricks |
| `BRICK_PAD` | 6 | Padding between bricks |
| `BRICK_TOP` | 50 | Y offset of first brick row |
| `PADDLE_W` | 100 | Paddle width |
| `PADDLE_H` | 12 | Paddle height |
| `PADDLE_SPEED` | 7 | Keyboard paddle speed |
| `PADDLE_Y_OFFSET` | 32 | Distance from bottom |
| `SCORE_BASE` | 10 | Base score per brick |
| `INITIAL_LIVES` | 3 | Starting lives |
| `MAX_LEVEL` | 8 | Win after clearing level 8 |
| `INITIAL_COMBO_THRESHOLD` | 10 | Hits needed before first powerup |
| `MIN_COMBO_THRESHOLD` | 4 | Minimum threshold (floor) |
| `POWERUP_EXTRA_BALLS` | 5 | Balls spawned by powerup |
| `POWERUP_THRESHOLD_STEP` | 2 | Threshold decreases by this per powerup |
| `POWERUP_FALL_SPEED` | 1.2 | Powerup fall speed |
| `EASTER_CODE` | `['a','b','a','b']` | Konami-style easter egg sequence |

**Brick colors** are defined as `[L, C, H]` tuples for the `oklch()` color space (6 rows, each a different hue).

---

### `enemy.js` — Bricks, Balls, Powerups, Particles

#### Data Structures

```
Ball: { x, y, r, dx, dy, trail: [{x,y}] }
Brick: { x, y, w, h, color, alive, hp, maxHp }
Powerup: { x, y, w:16, h:16, dy, pulse }
Particle: { x, y, dx, dy, life, decay, size, color }
```

#### Brick Initialization (`initBricks(level)`)
- **Level ≥ 3**: top 2 rows get `hp = 2` (requires 2 hits)
- **Level ≥ 5**: top 1 row gets `hp = 3` (requires 3 hits)
- Brick width = `(680 - 11 * 6) / 10 = 61.4px`, height = `18px`

#### Ball Physics (`makeBall / resetBalls`)
- Speed increases per level: `BALL_SPEED + (level - 1) * 0.3`
- Level 1: 4.5 px/frame, Level 8: 4.5 + 2.1 = **6.6 px/frame**
- Initial angle: `−π/2 ± 0.3 rad` (near-vertical, randomized)

#### Collision Detection (`ballBrickCollision`)
Uses circular vs AABB collision:
1. Finds closest point on rect to ball center
2. Checks distance² < r²
3. Resolves bounce direction by comparing previous vs current position (side detection)
4. Falls back to overlap-based side detection for corner cases
5. Pushes ball out to prevent tunneling

#### Powerup Spawn
Spawned from a **random alive brick** after `hitCounter % comboThreshold === 0`.
Falls at 1.2 px/frame. Caught when overlapping paddle.

---

### `player.js` — Paddle

- Paddle uses **interpolated movement**: `x += (targetX - x) * 0.25` (easing factor)
- Supports: Arrow keys, `A`/`D` keys, mouse, touch
- Clamped to `[0, BASE_W - PADDLE_W]`
- Rendered with a linear gradient using `oklch()` orange tones

---

### `game.js` — Main Loop & State Machine

#### State Machine
```
'start' → startGame() → 'playing' → endGame(won) → 'over'
                              ↑__________________________|
                         startGame() (restart)
```

#### Game Loop (`loop`)
Runs at 60fps via `requestAnimationFrame`. Each frame calls:
1. `update()` — physics & logic
2. `draw()` — render

#### Update Logic Flow

```
updatePaddle()
  for each ball:
    push trail (max 8 points)
    move ball (dx, dy)
    bounce off left/right/top walls
    check paddle collision → reflect + angle from hit position
    check if ball below canvas → mark for removal
    check brick collisions:
      if hp → 0: brick dies, score += (SCORE_BASE + hitCounter)
                 every 5 hits: show popup
                 every comboThreshold hits: spawn powerup
      else: particles (3)
  remove dead balls
  if balls.length === 0: lose life, shake, reset balls (or end game)
  for each powerup:
    fall down, pulse animation
    if caught by paddle: +5 balls, threshold -= 2
    if below canvas: remove
  check all bricks dead → advance level (or win)
  updateParticles()
```

#### Paddle–Ball Angle Calculation
```js
var hit = (ball.x - paddle.x) / paddle.w;   // 0 (left) to 1 (right)
var angle = -π/2 + (hit - 0.5) * 1.2;       // ±0.6 rad from vertical
```
This gives a max deflection of ≈34° from vertical.

#### Scoring
```
score += SCORE_BASE + hitCounter   // 10 + current hit count
```
Score grows naturally as hitCounter climbs — later hits are worth more.

#### Screen Scaling
Canvas is scaled to fit the window:
```js
scl = Math.min(window.innerWidth - 32, 680) / 680;
canvas.width  = Math.round(680 * scl);
canvas.height = Math.round(520 * scl);
ctx.scale(scl, scl);  // applied before drawing world-space entities
```
Mouse input is divided by `scl` to convert back to logical coordinates.

---

### `main.js` — Entry Point

```js
document.addEventListener('DOMContentLoaded', function() {
  initUI();   // renders 3 life dots, updates HUD
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('restartBtn').addEventListener('click', startGame);
});
```

---

## Easter Egg 🥚

**Secret**: Type `A B A B` during gameplay.

```js
var EASTER_CODE = ['a', 'b', 'a', 'b'];
```

Triggers `activateBigBall()` — toggles ball radius from 7 → 22 px. All existing balls resize immediately. A pink glow effect replaces the normal white trail. Press it again to revert.

---

## Rendering Details

### Color System
A custom `oklch()` helper generates CSS oklch color strings:
```js
function oklch(l, c, h, a) { … }
// oklch(0.72, 0.22, 145) → "oklch(72% 0.22 145)"
```
Used everywhere — bricks, balls, paddle, particles. Allows perceptual uniformity.

### Canvas Layers (draw order)
1. Background fill (dark navy `oklch(14% 0.02 260)`)
2. Subtle grid overlay
3. `ctx.scale(scl, scl)` →
4. Bricks (rounded rects with gloss highlight; crack line if damaged)
5. Powerups (spinning, pulsing green squares with "+5" label)
6. Balls (trail → ball → pink highlight if big ball mode)
7. Paddle (gradient orange)
8. Particles (fade out, shrink, apply gravity)

### Ball Trail
```js
ball.trail.push({ x: ball.x, y: ball.y });
if (ball.trail.length > 8) ball.trail.shift();
```
Each trail point is drawn as a fading, shrinking circle.

---

## Cheat/Exploit Notes

| Mechanic | Exploit |
|---|---|
| **Score** | `score` is a plain global — open DevTools and set `score = 999999` |
| **Lives** | `lives` is a plain global — set `lives = 99` |
| **Level skip** | Call `level = 8; initBricks(8); resetBalls(8)` in console |
| **Instant power-up balls** | Call `for(var i=0;i<5;i++) balls.push(makeBall(340, 460, -Math.PI/2, level))` |
| **Big ball (without code)** | Call `activateBigBall()` or `setBigBallMode(true)` in console |
| **Easter egg shortcut** | Call `activateBigBall()` directly instead of typing ABAB |
| **Win instantly** | Set `var remaining = 0` won't help — call `endGame(true)` in console |
| **Infinite lives** | Overwrite the variable: `Object.defineProperty(window, 'lives', {get: () => 99, set: () => {}})` |

---

## Level Progression

| Level | Ball Speed | Top Row HP | 2nd Row HP |
|---|---|---|---|
| 1–2 | 4.5 | 1 | 1 |
| 3–4 | 5.1 / 5.4 | 1 | 2 |
| 5+ | 5.7+ | 3 | 2 |
| 8 (max) | 6.6 | 3 | 2 |

Total bricks per level: **60** (6 rows × 10 cols).

---

## Summary

This is a clean, well-structured vanilla JS game. The architecture is deliberately simple — no modules, no bundler, pure global scope. Key systems:

- **Physics**: AABB vs circle collision with overlap resolution
- **Difficulty**: Ball speed + HP per level + decreasing powerup threshold
- **Reward loop**: Score grows with hit combo; powerups snowball ball count
- **Easter egg**: ABAB sequence → giant pink ball mode
