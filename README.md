# Breakout Game (打磚塊遊戲)

這個資料夾包含逆向工程自 [https://s11311195-ops.github.io/mein-game/](https://s11311195-ops.github.io/mein-game/) 的完整遊戲原始碼，並已整合專屬 BGM 音樂系統與 Web Audio 音效！

---

## 📁 檔案結構

```
31034-e04-yuri/
│
├── index.html                           # 主頁面 (包含 HUD、畫布、彈出視窗與靜音按鈕)
├── REVERSE_ENGINEERING_REPORT.md         # 完整的逆向工程深度分析報告
├── README.md                            # 本說明檔案
│
├── audio/
│   └── bgm.mp3                          # 背景音樂 (Heroes Tonight x Dreams pt. II Mashup)
│
├── css/
│   └── style.css                        # 遊戲樣式 (現代 oklch 配色、動畫、HUD、靜音鍵)
│
└── js/
    ├── config.js                        # 全域常數設定 (球速、磚塊列數、生命數等)
    ├── enemy.js                         # 磚塊、球、道具、粒子特效與碰撞物理計算
    ├── player.js                        # 擋板控制、滑鼠/觸控/鍵盤平滑移動
    ├── audio.js                         # BGM 播放器與 Web Audio API 原生合成音效
    ├── game.js                          # 遊戲主循環、狀態機、計分、連擊與彩蛋
    └── main.js                          # DOMContentLoaded 啟動入口
```

---

## 🎮 如何遊玩

1. 直接使用瀏覽器打開 `index.html`，或使用任何本地伺服器（例如 VS Code Live Server 或 `npx serve`）。
2. **控制方式**：
   - 鍵盤：`←` / `→` 或 `A` / `D` 移動擋板
   - 滑鼠 / 觸控：直接滑動游標或手指
   - 靜音：點擊右上角 `🔊` 按鈕或按下鍵盤 **`M`**
3. **機制**：
   - 每擊破 **10 塊磚** 會掉落一個綠色 `+5` 道具，接住可獲得 **5 顆額外彈珠**！
   - 每吃一次道具，下次所需的擊破門檻會減少 2 次（最少 4 次）。

---

## 🥚 彩蛋 (Easter Egg)

- 在遊戲進行中，依序按下鍵盤：
  **`A` `B` `A` `B`**
- 即會解鎖 **BIG BALL MODE (超巨大粉紅魔球模式)**！所有彈珠半徑由 7px 膨脹至 22px，並帶有粉紅色拖尾光暈。再次輸入可切換回原本大小。

---

## 🎵 BGM 與音效特色

- **自訂 BGM**：已將您的 `Sara Skinner, Lost Sky, Johnning, Janji - Heroes Tonight x Dreams pt. II Mashup` 配置為循環背景音樂 (`audio/bgm.mp3`)。
- **Web Audio 原生音效**：
  - 擋板彈跳音效 (`playSfxPaddle`)
  - 磚塊打擊與破裂音效 (`playSfxBrick`)
  - 道具拾取琶音 (`playSfxPowerup`)
  - 扣血音效 (`playSfxLoseLife`)
  - 晉級和弦 (`playSfxLevelUp`)
  - 彩蛋啟動雷射音 (`playSfxEaster`)
  - 全破勝利號角 (`playSfxWin`)

---

## 🛠️ 開發者密技 (F12 控制台)

在瀏覽器按下 F12 開啟 Console，可直接修改全域變數：

```javascript
// 獲得 99 條命
lives = 99; renderLives();

// 直接升級到第 8 關
level = 8; initBricks(8); resetBalls(8); resetPaddle();

// 瞬間生成 20 顆球
for(var i=0; i<20; i++) balls.push(makeBall(340, 460, -Math.PI/2, level));

// 直接全破
endGame(true);
```
