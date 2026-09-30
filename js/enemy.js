// ============================================================
// enemy.js — 磚塊、球體、道具、粒子生成與碰撞邏輯（全域）
// ============================================================

var balls     = [];
var bricks    = [];
var powerups  = [];
var particles = [];

var _bigBallMode = false;

function getBigBallMode() { return _bigBallMode; }
function setBigBallMode(v) {
  _bigBallMode = v;
  var newR = currentBallR();
  for (var i = 0; i < balls.length; i++) balls[i].r = newR;
}
function currentBallR() {
  return _bigBallMode ? BIG_BALL_R : NORMAL_BALL_R;
}

// ── 磚塊 ─────────────────────────────────────────────────
function brickW() {
  return (BASE_W - (BRICK_COLS + 1) * BRICK_PAD) / BRICK_COLS;
}
function brickH() { return 18; }

function initBricks(level) {
  bricks = [];
  var w = brickW();
  var h = brickH();
  for (var r = 0; r < BRICK_ROWS; r++) {
    for (var c = 0; c < BRICK_COLS; c++) {
      var hp = 1;
      if (level >= 3 && r < 2) hp = 2;
      if (level >= 5 && r < 1) hp = 3;
      bricks.push({
        x: BRICK_PAD + c * (w + BRICK_PAD),
        y: BRICK_TOP + r * (h + BRICK_PAD),
        w: w, h: h,
        color: BRICK_COLORS[r % BRICK_COLORS.length],
        alive: true, hp: hp, maxHp: hp
      });
    }
  }
}

// ── 球體 ─────────────────────────────────────────────────
function makeBall(x, y, angle, level) {
  var spd = BALL_SPEED + (level - 1) * 0.3;
  return {
    x: x, y: y, r: currentBallR(),
    dx: Math.cos(angle) * spd,
    dy: Math.sin(angle) * spd,
    trail: []
  };
}

function resetBalls(level) {
  balls = [];
  var angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
  balls.push(makeBall(BASE_W / 2, BASE_H - 60, angle, level));
}

// ── 道具 ─────────────────────────────────────────────────
function spawnPowerup(bx, by, bw, bh) {
  powerups.push({
    x: bx + bw / 2 - 8,
    y: by + bh / 2 - 8,
    w: 16, h: 16,
    dy: POWERUP_FALL_SPEED,
    pulse: 0
  });
}

// ── 粒子 ─────────────────────────────────────────────────
function spawnParticles(x, y, color, count) {
  for (var i = 0; i < count; i++) {
    var angle = Math.random() * Math.PI * 2;
    var speed = PARTICLE_SPEED_MIN + Math.random() * (PARTICLE_SPEED_MAX - PARTICLE_SPEED_MIN);
    particles.push({
      x: x, y: y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      life: 1,
      decay: PARTICLE_DECAY_MIN + Math.random() * (PARTICLE_DECAY_MAX - PARTICLE_DECAY_MIN),
      size: PARTICLE_SIZE_MIN + Math.random() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN),
      color: color
    });
  }
}

// ── 碰撞：球 vs 磚塊 ──────────────────────────────────────
function ballBrickCollision(ball, b) {
  var closestX = Math.max(b.x, Math.min(ball.x, b.x + b.w));
  var closestY = Math.max(b.y, Math.min(ball.y, b.y + b.h));
  var distX = ball.x - closestX;
  var distY = ball.y - closestY;
  if (distX * distX + distY * distY > ball.r * ball.r) return false;

  var prevX     = ball.x - ball.dx;
  var prevY     = ball.y - ball.dy;
  var hitLeft   = prevX < b.x       && ball.dx > 0;
  var hitRight  = prevX > b.x + b.w && ball.dx < 0;
  var hitTop    = prevY < b.y       && ball.dy > 0;
  var hitBottom = prevY > b.y + b.h && ball.dy < 0;

  if (hitLeft)        { ball.dx = -Math.abs(ball.dx); ball.x = b.x - ball.r - 0.5; }
  else if (hitRight)  { ball.dx =  Math.abs(ball.dx); ball.x = b.x + b.w + ball.r + 0.5; }
  else if (hitTop)    { ball.dy = -Math.abs(ball.dy); ball.y = b.y - ball.r - 0.5; }
  else if (hitBottom) { ball.dy =  Math.abs(ball.dy); ball.y = b.y + b.h + ball.r + 0.5; }
  else {
    var oL = (ball.x + ball.r) - b.x;
    var oR = (b.x + b.w) - (ball.x - ball.r);
    var oT = (ball.y + ball.r) - b.y;
    var oB = (b.y + b.h) - (ball.y - ball.r);
    if (Math.min(oL, oR) < Math.min(oT, oB)) {
      ball.dx = -ball.dx;
      ball.x += (oL < oR) ? -(oL + 0.5) : (oR + 0.5);
    } else {
      ball.dy = -ball.dy;
      ball.y += (oT < oB) ? -(oT + 0.5) : (oB + 0.5);
    }
  }
  return true;
}

// ── 繪製：磚塊 ────────────────────────────────────────────
function drawBricks(ctx) {
  for (var i = 0; i < bricks.length; i++) {
    var b = bricks[i];
    if (!b.alive) continue;
    var col       = b.color;
    var hpRatio   = b.hp / b.maxHp;
    var dimFactor = 0.6 + 0.4 * hpRatio;
    ctx.fillStyle = oklch(col[0] * dimFactor + 0.1 * (1 - dimFactor), col[1], col[2]);
    ctx.beginPath();
    roundRect(ctx, b.x, b.y, b.w, b.h, 4);
    ctx.fill();

    ctx.fillStyle = oklch(1, 0, 0, 0.08);
    ctx.beginPath();
    roundRect(ctx, b.x, b.y, b.w, b.h * 0.5, 4);
    ctx.fill();

    if (b.maxHp > 1 && b.hp < b.maxHp) {
      ctx.strokeStyle = oklch(1, 0, 0, 0.25);
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x + b.w * 0.3, b.y);
      ctx.lineTo(b.x + b.w * 0.5, b.y + b.h * 0.5);
      ctx.lineTo(b.x + b.w * 0.4, b.y + b.h);
      ctx.stroke();
    }
  }
}

// ── 繪製：道具 ────────────────────────────────────────────
function drawPowerups(ctx) {
  for (var pi = 0; pi < powerups.length; pi++) {
    var pu         = powerups[pi];
    var pulseScale = 1 + Math.sin(pu.pulse) * 0.15;
    var cx         = pu.x + pu.w / 2;
    var cy         = pu.y + pu.h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(pu.pulse * 0.5);
    ctx.scale(pulseScale, pulseScale);

    ctx.shadowColor = 'rgba(100,230,140,0.6)';
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = oklch(0.78, 0.22, 145);
    ctx.fillRect(-pu.w / 2, -pu.h / 2, pu.w, pu.h);
    ctx.shadowBlur  = 0;

    ctx.fillStyle = oklch(0.92, 0.12, 145, 0.5);
    ctx.fillRect(-pu.w / 2 + 3, -pu.h / 2 + 3, pu.w - 6, pu.h / 2 - 3);

    ctx.fillStyle    = oklch(0.18, 0.02, 145);
    ctx.font         = 'bold 11px Space Grotesk, system-ui';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+5', 0, 1);
    ctx.restore();
  }
}

// ── 繪製：球體 ────────────────────────────────────────────
function drawBalls(ctx) {
  for (var bi = 0; bi < balls.length; bi++) {
    var ball = balls[bi];
    for (var ti = 0; ti < ball.trail.length; ti++) {
      var t     = ball.trail[ti];
      var alpha = (ti / ball.trail.length) * 0.2;
      var size  = ball.r * (ti / ball.trail.length) * 0.6;
      ctx.fillStyle = _bigBallMode
        ? oklch(0.75, 0.2, 330, alpha)
        : oklch(0.95, 0.01, 260, alpha);
      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = _bigBallMode
      ? oklch(0.8, 0.18, 330)
      : oklch(0.95, 0.01, 260);
    ctx.shadowColor = _bigBallMode
      ? 'rgba(230,100,200,0.6)'
      : 'rgba(220,220,255,0.5)';
    ctx.shadowBlur = _bigBallMode ? 18 : 10;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (_bigBallMode) {
      ctx.fillStyle = oklch(0.9, 0.1, 330, 0.3);
      ctx.beginPath();
      ctx.arc(ball.x - ball.r * 0.25, ball.y - ball.r * 0.25, ball.r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ── 繪製：粒子 ────────────────────────────────────────────
function drawParticles(ctx) {
  for (var i = 0; i < particles.length; i++) {
    var p = particles[i];
    ctx.globalAlpha = p.life;
    ctx.fillStyle   = oklch(p.color[0], p.color[1], p.color[2]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── 更新：粒子物理 ────────────────────────────────────────
function updateParticles() {
  for (var i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    p.x  += p.dx;
    p.y  += p.dy;
    p.dy += 0.08;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
