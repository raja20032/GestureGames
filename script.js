// Gesture Mario (Web): MediaPipe Hands -> Jump (Space/ArrowUp) -> Canvas runner

const startBtn = document.getElementById("startBtn");
const videoEl = document.getElementById("video");
const overlayEl = document.getElementById("overlay");
const overlayCtx = overlayEl.getContext("2d");
const handStatusEl = document.getElementById("handStatus");
const debugEl = document.getElementById("debug");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");

const gameCanvas = document.getElementById("gameCanvas");
const g = gameCanvas.getContext("2d");

let running = false;
let hands = null;
let lastGestureJumpAt = 0;

// ---------------------------
// Game (simple Mario-like runner)
// ---------------------------

const GameState = {
  Ready: "ready",
  Running: "running",
  GameOver: "gameover",
};

const game = {
  state: GameState.Ready,
  t: 0,
  score: 0,
  best: Number(localStorage.getItem("bestScore") || "0"),
  speed: 420,
  spawnTimer: 0,
  obstacles: [],
  player: {
    x: 150,
    y: 0,
    w: 42,
    h: 54,
    vy: 0,
    onGround: true,
  },
};

function resetGame() {
  game.t = 0;
  game.score = 0;
  game.speed = 420;
  game.spawnTimer = 0;
  game.obstacles = [];
  game.player.vy = 0;
  game.player.onGround = true;
  game.state = GameState.Running;
}

function setBestScore(v) {
  game.best = Math.max(game.best, v);
  localStorage.setItem("bestScore", String(game.best));
  bestEl.textContent = String(game.best);
}

bestEl.textContent = String(game.best);

function jump(reason) {
  if (game.state === GameState.Ready) resetGame();
  if (game.state !== GameState.Running) return;
  if (!game.player.onGround) return;

  game.player.vy = -860;
  game.player.onGround = false;
  if (reason) debugEl.textContent = `Jump: ${reason}`;
}

function handleKeydown(e) {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    jump("keyboard");
  } else if (e.code === "Enter") {
    if (game.state !== GameState.Running) resetGame();
  }
}
window.addEventListener("keydown", handleKeydown, { passive: false });

function spawnObstacle() {
  // Pipe-like obstacle
  const w = 56;
  const minH = 70;
  const maxH = 140;
  const h = Math.floor(minH + Math.random() * (maxH - minH));
  const groundY = gameCanvas.height - 70;
  const y = groundY - h;
  game.obstacles.push({
    x: gameCanvas.width + 30,
    y,
    w,
    h,
    passed: false,
  });
}

function aabb(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function update(dt) {
  const groundY = gameCanvas.height - 70;

  if (game.state === GameState.Running) {
    game.t += dt;
    game.speed = Math.min(760, 420 + game.t * 10);
    game.spawnTimer -= dt;

    if (game.spawnTimer <= 0) {
      spawnObstacle();
      const next = 1.1 + Math.random() * 0.7;
      game.spawnTimer = next;
    }

    // physics
    const gravity = 2500;
    game.player.vy += gravity * dt;
    game.player.y += game.player.vy * dt;

    if (game.player.y + game.player.h >= groundY) {
      game.player.y = groundY - game.player.h;
      game.player.vy = 0;
      game.player.onGround = true;
    }

    // obstacles
    for (const o of game.obstacles) {
      o.x -= game.speed * dt;
      if (!o.passed && o.x + o.w < game.player.x) {
        o.passed = true;
        game.score += 1;
      }
      if (aabb(game.player, o)) {
        game.state = GameState.GameOver;
        setBestScore(game.score);
        debugEl.textContent = "Game over. Press Enter to restart.";
      }
    }

    game.obstacles = game.obstacles.filter((o) => o.x + o.w > -50);
  } else if (game.state === GameState.Ready) {
    // idle bob
    const bob = Math.sin(performance.now() / 250) * 2;
    game.player.y = (gameCanvas.height - 70) - game.player.h + bob;
  }

  scoreEl.textContent = String(game.score);
}

function draw() {
  const w = gameCanvas.width;
  const h = gameCanvas.height;
  const groundY = h - 70;

  // background
  g.clearRect(0, 0, w, h);

  // clouds
  g.globalAlpha = 0.20;
  g.fillStyle = "#ffffff";
  for (let i = 0; i < 4; i++) {
    const cx = ((performance.now() * 0.02 + i * 240) % (w + 200)) - 100;
    const cy = 90 + i * 18;
    g.beginPath();
    g.ellipse(cx, cy, 55, 22, 0, 0, Math.PI * 2);
    g.ellipse(cx + 45, cy + 4, 35, 16, 0, 0, Math.PI * 2);
    g.ellipse(cx - 40, cy + 6, 32, 14, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  // ground
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.fillRect(0, groundY, w, h - groundY);
  g.fillStyle = "rgba(255,255,255,0.10)";
  g.fillRect(0, groundY, w, 2);

  // obstacles (pipes)
  for (const o of game.obstacles) {
    g.fillStyle = "#2ee56b";
    g.fillRect(o.x, o.y, o.w, o.h);
    g.fillStyle = "#18b84d";
    g.fillRect(o.x + 6, o.y + 6, o.w - 12, o.h - 12);
    // lip
    g.fillStyle = "#37ff77";
    g.fillRect(o.x - 6, o.y, o.w + 12, 10);
  }

  // player (simple mario-ish block)
  const p = game.player;
  g.fillStyle = "#ff3b3b";
  g.fillRect(p.x, p.y, p.w, p.h);
  g.fillStyle = "#ffffff";
  g.fillRect(p.x + 10, p.y + 14, 8, 8); // eye
  g.fillRect(p.x + 24, p.y + 14, 8, 8); // eye
  g.fillStyle = "#111";
  g.fillRect(p.x + 12, p.y + 16, 4, 4);
  g.fillRect(p.x + 26, p.y + 16, 4, 4);
  g.fillStyle = "#ffd07a";
  g.fillRect(p.x + 16, p.y + 28, 10, 8); // nose-ish

  // overlay texts
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.font = "14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";

  if (game.state === GameState.Ready) {
    g.fillText("Press Space / ↑ or open hand to start", 18, 32);
  } else if (game.state === GameState.GameOver) {
    g.fillText("Game over — Press Enter to restart", 18, 32);
  }
}

let lastFrameAt = performance.now();
function gameLoop(now) {
  const dt = Math.min(0.033, (now - lastFrameAt) / 1000);
  lastFrameAt = now;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// ---------------------------
// MediaPipe Hands
// ---------------------------

function resizeOverlayToVideo() {
  // Keep overlay resolution matched to displayed video size for crisp drawing.
  const rect = videoEl.getBoundingClientRect();
  const cssW = Math.max(1, Math.floor(rect.width));
  const cssH = Math.max(1, Math.floor(rect.height));
  overlayEl.width = cssW;
  overlayEl.height = cssH;
}

window.addEventListener("resize", () => {
  if (!running) return;
  resizeOverlayToVideo();
});

function isOpenHand(landmarks) {
  // Basic "open palm" heuristic: tip is above PIP joint for 4 fingers.
  // Indices: index(8/6), middle(12/10), ring(16/14), pinky(20/18)
  const pairs = [
    [8, 6],
    [12, 10],
    [16, 14],
    [20, 18],
  ];
  let extended = 0;
  for (const [tip, pip] of pairs) {
    const tipY = landmarks[tip].y;
    const pipY = landmarks[pip].y;
    if (pipY - tipY > 0.045) extended += 1;
  }
  return extended >= 3;
}

function maybeGestureJump(reason) {
  const now = performance.now();
  // Cooldown so one open hand doesn't spam jump
  if (now - lastGestureJumpAt < 350) return;
  lastGestureJumpAt = now;
  jump(reason);
}

async function startCameraAndHands() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: "user",
    },
    audio: false,
  });
  videoEl.srcObject = stream;
  await videoEl.play();

  resizeOverlayToVideo();

  hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    selfieMode: true,
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6,
  });

  hands.onResults((results) => {
    overlayCtx.clearRect(0, 0, overlayEl.width, overlayEl.height);

    const landmarks = results.multiHandLandmarks?.[0];
    if (!landmarks) {
      handStatusEl.textContent = "Hand: not detected";
      handStatusEl.classList.add("muted");
      debugEl.textContent = "";
      return;
    }

    handStatusEl.textContent = "Hand: detected";
    handStatusEl.classList.remove("muted");

    // Draw connectors/landmarks
    drawConnectors(overlayCtx, landmarks, HAND_CONNECTIONS, { color: "#00d4ff", lineWidth: 2 });
    drawLandmarks(overlayCtx, landmarks, { color: "#7c5cff", lineWidth: 1, radius: 2 });

    if (isOpenHand(landmarks)) {
      maybeGestureJump("open hand");
    }
  });

  running = true;
  handStatusEl.textContent = "Hand: starting...";

  async function loop() {
    if (!running) return;
    if (videoEl.readyState >= 2) {
      try {
        await hands.send({ image: videoEl });
      } catch (e) {
        // If model isn't ready or video hiccups, keep trying.
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

startBtn.addEventListener("click", async () => {
  if (running) return;
  startBtn.disabled = true;
  startBtn.textContent = "Starting...";
  try {
    await startCameraAndHands();
    startBtn.textContent = "Running";
    debugEl.textContent = "Tip: open hand to jump.";
  } catch (e) {
    startBtn.disabled = false;
    startBtn.textContent = "Start camera + game";
    handStatusEl.textContent = "Hand: failed to start";
    handStatusEl.classList.add("muted");
    debugEl.textContent = `Camera/model error: ${e?.message || e}`;
  }
});


