#!/usr/bin/env python3
"""
generate_prologue_bg.py
使用 Nano Banana Pro (Gemini 2.0 Flash) 生成 Fire Emblem GBA 風格嘅序章背景圖。
特點：低解析度像素風格，無水印 (由 API 直接生成)。
"""

import os
import subprocess
import sys
from pathlib import Path

API_KEY = os.getenv("GEMINI_API_KEY", "")
if not API_KEY:
    print("錯誤：未設置 GEMINI_API_KEY")
    sys.exit(1)

OUTPUT_FILE = Path("maps/ch0_prologue/prologue_bg.png")
OUTPUT_FILE.parent.mkdir(exist_ok=True, parents=True)

PROMPT = """
Fire Emblem GBA style background scene, interior of a royal palace hall at night during a siege.
Grand stone pillars on sides, large arched window showing dark night sky with faint stars and distant orange flames/smoke.
Scattered debris, broken furniture on marble floor.
Dim lighting, cool blue moonlight from window, warm orange flickering light from distant fires.
Sense of urgency, chaos, impending doom, glimmer of hope in stars.
Style: 16-bit pixel art, low resolution, distinct chunky pixels, NO anti-aliasing, NO blur, NO smooth gradients.
Limited color palette (32-64 colors), sharp edges, dithering for shadows.
Center area slightly darker or less detailed for text overlay readability.
Aspect ratio 16:9.
NO WATERMARK, NO TEXT, NO UI.
"""

def main():
    print(f"🦆 開始生成序章背景圖 (GBA 風格)...")
    print(f"輸出文件：{OUTPUT_FILE}")
    
    script_path = Path.home() / ".npm-global" / "lib" / "node_modules" / "openclaw" / "skills" / "nano-banana-pro" / "scripts" / "generate_image.py"
    
    if not script_path.exists():
        print(f"錯誤：找不到 nano-banana-pro 腳本於 {script_path}")
        return False

    cmd = [
        "uv", "run", str(script_path),
        "--prompt", PROMPT,
        "--filename", str(OUTPUT_FILE),
        "--resolution", "1K"  # 1K 足夠，GBA 風格唔需要太高
    ]
    
    env = os.environ.copy()
    env["GEMINI_API_KEY"] = API_KEY
    
    try:
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=120)
        if result.returncode == 0:
            print(f"\n✅ 成功！背景圖已保存至：{OUTPUT_FILE}")
            print("請檢查圖片，如果滿意，可以 Commit & Push。")
            return True
        else:
            print(f"\n❌ 失敗：{result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("\n❌ 超時！生成時間超過 2 分鐘。")
        return False
    except Exception as e:
        print(f"\n❌ 異常：{e}")
        return False

if __name__ == "__main__":
    main()
