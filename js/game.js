// ============================================================
// game.js — 遊戲主循環與狀態管理（全域，無 import/export）
// ============================================================

// ── DOM 參考 ─────────────────────────────────────────────
var canvas          = document.getElementById('c');
var ctx             = canvas.getContext('2d');
var gameWrap        = document.getElementById('gameWrap');
var scoreEl         = document.getElementById('score');
var levelEl         = document.getElementById('level');
var livesEl         = document.getElementById('lives');
var comboLabel      = document.getElementById('comboLabel');
var comboFill       = document.getElementById('comboFill');
var ballCountEl     = document.getElementById('ballCount');
var startOverlay    = document.getElementById('startOverlay');
var gameOverOverlay = document.getElementById('gameOverOverlay');
var endTitle        = document.getElementById('endTitle');
var endMsg          = document.getElementById('endMsg');

// ── 縮放因子 ─────────────────────────────────────────────
var scl = 1;

function resize() {
  var maxW = Math.min(window.innerWidth - 32, BASE_W);
  scl = maxW / BASE_W;
  canvas.width  = Math.round(BASE_W * scl);
  canvas.height = Math.round(BASE_H * scl);
  canvas.style.width  = canvas.width  + 'px';
  canvas.style.height = canvas.height + 'px';
}
resize();
window.addEventListener('resize', resize);

// ── 遊戲狀態 ─────────────────────────────────────────────
var state = 'start';
var score = 0, lives = INITIAL_LIVES, level = 1;
var hitCounter     = 0;
var comboThreshold = INITIAL_COMBO_THRESHOLD;
var animFrame;

var easterBuffer = [];

// ── 輸入 ─────────────────────────────────────────────────
var keys   = {};
var mouseX = null;

window.addEventListener('keydown', function(e) {
  keys[e.key] = true;

  if (state === 'playing') {
    easterBuffer.push(e.key.toLowerCase());
    if (easterBuffer.length > EASTER_CODE.length) easterBuffer.shift();
    if (easterBuffer.length === EASTER_CODE.length) {
      var match = true;
      for (var i = 0; i < EASTER_CODE.length; i++) {
        if (easterBuffer[i] !== EASTER_CODE[i]) { match = false; break; }
      }
      if (match) { activateBigBall(); easterBuffer = []; }
    }
  }
});
window.addEventListener('keyup', function(e) { keys[e.key] = false; });

canvas.addEventListener('mousemove', function(e) {
  var rect = canvas.getBoundingClientRect();
  mouseX = (e.clientX - rect.left) / scl;
});
canvas.addEventListener('touchmove', function(e) {
  e.preventDefault();
  var rect = canvas.getBoundingClientRect();
  mouseX = (e.touches[0].clientX - rect.left) / scl;
}, { passive: false });

// ── HUD 更新 ─────────────────────────────────────────────
function renderLives() {
  livesEl.innerHTML = '';
  for (var i = 0; i < 3; i++) {
    var d = document.createElement('div');
    d.className = 'life-dot' + (i >= lives ? ' lost' : '');
    livesEl.appendChild(d);
  }
}

function updateHUD() {
  var progress = hitCounter % comboThreshold;
  comboLabel.textContent  = 'Hits: ' + progress + ' / ' + comboThreshold;
  var pct = Math.min(100, (progress / comboThreshold) * 100);
  comboFill.style.width   = pct + '%';
  ballCountEl.textContent = 'Balls: ' + balls.length;
}

// ── UI 特效 ──────────────────────────────────────────────
function showPopup(x, y, text, cls) {
  var el = document.createElement('div');
  el.className  = 'combo-popup' + (cls ? ' ' + cls : '');
  el.textContent = text;
  el.style.left  = (x * scl) + 'px';
  el.style.top   = (y * scl) + 'px';
  gameWrap.appendChild(el);
  requestAnimationFrame(function() { el.classList.add('show'); });
  setTimeout(function() { el.remove(); }, 900);
}

// ── 彩蛋：大球模式 ────────────────────────────────────────
function activateBigBall() {
  setBigBallMode(!getBigBallMode());

  var flash = document.createElement('div');
  flash.className = 'easter-flash';
  gameWrap.appendChild(flash);
  setTimeout(function() { flash.remove(); }, 600);

  var msg = getBigBallMode() ? 'BIG BALL MODE!' : 'Normal ball mode';
  showPopup(BASE_W / 2, BASE_H / 2, msg, 'easter-text');
  spawnParticles(BASE_W / 2, BASE_H / 2, [0.75, 0.2, 330], 20);
}

// ── oklch 字串產生器 ─────────────────────────────────────
function oklch(l, c, h, a) {
  if (a !== undefined) return 'oklch(' + (l * 100) + '% ' + c + ' ' + h + ' / ' + a + ')';
  return 'oklch(' + (l * 100) + '% ' + c + ' ' + h + ')';
}

// ── roundRect 路徑繪製器 ─────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  if (typeof r === 'number') r = [r, r, r, r];
  ctx.moveTo(x + r[0], y);
  ctx.lineTo(x + w - r[1], y);
  ctx.arcTo(x + w, y,     x + w, y + r[1],     r[1]);
  ctx.lineTo(x + w, y + h - r[2]);
  ctx.arcTo(x + w, y + h, x + w - r[2], y + h, r[2]);
  ctx.lineTo(x + r[3], y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r[3], r[3]);
  ctx.lineTo(x, y + r[0]);
  ctx.arcTo(x,     y,     x + r[0], y,          r[0]);
  ctx.closePath();
}

// ── 更新（每幀邏輯）─────────────────────────────────────
function update() {
  updatePaddle(keys, mouseX);

  var ballsToRemove = [];
  for (var bi = 0; bi < balls.length; bi++) {
    var ball = balls[bi];
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 8) ball.trail.shift();

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x - ball.r < 0)      { ball.x = ball.r;          ball.dx =  Math.abs(ball.dx); }
    if (ball.x + ball.r > BASE_W) { ball.x = BASE_W - ball.r; ball.dx = -Math.abs(ball.dx); }
    if (ball.y - ball.r < 0)      { ball.y = ball.r;           ball.dy =  Math.abs(ball.dy); }

    if (
      ball.dy > 0 &&
      ball.y + ball.r >= paddle.y &&
      ball.y + ball.r <= paddle.y + paddle.h + 6 &&
      ball.x >= paddle.x - 4 &&
      ball.x <= paddle.x + paddle.w + 4
    ) {
      var hit   = (ball.x - paddle.x) / paddle.w;
      var angle = -Math.PI / 2 + (hit - 0.5) * 1.2;
      var spd   = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      ball.dx = Math.cos(angle) * spd;
      ball.dy = Math.sin(angle) * spd;
      ball.y  = paddle.y - ball.r;
      spawnParticles(ball.x, ball.y, [0.72, 0.18, 45], 4);
    }

    if (ball.y - ball.r > BASE_H) ballsToRemove.push(bi);

    var hitBrick = false;
    for (var i = 0; i < bricks.length; i++) {
      var b = bricks[i];
      if (!b.alive || hitBrick) continue;
      if (ballBrickCollision(ball, b)) {
        hitBrick = true;
        b.hp--;
        if (b.hp <= 0) {
          b.alive = false;
          hitCounter++;
          var pts = SCORE_BASE + hitCounter;
          score  += pts;
          scoreEl.textContent = score;
          spawnParticles(b.x + b.w / 2, b.y + b.h / 2, b.color, 8);

          if (hitCounter % 5 === 0) {
            showPopup(b.x + b.w / 2, b.y, hitCounter + ' hits! +' + pts, '');
          }

          if (hitCounter % comboThreshold === 0) {
            var aliveBricks = [];
            for (var ab = 0; ab < bricks.length; ab++) {
              if (bricks[ab].alive) aliveBricks.push(bricks[ab]);
            }
            if (aliveBricks.length > 0) {
              var src = aliveBricks[Math.floor(Math.random() * aliveBricks.length)];
              spawnPowerup(src.x, src.y, src.w, src.h);
              showPopup(src.x + src.w / 2, src.y, 'POWER-UP!', 'powerup-text');
            } else {
              spawnPowerup(b.x, b.y, b.w, b.h);
              showPopup(b.x + b.w / 2, b.y, 'POWER-UP!', 'powerup-text');
            }
          }
          updateHUD();
        } else {
          spawnParticles(b.x + b.w / 2, b.y + b.h / 2, b.color, 3);
        }
      }
    }
  }

  for (var ri = ballsToRemove.length - 1; ri >= 0; ri--) {
    balls.splice(ballsToRemove[ri], 1);
  }

  if (balls.length === 0) {
    lives--;
    renderLives();
    gameWrap.classList.add('shake');
    setTimeout(function() { gameWrap.classList.remove('shake'); }, 400);
    if (lives <= 0) { endGame(false); return; }
    resetBalls(level);
    updateHUD();
  }

  for (var pi = powerups.length - 1; pi >= 0; pi--) {
    var pu = powerups[pi];
    pu.y    += pu.dy;
    pu.pulse += 0.08;

    if (
      pu.y + pu.h >= paddle.y &&
      pu.y        <= paddle.y + paddle.h &&
      pu.x + pu.w >= paddle.x &&
      pu.x        <= paddle.x + paddle.w
    ) {
      for (var nb = 0; nb < POWERUP_EXTRA_BALLS; nb++) {
        var spreadAngle = -Math.PI / 2 + (nb - 2) * 0.25;
        balls.push(makeBall(
          paddle.x + paddle.w / 2,
          paddle.y - currentBallR() - 2,
          spreadAngle,
          level
        ));
      }
      comboThreshold = Math.max(MIN_COMBO_THRESHOLD, comboThreshold - POWERUP_THRESHOLD_STEP);
      updateHUD();
      showPopup(paddle.x + paddle.w / 2, paddle.y - 20,
        '+' + POWERUP_EXTRA_BALLS + ' BALLS! Next: ' + comboThreshold + ' hits', 'powerup-text');
      spawnParticles(pu.x + pu.w / 2, pu.y + pu.h / 2, [0.78, 0.22, 145], 16);
      powerups.splice(pi, 1);
      continue;
    }

    if (pu.y > BASE_H + 20) powerups.splice(pi, 1);
  }

  ballCountEl.textContent = 'Balls: ' + balls.length;

  var remaining = 0;
  for (var j = 0; j < bricks.length; j++) {
    if (bricks[j].alive) remaining++;
  }
  if (remaining === 0) {
    level++;
    if (level > MAX_LEVEL) { endGame(true); return; }
    levelEl.textContent = level;
    initBricks(level);
    resetBalls(level);
    resetPaddle();
    powerups.length = 0;
    updateHUD();
  }

  updateParticles();
}

// ── 繪製（每幀渲染）─────────────────────────────────────
function draw() {
  var W = canvas.width;
  var H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = oklch(0.14, 0.02, 260);
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = oklch(0.18, 0.01, 260, 0.3);
  ctx.lineWidth   = 1;
  var gridSize    = 40 * scl;
  for (var x = gridSize; x < W; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (var y = gridSize; y < H; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  ctx.save();
  ctx.scale(scl, scl);
  drawBricks(ctx);
  drawPowerups(ctx);
  drawBalls(ctx);
  drawPaddle(ctx);
  drawParticles(ctx);
  ctx.restore();
}

// ── 主循環 ───────────────────────────────────────────────
function loop() {
  if (state !== 'playing') return;
  update();
  draw();
  animFrame = requestAnimationFrame(loop);
}

// ── 遊戲流程 ─────────────────────────────────────────────
function startGame() {
  score = 0; lives = INITIAL_LIVES; level = 1;
  hitCounter     = 0;
  comboThreshold = INITIAL_COMBO_THRESHOLD;
  setBigBallMode(false);
  easterBuffer = [];
  particles.length = 0;
  powerups.length  = 0;
  scoreEl.textContent = '0';
  levelEl.textContent = '1';
  renderLives();
  initBricks(level);
  resetPaddle();
  resetBalls(level);
  updateHUD();
  state = 'playing';
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  loop();
}

function endGame(won) {
  state = 'over';
  cancelAnimationFrame(animFrame);
  endTitle.textContent = won ? 'You Win!' : 'Game Over';
  endMsg.textContent   = 'Final score: ' + score;
  gameOverOverlay.classList.remove('hidden');
}

function initUI() {
  renderLives();
  updateHUD();
}
