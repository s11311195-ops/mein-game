// ============================================================
// main.js — 遊戲啟動入口（全域，無 import/export）
// ============================================================

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
  initUI();
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('restartBtn').addEventListener('click', startGame);
});
