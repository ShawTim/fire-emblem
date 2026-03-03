// game/prologue.js — Prologue display system

var PrologueDisplay = {
  /**
   * Show prologue with scrolling text
   * @param {Object} prologueData - Prologue configuration
   * @returns {Promise}
   */
  show: function(prologueData) {
    return new Promise((resolve) => {
      const root = document.createElement("div");
      root.id = "prologue-root";
      root.style.cssText = "position:absolute;top:0;left:0;right:0;bottom:0;z-index:300;overflow:hidden;";

      // 1. 背景層 (可選) - 調低透明度 (0.5) 令佢變暗，唔搶文字風頭
      if (prologueData.background) {
        const bg = document.createElement("div");
        bg.style.cssText = "position:absolute;top:0;left:0;right:0;bottom:0;background-image:url('" + prologueData.background + "');background-size:cover;background-position:center;opacity:0.5;z-index:1;";
        root.appendChild(bg);
      }

      // 2. 文字層 — 不設 bottom，讓高度由內容決定
      const lines = prologueData.lines || [];
      const scrollDuration = Math.max(10, lines.length * 3);
      const totalDuration = prologueData.duration || scrollDuration + 2;

      const textContainer = document.createElement("div");
      textContainer.style.cssText = "position:absolute;top:0;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:24px;padding:40px 60px;z-index:10;transform:translateY(600px);transition:transform " + scrollDuration + "s linear;";
      root.appendChild(textContainer);

      // 3. 遮罩層 (z-index: 20)：中間透明，向外漸變至背景黑色
      const mask = document.createElement("div");
      mask.style.cssText = "position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.92) 70%);z-index:20;pointer-events:none;";
      root.appendChild(mask);

      document.getElementById("ui-overlay").appendChild(root);

      // 生成文字
      lines.forEach((lineData) => {
        const lineEl = document.createElement("div");
        lineEl.textContent = typeof lineData === 'string' ? lineData : lineData.text;
        lineEl.style.cssText = "color:#fff;font-size:20px;font-weight:bold;text-align:center;max-width:700px;text-shadow:2px 2px 4px #000;white-space:pre-wrap;line-height:1.6;";
        textContainer.appendChild(lineEl);
      });

      // 啟動動畫
      setTimeout(() => {
        textContainer.style.transform = "translateY(calc(-100% - 600px))";
      }, 50);

      // 共用結束函數
      let finished = false;
      const finish = () => {
        if (finished || !root.parentNode) return;
        finished = true;
        clearTimeout(autoTimer);
        root.style.transition = "opacity 0.5s";
        root.style.opacity = "0";
        setTimeout(() => {
          root.remove();
          resolve();
        }, 500);
      };

      // Event 1: 自動結束
      const autoTimer = setTimeout(finish, totalDuration * 1000);

      // Event 2: 用戶點擊跳過
      root.addEventListener("click", () => {
        root.remove();
        clearTimeout(autoTimer);
        resolve();
      });
    });
  }
};
