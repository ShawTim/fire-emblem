#!/usr/bin/env python3
"""
generate_prologue_bg_v2.py
使用 Nano Banana Pro 2 (Gemini 3 Pro Image Preview) 生成 Fire Emblem GBA 風格嘅序章背景圖。
特點：Pixel-perfect 像素風格，無水印，銳利清晰。
"""

import os
import sys
from pathlib import Path

try:
    from google import genai
    from google.genai import types
    from PIL import Image
except ImportError:
    print("錯誤：未安裝 google-genai 庫。請運行：pip install -U google-genai pillow")
    sys.exit(1)

API_KEY = os.getenv("GEMINI_API_KEY", "")
if not API_KEY:
    print("錯誤：未設置 GEMINI_API_KEY")
    sys.exit(1)

# 初始化客戶端
client = genai.Client()

# === 關鍵：Nano Banana Pro 2 模型名稱 ===
MODEL_NAME = "gemini-3-pro-image-preview"

OUTPUT_FILE = Path("maps/ch0_prologue/prologue_bg_v2.png")
OUTPUT_FILE.parent.mkdir(exist_ok=True, parents=True)

# 專為 Nano Banana Pro 2 優化嘅 Prompt
# 強調：GBA 風格，像素完美，無模糊，低透明度底圖
PROMPT = """
Fire Emblem GBA style background scene, interior of a royal palace hall at night during a siege.
Grand stone pillars on left and right, framing the center.
Large arched window in background showing dark night sky, faint stars, distant orange flames/smoke.
Scattered debris, broken furniture on marble floor.
Lighting: Cool blue moonlight from window, warm orange flickering light from distant fires.
Mood: Urgency, chaos, impending doom, glimmer of hope.
Center area: Slightly darker, less detailed, empty space for text overlay.
Style Constraints (CRITICAL for Nano Banana Pro 2):
- 16-bit pixel art, low resolution aesthetic (simulate 240x160 scaled up).
- Pixel-perfect edges, NO anti-aliasing, NO blur, NO smooth gradients.
- Distinct, chunky pixels. Dithering for shadows.
- Limited color palette (GBA style, 32-64 colors).
- Sharp, crisp lines.
- NO WATERMARK, NO TEXT, NO UI.
- Aspect Ratio: 16:9.
"""

def main():
    print(f"🦆 開始使用 Nano Banana Pro 2 ({MODEL_NAME}) 生成背景圖...")
    print(f"Prompt: {PROMPT[:80]}...")
    print(f"輸出文件：{OUTPUT_FILE}")
    print("這可能需要 30-60 秒，請耐心等待...")
    
    try:
        # 使用正確的 API 調用方式
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[PROMPT],
        )
        
        # 處理回應，尋找圖片數據
        image_found = False
        if response.parts:
            for part in response.parts:
                if part.inline_data is not None:
                    # 找到圖片，保存
                    image = part.as_image()
                    image.save(OUTPUT_FILE)
                    print(f"\n✅ 成功！背景圖已保存至：{OUTPUT_FILE}")
                    print("請檢查圖片，如果滿意，可以 Commit & Push。")
                    image_found = True
                    break
        
        if not image_found:
            print(f"\n❌ 錯誤：回應中未找到圖片數據。回應內容：{response}")
            return False
            
        return True
        
    except Exception as e:
        print(f"\n❌ 異常：{e}")
        if "models/" in str(e) or "not found" in str(e):
            print("提示：模型名稱可能不正確或無權限。請確認 API Key 權限。")
        return False

if __name__ == "__main__":
    main()
