#!/usr/bin/env python3
"""
generate_spritesheet.py
使用 Gemini 2.0 Flash 一次性生成所有角色的 Spritesheet (精靈圖)。
確保風格統一，並自動保存為高解析度 PNG。
"""

import os
import subprocess
import sys
from pathlib import Path

# === 配置區域 ===
API_KEY = os.getenv("GEMINI_API_KEY", "")
if not API_KEY:
    print("錯誤：未設置 GEMINI_API_KEY。請 export GEMINI_API_KEY='你的 key'")
    sys.exit(1)

OUTPUT_FILE = Path("portraits/spritesheet_all.png")
OUTPUT_FILE.parent.mkdir(exist_ok=True)

# 統一 Prompt：強調網格排列與風格一致性
# 使用「Character Sheet」或「Sprite Sheet」關鍵字有助於 AI 理解佈局
CHARACTERS_PROMPT = """
Fire Emblem GBA style character sprite sheet containing EXACTLY 16 distinct character portraits arranged in a 4x4 grid (4 rows, 4 columns).
IMPORTANT: Generate ONLY these 16 portraits. Do NOT add extra characters, duplicates, or decorative elements. Just the 16 portraits in a clean grid.
All characters must share the EXACT same art style: 16-bit pixel art, anime style, crisp edges, vibrant colors, white background.
Each portrait is a head-and-shoulders shot, facing forward, consistent size and lighting.

Characters (Row by Row, Left to Right):
Row 1:
1. Eirine: Young princess, long pinkish-purple hair, blue eyes, elegant, white/gold dress, star pendant.
2. Marcus: Older knight, short silver-gray hair, beard, blue/silver armor, red scarf, stern.
3. Morgane: Main antagonist, deep purple slicked-back hair, glowing menacing purple eyes, pale cold skin, wearing ornate black armor with thorn motifs and a dark red cape, expression of cold ambition and hidden evil, regal yet terrifying presence, ultimate boss aura.
4. Lina: Archer girl, brown ponytail, green eyes, tanned skin, green top, leaf accessory.

Row 2:
5. Thor: Fighter, messy blonde hair, dark tanned skin, muscular, brown vest, bandages, bold.
6. Serra: Cleric girl, long curly blonde hair, purple eyes, white/red nun outfit, headpiece, innocent.
7. Cain: Mercenary, short black hair, red eyes, light blue/gold armor, confident smirk.
8. Fran: Mage boy, short blue hair, round glasses, dark blue star robe, smart.

Row 3:
9. Rex: Wyvern rider, short brown hair, green headband, green eyes, dark gray armor, cold.
10. Natasha (納塔莎): Pegasus knight, long light blue hair, blue eyes, pink/white armor, flower accessory, gentle.
11. Olivier (奧利維): Thief, short blonde hair, black headband, black tight clothes, cunning eyes.
12. Helga (赫爾加): General, long blonde braid, heavy golden armor, stern, authoritative.

Row 4:
13. Anna (安娜): Mysterious merchant girl, vibrant pink hair in twin-tails, green eyes, holding a bag of gold coins, playful and greedy expression, iconic FE character.
14. Dark Lieutenant: Morgane's ruthless right-hand man, wearing a dark hooded cloak and silver mask, cold eyes, holding a dark dagger, silent assassin vibe.
15. Cursed Dragon: Ancient black dragon with glowing red eyes, dark scales, breathing purple smoke, terrifying and majestic, ultimate evil beast.
16. The King (國王): Elderly king, white hair and beard, wearing a golden crown and royal purple robes, majestic and fatherly, Eirine's deceased father.

Layout: 4 rows x 4 columns grid (4x4). Equal spacing. No overlapping. NO EXTRA IMAGES.
Style: Fire Emblem GBA style, 16-bit pixel art, anime, white background, high contrast, sharp edges.
"""

def main():
    print("🦆 開始生成統一風格 Spritesheet (3x4 網格，共 12 個角色)...")
    print(f"輸出文件：{OUTPUT_FILE}")
    print("這可能需要 30-60 秒，請耐心等待...")

    # 定位 nano-banana-pro 腳本
    script_path = Path.home() / ".npm-global" / "lib" / "node_modules" / "openclaw" / "skills" / "nano-banana-pro" / "scripts" / "generate_image.py"
    
    if not script_path.exists():
        print(f"錯誤：找不到 nano-banana-pro 腳本於 {script_path}")
        return False

    # 構建命令
    cmd = [
        "uv", "run", str(script_path),
        "--prompt", CHARACTERS_PROMPT,
        "--filename", str(OUTPUT_FILE),
        "--resolution", "2K"  # 2K 解析度 (約 2048x1536 等級別)，確保切割後清晰
    ]
    
    env = os.environ.copy()
    env["GEMINI_API_KEY"] = API_KEY
    
    try:
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=180)
        if result.returncode == 0:
            print(f"\n✅ 成功！Spritesheet 已保存至：{OUTPUT_FILE}")
            print("\n下一步操作建議：")
            print("1. 檢查 portraits/spritesheet_all.png 是否滿意。")
            print("2. 如果滿意，運行 'python3 scripts/crop_spritesheet.py' 自動切割成 12 張單圖。")
            print("3. 如果不滿意，調整此腳本中的 CHARACTERS_PROMPT 後重試。")
            return True
        else:
            print(f"\n❌ 失敗：{result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("\n❌ 超時！生成時間超過 3 分鐘，可能網絡有問題。")
        return False
    except Exception as e:
        print(f"\n❌ 異常：{e}")
        return False

if __name__ == "__main__":
    main()
