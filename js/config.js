// ============================================================
// config.js — 所有遊戲常數與設定（全域變數，無需 import）
// ============================================================

var BASE_W = 680;
var BASE_H = 520;

var NORMAL_BALL_R = 7;
var BIG_BALL_R    = 22;
var BALL_SPEED    = 4.5;

var BRICK_ROWS = 6;
var BRICK_COLS = 10;
var BRICK_PAD  = 6;
var BRICK_TOP  = 50;

var PADDLE_W        = 100;
var PADDLE_H        = 12;
var PADDLE_SPEED    = 7;
var PADDLE_Y_OFFSET = 32;

var SCORE_BASE = 10;

var INITIAL_LIVES          = 3;
var MAX_LEVEL              = 8;
var INITIAL_COMBO_THRESHOLD = 10;
var MIN_COMBO_THRESHOLD    = 4;
var POWERUP_EXTRA_BALLS    = 5;
var POWERUP_THRESHOLD_STEP = 2;
var POWERUP_FALL_SPEED     = 1.2;

var PARTICLE_SPEED_MIN = 1;
var PARTICLE_SPEED_MAX = 4;
var PARTICLE_DECAY_MIN = 0.02;
var PARTICLE_DECAY_MAX = 0.05;
var PARTICLE_SIZE_MIN  = 2;
var PARTICLE_SIZE_MAX  = 5;

var EASTER_CODE = ['a', 'b', 'a', 'b'];

var BRICK_COLORS = [
  [0.68, 0.20, 25],
  [0.70, 0.20, 50],
  [0.72, 0.22, 145],
  [0.65, 0.20, 260],
  [0.68, 0.20, 300],
  [0.72, 0.18, 80]
];
