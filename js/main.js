// ============================================================
// main.js — 遊戲啟動入口（全域，無 import/export）
// ============================================================

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
  initUI();

  // 點擊開始遊戲並啟動 BGM
  var startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', function() {
      if (typeof startBGM === 'function') startBGM();
      startGame();
    });
  }

  // 點擊再來一局
  var restartBtn = document.getElementById('restartBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      if (typeof startBGM === 'function') startBGM();
      startGame();
    });
  }

  // 靜音按鈕
  var muteBtn = document.getElementById('muteBtn');
  if (muteBtn) {
    muteBtn.addEventListener('click', function() {
      if (typeof toggleMute === 'function') toggleMute();
    });
  }
});
