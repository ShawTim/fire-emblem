# Fire Emblem 遊戲開發進度總結

## 已完成功能

### 1. 性別系統 (Gender System)
- 單位有 `gender` 屬性 ('m'/'f')，預設 'm'
- Sprites 分男女：stand_m, stand_f, walk_m, walk_f
- 自動 fallback：男冇 sprite 就用女，反之亦然

### 2. Walk Sprite Animation
**Frame Layout (15 frames in single column):**
- 0-3: Left
- 4-7: Down  
- 8-11: Up
- 12-14: Selected (無方向，玩家揀中時用)

**邏輯優先級：**
1. 移動中 (vx/vy) → 方向 walk sprite
2. 有方向 (_direction) → 方向 walk sprite
3. 被選中 (_selected) 兼靜止 → selected frames (12-14)
4. 否則 → stand sprite

**方向處理：**
- Right 用 Left sprite + flipX (canvas scale -1,1)
- 移動完成後 retain _direction，confirm action 後先清

### 3. 移動動畫
- `animateMove()` 用 `setTimeout`，speed 同 unit.spd 掛鉤
- 每步設定 `_direction`，移動後 retain 方向
- Cancel/confirm/wait/item/attack 會清 _direction

### 4. 陣營顏色 (Faction Tinting)
- Player: 原色 (藍)
- Enemy: `hue-rotate(140deg) saturate(1.3) brightness(1.1)` → 紅
- Ally: `hue-rotate(60deg) saturate(1.2)` → 綠

### 5. Sprites Preloading
- 開頭顯示 loading screen
- Preload 晒所有 CLASSES 入面嘅 sprites
- 有進度條顯示

### 6. UI 改動
- 地圖選單加咗「結束回合」
- 地圖選單 emoji 用固定 width container 對齊
- Classes/Characters page header 統一風格
- Menu positioning 加咗 mobile buffer (60px)

## 待跟進問題

### 1. Desktop Fullscreen (擱置)
- 用戶想要：遊戲畫面置中，保持 4:3 aspect ratio，放大 fit screen，黑邊填充
- 之前嘗試：CSS `object-fit: contain` 同 calc() 尺寸，但搞到 mobile click 錯位
- 狀態：已還原到 mobile-only fullscreen，desktop 暫時冇 fullscreen 功能

### 2. Walk Sprite 微調
- 用戶話會自己睇/改
- 可能係 direction 同 selected state 優先級問題

### 3. Animation Speed
- 而家用 `Math.floor(this._frameCounter / animSpeed)`
- `animSpeed = Math.max(4, Math.min(16, 8 + (spd - 10) / 2))`
- 可能要微調同移動 speed 更 sync

## 核心代碼位置

### sprites.js
- `drawUnit()` - 主要渲染邏輯
- `_frameCounter` - 全局 animation tick
- `_imgCache` - sprite 緩存

### game.js
- `animateMove()` - 移動動畫
- `onMapClick()` - 設定 `_selected`
- `cancelSelection()` - 清 `_selected` 同 `_direction`

### classes.js
- 每個 class 有 `sprites` field：stand_m, stand_f, walk_m, walk_f

## 建議 Model

**推薦：Kimi K2.5 或 Gemini 2.5 Pro**

原因：
1. 長 context - 可以讀晒呢個 summary + 代碼
2. 繼續跟進 - 記得之前嘅工作
3. 編程能力 - 夠細心處理 sprite/animation 邏輯

**避免：GLM5** - 雖然中文好，但冇咁細心，易搞爛嘢

## 注意事頂
- 改 sprite 相關嘢時要 test mobile 同 desktop
- Fullscreen 好 tricky，改之前要 backup
- Walk sprite direction 邏輯複雜，改之前要睇清楚順序