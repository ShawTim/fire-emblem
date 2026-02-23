// mobile.js — Mobile support, touch controls, and fullscreen handling

(function() {
  'use strict';

  // ============================================
  // MOBILE DETECTION
  // ============================================
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|Android/i.test(navigator.userAgent);
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // ============================================
  // FULLSCREEN API
  // ============================================
  const Fullscreen = {
    isFullscreen: false,
    button: null,

    init() {
      this.button = document.getElementById('mobile-toggle');
      if (!this.button) return;

      // Show button on mobile/touch devices
      if (isMobile || isTouchDevice) {
        this.button.style.display = 'block';
      }

      this.button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });

      // Listen for fullscreen changes
      document.addEventListener('fullscreenchange', () => this.onchange());
      document.addEventListener('webkitfullscreenchange', () => this.onchange());
    },

    toggle() {
      const elem = document.documentElement;
      if (!this.isFullscreen) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem.webkitEnterFullscreen) {
          // iOS Safari
          elem.webkitEnterFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    },

    onchange() {
      this.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (this.button) {
        this.button.textContent = this.isFullscreen ? '✕ 退出全螢幕' : '📱 橫向全螢幕';
      }

      // Trigger resize handling
      MobileResize.handleResize();
    },

    // Attempt to lock orientation to landscape on supported browsers
    async lockLandscape() {
      try {
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape');
        }
      } catch (e) {
        // Not supported or permission denied - ignore
      }
    }
  };

  // ============================================
  // MOBILE RESIZE HANDLING
  // ============================================
  const MobileResize = {
    canvas: null,
    container: null,
    baseWidth: 800,
    baseHeight: 600,

    init() {
      this.canvas = document.getElementById('gameCanvas');
      this.container = document.getElementById('game-container');
      if (!this.canvas || !this.container) return;

      // Initial resize
      this.handleResize();

      // Listen for orientation changes and resize
      window.addEventListener('resize', () => this.handleResize());
      window.addEventListener('orientationchange', () => {
        // Small delay to let orientation change complete
        setTimeout(() => this.handleResize(), 100);
      });

      // Visual viewport API for handling browser nav bar
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => this.handleResize());
      }
    },

    handleResize() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Use visual viewport height if available (accounts for browser nav bar)
      const effectiveHeight = window.visualViewport ? window.visualViewport.height : vh;

      // Calculate scale to fit screen while maintaining aspect ratio
      const scaleX = vw / this.baseWidth;
      const scaleY = effectiveHeight / this.baseHeight;
      const scale = Math.min(scaleX, scaleY);

      // Apply scaling
      const displayWidth = Math.floor(this.baseWidth * scale);
      const displayHeight = Math.floor(this.baseHeight * scale);

      // Keep canvas internal resolution fixed
      this.canvas.width = this.baseWidth;
      this.canvas.height = this.baseHeight;

      // Set display size
      this.canvas.style.width = displayWidth + 'px';
      this.canvas.style.height = displayHeight + 'px';

      // Disable image smoothing for pixel art
      const ctx = this.canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      // Container sizing
      this.container.style.width = displayWidth + 'px';
      this.container.style.height = displayHeight + 'px';

      // Center the container
      this.container.style.margin = 'auto';
      this.container.style.position = 'absolute';
      this.container.style.top = '50%';
      this.container.style.left = '50%';
      this.container.style.transform = 'translate(-50%, -50%)';

      // Add mobile-fit class for CSS targeting
      if (vw <= 820 || effectiveHeight <= 600) {
        this.container.classList.add('mobile-fit');
        this.canvas.classList.add('mobile-fit');
        document.body.classList.add('fullscreen-mode');
      } else {
        this.container.classList.remove('mobile-fit');
        this.canvas.classList.remove('mobile-fit');
        document.body.classList.remove('fullscreen-mode');
      }
    }
  };

  // ============================================
  // TOUCH INPUT HANDLING (Drag vs Tap)
  // ============================================
  const TouchHandler = {
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
    isDragging: false,
    hasMoved: false,
    dragThreshold: 10, // pixels
    tapTimeout: 300, // ms
    lastTapTime: 0,
    singleTapTimer: null,

    // Camera drag state
    dragStartCamX: 0,
    dragStartCamY: 0,

    init() {
      const canvas = document.getElementById('gameCanvas');
      if (!canvas) return;

      // Touch events
      canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
      canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
      canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
      canvas.addEventListener('touchcancel', (e) => this.onTouchCancel(e), { passive: false });
    },

    getTouchPos(e) {
      const touch = e.touches[0] || e.changedTouches[0];
      const canvas = document.getElementById('gameCanvas');
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
        clientX: touch.clientX,
        clientY: touch.clientY
      };
    },

    onTouchStart(e) {
      if (e.touches.length > 1) {
        // Multi-touch - ignore for now, could implement pinch zoom
        return;
      }

      const pos = this.getTouchPos(e);
      this.touchStartX = pos.x;
      this.touchStartY = pos.y;
      this.touchStartTime = Date.now();
      this.isDragging = false;
      this.hasMoved = false;

      // Store camera position for potential drag
      if (typeof GameMap !== 'undefined') {
        this.dragStartCamX = GameMap.camX;
        this.dragStartCamY = GameMap.camY;
      }
    },

    onTouchMove(e) {
      if (e.touches.length > 1) return;

      const pos = this.getTouchPos(e);
      const dx = pos.x - this.touchStartX;
      const dy = pos.y - this.touchStartY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > this.dragThreshold) {
        this.isDragging = true;
        this.hasMoved = true;

        // Drag camera
        if (typeof GameMap !== 'undefined') {
          GameMap.camX = this.dragStartCamX - dx;
          GameMap.camY = this.dragStartCamY - dy;
          if (typeof canvas !== 'undefined') {
            GameMap.clampCamera(canvas.width, canvas.height);
          }
        }

        e.preventDefault();
      }
    },

    onTouchEnd(e) {
      const pos = this.getTouchPos(e);
      const dx = pos.x - this.touchStartX;
      const dy = pos.y - this.touchStartY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const elapsed = Date.now() - this.touchStartTime;

      // Determine if this was a tap (not a drag)
      const isTap = !this.isDragging && distance < this.dragThreshold && elapsed < this.tapTimeout;

      if (isTap) {
        // Check for double-tap
        const now = Date.now();
        const isDoubleTap = (now - this.lastTapTime) < 300;
        this.lastTapTime = now;

        if (isDoubleTap) {
          // Cancel single tap timer
          if (this.singleTapTimer) {
            clearTimeout(this.singleTapTimer);
            this.singleTapTimer = null;
          }
          // Double tap = confirm action (could be used for quick confirm)
          this.handleDoubleTap(pos.x, pos.y);
        } else {
          // Single tap with delay to allow double-tap detection
          this.singleTapTimer = setTimeout(() => {
            this.handleTap(pos.x, pos.y);
            this.singleTapTimer = null;
          }, 150);
        }
      } else if (this.hasMoved) {
        // End of drag - no action needed, camera already moved
        e.preventDefault();
      }

      this.isDragging = false;
      this.hasMoved = false;
    },

    onTouchCancel(e) {
      this.isDragging = false;
      this.hasMoved = false;
      if (this.singleTapTimer) {
        clearTimeout(this.singleTapTimer);
        this.singleTapTimer = null;
      }
    },

    handleTap(x, y) {
      // Delegate to game's click handler
      if (typeof game !== 'undefined' && game.handleClick) {
        game.handleClick(x, y);
      }
    },

    handleDoubleTap(x, y) {
      // Double tap could be used for quick confirm in menus
      // For now, treat as regular tap
      this.handleTap(x, y);
    }
  };

  // ============================================
  // ON-SCREEN CONTROLS (Virtual D-Pad + Buttons)
  // ============================================
  const VirtualControls = {
    container: null,
    dpad: null,
    buttons: {},
    visible: false,
    activeDirection: null,

    init() {
      // Only show on touch devices
      if (!isTouchDevice && !isMobile) return;

      this.createControls();
      this.visible = true;
    },

    createControls() {
      // Container
      this.container = document.createElement('div');
      this.container.id = 'virtual-controls';
      this.container.innerHTML = `
        <div id="virtual-dpad">
          <button data-dir="up" class="dpad-btn dpad-up">▲</button>
          <button data-dir="left" class="dpad-btn dpad-left">◀</button>
          <button data-dir="right" class="dpad-btn dpad-right">▶</button>
          <button data-dir="down" class="dpad-btn dpad-down">▼</button>
        </div>
        <div id="virtual-buttons">
          <button id="vbtn-a" class="vbtn">A</button>
          <button id="vbtn-b" class="vbtn">B</button>
          <button id="vbtn-menu" class="vbtn vbtn-small">☰</button>
        </div>
        <div id="virtual-hint">A:確認 B:取消 ☰:選單</div>
      `;

      // Styles
      const style = document.createElement('style');
      style.textContent = `
        #virtual-controls {
          position: fixed;
          bottom: 20px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding: 0 20px;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.85;
        }
        #virtual-controls.hidden { display: none; }
        
        #virtual-dpad {
          display: grid;
          grid-template-columns: repeat(3, 48px);
          grid-template-rows: repeat(3, 48px);
          gap: 4px;
          pointer-events: auto;
        }
        
        .dpad-btn {
          width: 48px;
          height: 48px;
          border: 2px solid rgba(74, 158, 255, 0.6);
          background: rgba(20, 20, 50, 0.8);
          color: #4a9eff;
          font-size: 18px;
          border-radius: 8px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dpad-btn:active, .dpad-btn.pressed {
          background: rgba(74, 158, 255, 0.5);
          color: #fff;
        }
        .dpad-up { grid-column: 2; grid-row: 1; }
        .dpad-left { grid-column: 1; grid-row: 2; }
        .dpad-right { grid-column: 3; grid-row: 2; }
        .dpad-down { grid-column: 2; grid-row: 3; }
        
        #virtual-buttons {
          display: flex;
          gap: 12px;
          align-items: flex-end;
          pointer-events: auto;
        }
        
        .vbtn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid rgba(255, 165, 0, 0.7);
          background: rgba(30, 20, 50, 0.8);
          color: #ffa500;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vbtn:active {
          background: rgba(255, 165, 0, 0.4);
          color: #fff;
        }
        .vbtn-small {
          width: 44px;
          height: 44px;
          font-size: 18px;
        }
        
        #virtual-hint {
          position: fixed;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
          pointer-events: none;
          white-space: nowrap;
        }
        
        @media (min-width: 821px) and (min-height: 601px) {
          #virtual-controls { display: none; }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(this.container);

      // D-Pad event handlers
      const dpadBtns = this.container.querySelectorAll('.dpad-btn');
      dpadBtns.forEach(btn => {
        const dir = btn.dataset.dir;
        
        // Touch start
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          btn.classList.add('pressed');
          this.sendDirection(dir, true);
        }, { passive: false });

        // Touch end
        btn.addEventListener('touchend', (e) => {
          e.preventDefault();
          btn.classList.remove('pressed');
          this.sendDirection(dir, false);
        }, { passive: false });

        // Touch cancel
        btn.addEventListener('touchcancel', () => {
          btn.classList.remove('pressed');
          this.sendDirection(dir, false);
        });
      });

      // Button handlers
      const btnA = document.getElementById('vbtn-a');
      const btnB = document.getElementById('vbtn-b');
      const btnMenu = document.getElementById('vbtn-menu');

      if (btnA) {
        btnA.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.sendKey('Enter');
        }, { passive: false });
      }

      if (btnB) {
        btnB.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.sendKey('Escape');
        }, { passive: false });
      }

      if (btnMenu) {
        btnMenu.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.sendKey('r');
        }, { passive: false });
      }
    },

    sendDirection(dir, isPressed) {
      if (!isPressed) {
        this.activeDirection = null;
        return;
      }

      this.activeDirection = dir;
      
      // Map direction to arrow key
      const keyMap = {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight'
      };

      const key = keyMap[dir];
      if (key && typeof game !== 'undefined' && game.handleKey) {
        game.handleKey(key);
      }
    },

    sendKey(key) {
      if (typeof game !== 'undefined' && game.handleKey) {
        game.handleKey(key);
      }
    },

    show() {
      if (this.container) {
        this.container.classList.remove('hidden');
        this.visible = true;
      }
    },

    hide() {
      if (this.container) {
        this.container.classList.add('hidden');
        this.visible = false;
      }
    }
  };

  // ============================================
  // HIDE BROWSER NAV BAR STRATEGIES
  // ============================================
  const HideNav = {
    init() {
      // Strategy 1: Scroll to hide address bar on page load
      this.scrollToHide();

      // Strategy 2: Fullscreen API (via button)
      Fullscreen.init();

      // Strategy 3: Lock to landscape if supported
      if (isMobile) {
        Fullscreen.lockLandscape();
      }
    },

    scrollToHide() {
      // Scroll down 1px to hide address bar on mobile
      window.scrollTo(0, 1);

      // Also try on orientation change
      window.addEventListener('orientationchange', () => {
        setTimeout(() => window.scrollTo(0, 1), 100);
      });

      // Use visual viewport to handle keyboard/nav bar
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
          document.body.style.height = window.visualViewport.height + 'px';
        });
      }
    }
  };

  // ============================================
  // PREVENT ACCIDENTAL ZOOM/GESTURES
  // ============================================
  const PreventAccidents = {
    init() {
      // Prevent double-tap zoom
      let lastTouchEnd = 0;
      document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }, { passive: false });

      // Prevent pinch zoom
      document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      }, { passive: false });

      // Prevent context menu on long press
      document.addEventListener('contextmenu', (e) => {
        if (isTouchDevice || isMobile) {
          e.preventDefault();
        }
      });
    }
  };

  // ============================================
  // INITIALIZATION
  // ============================================
  function initMobile() {
    // Initialize all mobile components
    MobileResize.init();
    TouchHandler.init();
    VirtualControls.init();
    HideNav.init();
    PreventAccidents.init();

    console.log('[Mobile] Initialized for', isMobile ? 'mobile' : 'desktop', 'device');
  }

  // Wait for DOM and game to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initMobile, 100);
    });
  } else {
    setTimeout(initMobile, 100);
  }

  // Export for potential external use
  window.MobileSupport = {
    Fullscreen,
    MobileResize,
    TouchHandler,
    VirtualControls,
    isMobile,
    isTouchDevice
  };

})();
