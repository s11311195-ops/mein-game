// ============================================================
// audio.js — BGM & SFX 聲音管理模組
// 支援自訂 MP3 背景音樂 + Web Audio API 音效與合成音樂降級機制
// ============================================================

var audioCtx = null;
var bgmMuted = false;
var bgmAudioEl = null;
var bgmVolume = 0.5;
var sfxVolume = 0.35;
var bgmStarted = false;

// 候選音訊檔案路徑清單（確保各種環境與檔名皆能順利讀取）
var BGM_CANDIDATE_PATHS = [
  './audio/bgm.mp3',
  './audio/Sara Skinner, Lost Sky, Johnning, Janji - Heroes Tonight x Dreams pt. II Mashup [NCS Release].mp3',
  './Sara Skinner, Lost Sky, Johnning, Janji - Heroes Tonight x Dreams pt. II Mashup [NCS Release].mp3'
];
var currentBgmPathIndex = 0;

// ── 初始化 AudioContext (需在使用者互動後啟動) ──────────────
function initAudio() {
  if (!audioCtx) {
    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // 初始化 HTML5 Audio 物件以播放自訂 BGM
  if (!bgmAudioEl) {
    bgmAudioEl = new Audio();
    bgmAudioEl.loop = true;
    bgmAudioEl.preload = 'auto';
    bgmAudioEl.volume = bgmMuted ? 0 : bgmVolume;

    bgmAudioEl.src = BGM_CANDIDATE_PATHS[currentBgmPathIndex];

    bgmAudioEl.addEventListener('error', function(err) {
      console.warn('[Audio] Failed to load BGM from:', BGM_CANDIDATE_PATHS[currentBgmPathIndex]);
      currentBgmPathIndex++;
      if (currentBgmPathIndex < BGM_CANDIDATE_PATHS.length) {
        console.log('[Audio] Trying fallback path:', BGM_CANDIDATE_PATHS[currentBgmPathIndex]);
        bgmAudioEl.src = BGM_CANDIDATE_PATHS[currentBgmPathIndex];
        if (bgmStarted) {
          bgmAudioEl.play().catch(function() {});
        }
      } else {
        console.warn('[Audio] All candidate paths failed, fallback to synth synthesizer.');
      }
    });
  }
}

// ── 靜音切換 ──────────────────────────────────────────────
function toggleMute() {
  bgmMuted = !bgmMuted;
  if (bgmAudioEl) {
    bgmAudioEl.volume = bgmMuted ? 0 : bgmVolume;
  }
  var btn = document.getElementById('muteBtn');
  if (btn) {
    btn.textContent = bgmMuted ? '🔇' : '🔊';
    btn.setAttribute('aria-label', bgmMuted ? 'Unmute' : 'Mute');
    btn.title = bgmMuted ? 'Sound: Muted (Click or press M)' : 'Sound: On (Click or press M)';
  }
}

// ── BGM 播放與暫停 ────────────────────────────────────────
function startBGM() {
  initAudio();
  bgmStarted = true;
  if (bgmAudioEl) {
    bgmAudioEl.volume = bgmMuted ? 0 : bgmVolume;
    var playPromise = bgmAudioEl.play();
    if (playPromise !== undefined) {
      playPromise.then(function() {
        console.log('[Audio] Playing BGM:', bgmAudioEl.src);
      }).catch(function(err) {
        console.log('[Audio] Autoplay waiting for user gesture:', err);
      });
    }
  }
}

function pauseBGM() {
  if (bgmAudioEl) {
    bgmAudioEl.pause();
  }
}

function stopBGM() {
  if (bgmAudioEl) {
    bgmAudioEl.pause();
    bgmAudioEl.currentTime = 0;
  }
  bgmStarted = false;
}

// ── Web Audio 音效產生器 ──────────────────────────────────
function playTone(freq, duration, type, startGain, endGain, pitchDrop) {
  if (bgmMuted) return;
  initAudio();
  if (!audioCtx) return;

  try {
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();

    osc.type = type || 'sine';
    var now = audioCtx.currentTime;

    osc.frequency.setValueAtTime(freq, now);
    if (pitchDrop) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * pitchDrop), now + duration);
    }

    gain.gain.setValueAtTime((startGain || 0.3) * sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, (endGain || 0.001) * sfxVolume), now + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  } catch (e) {
    // 忽略音訊警告
  }
}

// ── 遊戲音效 (SFX) ────────────────────────────────────────

// 球反彈板子：Q 彈厚實音
function playSfxPaddle() {
  playTone(220, 0.08, 'triangle', 0.4, 0.001, 1.2);
}

// 擊中磚塊：高亢明亮打擊聲
function playSfxBrick(hpLeft) {
  if (hpLeft <= 0) {
    playTone(587.33, 0.12, 'square', 0.25, 0.001, 1.4);
    setTimeout(function() {
      playTone(880, 0.14, 'triangle', 0.3, 0.001);
    }, 40);
  } else {
    playTone(392, 0.08, 'sawtooth', 0.2, 0.001, 0.8);
  }
}

// 吃掉掉落道具 (+5 球)：清脆大三和弦琶音
function playSfxPowerup() {
  var notes = [523.25, 659.25, 783.99, 1046.50];
  for (var i = 0; i < notes.length; i++) {
    (function(n, idx) {
      setTimeout(function() {
        playTone(n, 0.15, 'triangle', 0.35, 0.001);
      }, idx * 60);
    })(notes[i], i);
  }
}

// 失去生命：下墜沉重低音
function playSfxLoseLife() {
  playTone(260, 0.35, 'sawtooth', 0.4, 0.001, 0.3);
}

// 通關晉級下一關：振奮和弦
function playSfxLevelUp() {
  var chords = [440, 554.37, 659.25, 880];
  for (var i = 0; i < chords.length; i++) {
    (function(n, idx) {
      setTimeout(function() {
        playTone(n, 0.25, 'triangle', 0.35, 0.001);
      }, idx * 80);
    })(chords[i], i);
  }
}

// 彩蛋 (大球模式觸發)：科幻雷射波形
function playSfxEaster() {
  playTone(300, 0.4, 'sine', 0.4, 0.001, 4.0);
  setTimeout(function() {
    playTone(1200, 0.3, 'triangle', 0.3, 0.001, 0.4);
  }, 120);
}

// 獲勝全破：大合奏琶音
function playSfxWin() {
  var fanfare = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
  for (var i = 0; i < fanfare.length; i++) {
    (function(n, idx) {
      setTimeout(function() {
        playTone(n, 0.3, 'triangle', 0.3, 0.001);
      }, idx * 100);
    })(fanfare[i], i);
  }
}
