// ============================================================
// player.js — 玩家板子控制（全域，無 import/export）
// ============================================================

var paddle = {
  w: PADDLE_W,
  h: PADDLE_H,
  x: 0,
  y: 0,
  speed: PADDLE_SPEED,
  targetX: 0
};

function resetPaddle() {
  paddle.x      = (BASE_W - paddle.w) / 2;
  paddle.y      = BASE_H - PADDLE_Y_OFFSET;
  paddle.targetX = paddle.x;
}

function updatePaddle(keys, mouseX) {
  if (mouseX !== null) paddle.targetX = mouseX - paddle.w / 2;
  if (keys['ArrowLeft']  || keys['a']) paddle.targetX -= paddle.speed;
  if (keys['ArrowRight'] || keys['d']) paddle.targetX += paddle.speed;
  paddle.targetX = Math.max(0, Math.min(BASE_W - paddle.w, paddle.targetX));
  paddle.x += (paddle.targetX - paddle.x) * 0.25;
}

function drawPaddle(ctx) {
  var padGrad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.h);
  padGrad.addColorStop(0, oklch(0.75, 0.18, 45));
  padGrad.addColorStop(1, oklch(0.62, 0.18, 45));
  ctx.fillStyle = padGrad;
  ctx.beginPath();
  roundRect(ctx, paddle.x, paddle.y, paddle.w, paddle.h, 6);
  ctx.fill();

  ctx.shadowColor = 'rgba(220,160,80,0.4)';
  ctx.shadowBlur  = 16;
  ctx.fillStyle   = 'transparent';
  ctx.beginPath();
  roundRect(ctx, paddle.x, paddle.y, paddle.w, paddle.h, 6);
  ctx.fill();
  ctx.shadowBlur = 0;
}
