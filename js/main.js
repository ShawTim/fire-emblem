// main.js — Game initialization and main loop

var canvas = document.getElementById('gameCanvas');
canvas.width = 800;
canvas.height = 600;
var ctx = canvas.getContext('2d');

SFX.init();

var game = new Game(canvas);
game.init();

function gameLoop(timestamp) {
  Sprites.tick();
  game.update(timestamp);
  game.render(ctx);
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// Convert screen coords (mouse or touch) to canvas coords
function screenToCanvas(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

// Mouse input
canvas.addEventListener('click', (e) => {
  const pos = screenToCanvas(e.clientX, e.clientY);
  game.handleClick(pos.x, pos.y);
});

canvas.addEventListener('mousemove', (e) => {
  const pos = screenToCanvas(e.clientX, e.clientY);
  game.handleHover(pos.x, pos.y);
});

// Touch input (prevent double-fire with mouse events)
let touchHandled = false;
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  touchHandled = true;
  const touch = e.touches[0];
  const pos = screenToCanvas(touch.clientX, touch.clientY);
  game.handleClick(pos.x, pos.y);
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  // Reset after a short delay
  setTimeout(() => { touchHandled = false; }, 300);
}, { passive: false });

// Keyboard input
document.addEventListener('keydown', (e) => {
  game.handleKey(e.key);
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
    e.preventDefault();
  }
});

// UI buttons
document.getElementById('btn-end-turn').addEventListener('click', (e) => {
  e.stopPropagation();
  game.endTurn();
});
document.getElementById('btn-new-game').addEventListener('click', (e) => {
  e.stopPropagation();
  game.startNewGame();
});
document.getElementById('btn-continue').addEventListener('click', (e) => {
  e.stopPropagation();
  game.continueGame();
});

// Mute toggle
document.getElementById('btn-mute').addEventListener('click', (e) => {
  e.stopPropagation();
  const muted = SFX.toggleMute();
  e.target.textContent = muted ? '🔇' : '🔊';
});

// Prevent zoom on double-tap (iOS)
document.addEventListener('touchstart', (e) => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });
