#!/usr/bin/env python3
"""
generate_spritesheet_v2.py
使用 Nano Banana Pro 2 (Gemini 3 Pro Image Preview) 生成 16 角色 Spritesheet。
特點：Pixel-perfect, 風格統一，無水印，銳利清晰。
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

# 初始化客戶端 (自動讀取 GEMINI_API_KEY 環境變量)
client = genai.Client()

# === 關鍵：Nano Banana Pro 2 模型名稱 ===
MODEL_NAME = "gemini-3-pro-image-preview"

OUTPUT_FILE = Path("portraits/spritesheet_all_v2.png")
OUTPUT_FILE.parent.mkdir(exist_ok=True)

# 專為 Nano Banana Pro 2 優化嘅 Prompt
# 強調：4x4 網格，風格統一，Pixel Perfect，厚輪廓
PROMPT = """
Fire Emblem GBA style character sprite sheet containing EXACTLY 16 distinct character portraits arranged in a 4x4 grid (4 rows, 4 columns).
IMPORTANT: Generate ONLY these 16 portraits. Do NOT add extra characters, duplicates, or decorative elements. Just the 16 portraits in a clean grid.

STYLE REQUIREMENTS (CRITICAL for Nano Banana Pro 2):
- 16-bit pixel art style, low resolution appearance.
- THICK, BOLD black outlines for all characters (strong silhouette).
- Simple, chunky details. NO fine lines, NO thin details, NO realistic shading.
- Vibrant, flat colors. High contrast.
- White background. Sharp edges.
- Faces should be clear and readable even at small sizes (32x32).
- Consistent art style across all 16 characters.

Characters (Row by Row, Left to Right):
Row 1:
1. Eirine: Young princess, brave and heroic, long pinkish-purple hair, blue eyes, elegant, white/gold dress, star pendant.
2. Marcus: Older knight, short silver-gray hair, beard, blue/silver armor, red scarf, stern.
3. Morgane: Main antagonist, chaotic male boss, deep purple slicked-back hair, glowing menacing purple eyes, pale cold skin, ornate black armor with thorn motifs, dark red cape, evil regal presence.
4. Lina: Archer girl, brown ponytail, green eyes, tanned skin, green sleeveless top, leaf accessory.

Row 2:
5. Thor: Fighter, messy blonde hair, dark tanned skin, muscular, brown vest, bandages, bold.
6. Serra: Cleric girl, long curly blonde hair, purple eyes, white/red nun outfit, headpiece, innocent.
7. Cain: Mercenary, short black hair, red eyes, light blue/gold armor, confident smirk.
8. Fran: Mage boy, short blue hair, round glasses, dark blue star robe, smart.

Row 3:
9. Rex: Wyvern rider, short brown hair, green headband, green eyes, dark gray armor, cold.
10. Natasha: Pegasus knight, long light blue hair, blue eyes, pink/white armor, flower accessory, gentle.
11. Olivier: Thief, short blonde hair, black headband, black tight clothes, cunning eyes.
12. Helga: General, long blonde braid, heavy golden armor, stern, authoritative.

Row 4:
13. Anna: Mysterious merchant girl, vibrant pink hair in twin-tails, green eyes, holding a bag of gold coins, playful greedy expression.
14. Dark Lieutenant: Morgane's ruthless right-hand man, dark hooded cloak, silver mask, cold eyes, silent assassin vibe.
15. Cursed Dragon: Ancient black dragon, glowing red eyes, dark scales, breathing purple smoke, terrifying majestic evil beast.
16. The King: Elderly king, white hair and beard, golden crown, royal purple robes, majestic fatherly.

Layout: 4 rows x 4 columns grid. Equal spacing. No overlapping.
Style: Fire Emblem GBA style, 16-bit pixel art, anime, white background, high contrast, sharp edges.
NO WATERMARK, NO TEXT, NO UI.
"""

def main():
    print(f"🦆 開始使用 Nano Banana Pro 2 ({MODEL_NAME}) 生成 16 角色 Spritesheet...")
    print(f"Prompt: {PROMPT[:100]}...")
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
                    # 找到圖片，直接保存
                    image = part.as_image()
                    image.save(OUTPUT_FILE)
                    print(f"\n✅ 成功！Spritesheet 已保存至：{OUTPUT_FILE}")
                    print("下一步：")
                    print("1. 檢查圖片是否滿意 (16 個角色，風格統一，背景透明)。")
                    print("2. 如果滿意，運行 'python3 scripts/crop_spritesheet.py' 自動切割成 16 張單圖。")
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
