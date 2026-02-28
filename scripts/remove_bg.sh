#!/bin/bash
# 用法: ./scripts/remove_bg.sh [路徑]
# 預設路徑為 assets/sprites/map

DIR=${1:-"assets/sprites/map"}
BG_COLOR="#80a080"

echo "正在掃描 $DIR 裡的 PNG，並將背景顏色 $BG_COLOR 去背..."

for img in "$DIR"/*.png; do
    if [ -f "$img" ]; then
        # 增加一點點 fuzz (容差) 防止壓縮瑕疵，但保持 0% 就是絕對匹配
        convert "$img" -transparent "$BG_COLOR" "$img"
        echo "✅ 已處理: $img"
    fi
done

echo "🎉 全部去背完成！"
