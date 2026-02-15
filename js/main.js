// main.js — Game initialization and main loop

const canvas = document.getElementById('gameCanvas');
canvas.width = 800;
canvas.height = 600;
const ctx = canvas.getContext('2d');

const game = new Game(canvas);
game.init();

function gameLoop(timestamp) {
  game.update(timestamp);
  game.render(ctx);
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// Mouse input
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const sx = (e.clientX - rect.left) * scaleX;
  const sy = (e.clientY - rect.top) * scaleY;
  game.handleClick(sx, sy);
});

// Keyboard input
document.addEventListener('keydown', (e) => {
  game.handleKey(e.key);
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
    e.preventDefault();
  }
});

// UI buttons
document.getElementById('btn-end-turn').addEventListener('click', () => game.endTurn());
document.getElementById('btn-new-game').addEventListener('click', () => game.startNewGame());
document.getElementById('btn-continue').addEventListener('click', () => game.continueGame());
