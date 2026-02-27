#!/usr/bin/env python3
"""
crop_spritesheet.py
將生成的 Spritesheet (3x4 網格) 切割成 12 張獨立的 231x240 頭像。
"""

from PIL import Image
import os

INPUT_FILE = "portraits/spritesheet_all_v2.png"
OUTPUT_DIR = "portraits"

# 角色 ID 列表 (必須與生成時的順序一致：由上至下，由左至右)
CHARACTERS = [
    # Row 1
    "eirine", "marcus", "morgane", "lina", "char1", "char2",
    # Row 2
    "thor", "serra", "cain", "fran", "char3", "char4",
    # Row 3
    "rex", "natasha", "olivier", "helga", "char5", "char6",
    # Row 4
    "anna", "lieutenant", "dragon", "king", "char7", "char8"
]

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"錯誤：找不到 {INPUT_FILE}")
        print("請先運行 'python3 scripts/generate_spritesheet.py' 生成 Spritesheet。")
        return

    img = Image.open(INPUT_FILE)
    w, h = img.size
    print(f"Spritesheet 尺寸：{w}x{h}")

    # 計算每個單元格的大小 (4列 x 3行)
    cols = 6
    rows = 4
    cell_w = w / cols
    cell_h = h / rows
    print(f"每個單元格尺寸：{cell_w:.1f}x{cell_h:.1f}")

    # 目標尺寸 (與現有角色頭像一致)
    TARGET_W, TARGET_H = 240, 240

    # 逐個切割並保存
    idx = 0
    for row in range(rows):
        for col in range(cols):
            if idx >= len(CHARACTERS):
                break
                
            left = int(col * cell_w)
            top = int(row * cell_h)
            right = int((col + 1) * cell_w)
            bottom = int((row + 1) * cell_h)
            diff = int(cell_w - cell_h) / 2

            # 裁剪
            cell = img.crop((left + diff, top + 2, right - diff, bottom - 2))
            
            # 縮放並居中到目標尺寸
            scaled = Image.new('RGBA', (TARGET_W, TARGET_H), (0, 0, 0, 0))
            
            # 保持長寬比縮放
            scale = min(TARGET_W / cell.size[0], TARGET_H / cell.size[1])
            new_w = max(1, int(cell.size[0] * scale))
            new_h = max(1, int(cell.size[1] * scale))
            
            resized = cell.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            # 居中
            offset_x = (TARGET_W - new_w) // 2
            offset_y = (TARGET_H - new_h) // 2
            
            scaled.paste(resized, (offset_x, offset_y))
            
            # 保存
            char_id = CHARACTERS[idx]
            output_path = os.path.join(OUTPUT_DIR, f"{char_id}.png")
            scaled.save(output_path)
            print(f"[{idx:02d}] {char_id}: 已保存至 {output_path}")
            
            idx += 1

    print(f"\n完成！共切割 {idx} 張頭像。")
    print("請檢查 portraits/ 目錄下的新圖片。")

if __name__ == "__main__":
    main()
