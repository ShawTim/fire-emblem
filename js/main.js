// main.js — Game initialization and main loop

var canvas = document.getElementById('gameCanvas');
canvas.width = 800;
canvas.height = 600;
var ctx = canvas.getContext('2d');

SFX.init();
BGM.init();
BGM.createVolumeControl();

// Preload chapters before starting game
var game;
preloadChapters().then(() => {
  game = new Game(canvas);
  game.init();
  requestAnimationFrame(gameLoop);
}).catch(err => {
  console.error('Failed to preload chapters:', err);
  // Start game anyway with fallback
  game = new Game(canvas);
  game.init();
  requestAnimationFrame(gameLoop);
});

function gameLoop(timestamp) {
  Sprites.tick();
  game.update(timestamp);
  game.render(ctx);
  requestAnimationFrame(gameLoop);
}

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

// Touch input (with drag vs tap differentiation)
let touchHandled = false;
let touchDragging = false;
let touchStartX = 0;
let touchStartY = 0;
let touchStartCamX = 0;
let touchStartCamY = 0;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  touchHandled = true;
  touchDragging = false;
  const touch = e.touches[0];
  const pos = screenToCanvas(touch.clientX, touch.clientY);
  touchStartX = pos.x;
  touchStartY = pos.y;
  touchStartCamX = GameMap.camX;
  touchStartCamY = GameMap.camY;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!touchHandled) return;
  const touch = e.touches[0];
  const pos = screenToCanvas(touch.clientX, touch.clientY);
  const dx = touchStartX - pos.x;
  const dy = touchStartY - pos.y;
  const dragDistance = Math.abs(dx) + Math.abs(dy);
  
  // If moved more than 10px, treat as drag
  if (dragDistance > 10) {
    touchDragging = true;
    GameMap.camX = touchStartCamX + dx;
    GameMap.camY = touchStartCamY + dy;
    GameMap.clampCamera(canvas.width, canvas.height);
  }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  // Only handle click if it wasn't a drag
  if (!touchDragging) {
    const pos = { x: touchStartX, y: touchStartY };
    game.handleClick(pos.x, pos.y);
  }
  // Reset after a short delay
  setTimeout(() => { 
    touchHandled = false; 
    touchDragging = false;
  }, 300);
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

// === Mobile Fullscreen Toggle ===
const mobileToggleBtn = document.getElementById('mobile-toggle');
if (mobileToggleBtn) {
  // Only show fullscreen button on small screens (mobile/tablet)
  function checkMobileFullscreen() {
    const isSmallScreen = window.innerWidth < 900 || window.innerHeight < 650;
    mobileToggleBtn.style.display = isSmallScreen ? 'block' : 'none';
  }
  checkMobileFullscreen();
  window.addEventListener('resize', checkMobileFullscreen);
  
  mobileToggleBtn.addEventListener('click', () => {
    const container = document.getElementById('game-container');
    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
      mobileToggleBtn.textContent = '退出全螢幕'; if (screen.orientation && screen.orientation.lock) { try { screen.orientation.lock('landscape'); } catch(e) { console.log('Orientation lock not supported'); } }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      mobileToggleBtn.textContent = '全螢幕';
    }
  });
  
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      mobileToggleBtn.textContent = '全螢幕';
    }
    // Trigger a resize to ensure canvas fits
    window.dispatchEvent(new Event('resize'));
  });
}
