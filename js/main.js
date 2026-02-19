// main.js — Game initialization and main loop

var canvas = document.getElementById('gameCanvas');
canvas.width = 800;
canvas.height = 600;
var ctx = canvas.getContext('2d');

SFX.init();
BGM.init();
BGM.createVolumeControl();

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
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartCamX = 0;
let dragStartCamY = 0;

canvas.addEventListener('mousedown', (e) => {
  const pos = screenToCanvas(e.clientX, e.clientY);
  isDragging = true;
  dragStartX = pos.x;
  dragStartY = pos.y;
  dragStartCamX = GameMap.camX;
  dragStartCamY = GameMap.camY;
  canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mousemove', (e) => {
  const pos = screenToCanvas(e.clientX, e.clientY);
  
  if (isDragging) {
    // Drag to scroll the map
    const dx = dragStartX - pos.x;
    const dy = dragStartY - pos.y;
    GameMap.camX = dragStartCamX + dx;
    GameMap.camY = dragStartCamY + dy;
    GameMap.clampCamera(canvas.width, canvas.height);
  } else {
    // Normal hover behavior
    game.handleHover(pos.x, pos.y);
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (isDragging) {
    isDragging = false;
    canvas.style.cursor = 'default';
    
    // Check if this was a click (minimal drag) or actual drag
    const pos = screenToCanvas(e.clientX, e.clientY);
    const dragDistance = Math.abs(pos.x - dragStartX) + Math.abs(pos.y - dragStartY);
    
    // If drag distance is small (< 5 pixels), treat it as a click
    if (dragDistance < 5) {
      game.handleClick(pos.x, pos.y);
    }
  }
});

canvas.addEventListener('mouseleave', (e) => {
  if (isDragging) {
    isDragging = false;
    canvas.style.cursor = 'default';
  }
});

// Old click handler - now handled in mouseup
// canvas.addEventListener('click', (e) => {
//   const pos = screenToCanvas(e.clientX, e.clientY);
//   game.handleClick(pos.x, pos.y);
// });

// Old mousemove handler - now integrated above
// canvas.addEventListener('mousemove', (e) => {
//   const pos = screenToCanvas(e.clientX, e.clientY);
//   game.handleHover(pos.x, pos.y);
// });

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
  const muted = BGM.toggleMute();
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

// === Mobile Support (DISABLED - caused rendering issues) ===
// Temporarily disabled to fix canvas scaling bugs
// TODO: Re-implement with proper coordinate transformation
/*
var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
var isLandscapeFS = false;
var mobileBtn = document.getElementById('mobile-toggle');

function resizeCanvas() {
  var w = window.innerWidth;
  var h = window.innerHeight;
  canvas.width = 800;
  canvas.height = 600;
  var scale = Math.min(w / 800, h / 600);
  canvas.style.width = Math.floor(800 * scale) + 'px';
  canvas.style.height = Math.floor(600 * scale) + 'px';
  ctx.imageSmoothingEnabled = false;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
*/
