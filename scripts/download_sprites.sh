#!/bin/bash
# Fire Emblem Map Sprites Downloader
# Downloads specific GBA/IS style sprites from Klokinator/FE-Repo
# Output: assets/sprites/map/

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_DIR/assets/sprites/map"
BASE_URL="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites"

mkdir -p "$OUTPUT_DIR"

echo "Starting Fire Emblem sprite download..."
echo "Output directory: $OUTPUT_DIR"
echo ""

# Function to download sprite
download() {
    local url="$1"
    local filename="$2"
    local output_path="$OUTPUT_DIR/$filename"
    
    if [ -f "$output_path" ]; then
        echo "✓ Exists: $filename"
        return
    fi
    
    if wget -q "$url" -O "$output_path" 2>/dev/null; then
        echo "✓ Downloaded: $filename"
    else
        echo "✗ Failed: $filename"
        rm -f "$output_path"
    fi
}

# Lords - Female Lords folder
echo "=== Lords ==="
download "$BASE_URL/Female%20Lords/Lord%20(Eirika)%20(F)%20%7BIS%7D-stand.png" "lord_F_stand.png"
download "$BASE_URL/Female%20Lords/Lord%20(Eirika)%20(F)%20%7BIS%7D-walk.png" "lord_F_walk.png"
download "$BASE_URL/Female%20Lords/Master%20Lord%20(Eirika)%20(F)%20%7BIS%7D-stand.png" "masterLord_F_stand.png"
download "$BASE_URL/Female%20Lords/Master%20Lord%20(Eirika)%20(F)%20%7BIS%7D-walk.png" "masterLord_F_walk.png"

# Cavalier - Mounted - Cavs, Paladins, Rangers
echo "=== Cavalier ==="
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Cavalier%20(M)%20Lance%20%7BIS%7D-stand.png" "cavalier_M_stand.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Cavalier%20(M)%20Lance%20%7BIS%7D-walk.png" "cavalier_M_walk.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Cavalier%20(F)%20Sword%20%7BSALVAGED,%20Pikmin%7D-stand.png" "cavalier_F_stand.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Cavalier%20(F)%20Sword%20%7BSALVAGED,%20Pikmin%7D-walk.png" "cavalier_F_walk.png"

# Paladin
echo "=== Paladin ==="
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Paladin%20(M)%20Lance%20%7BIS%7D-stand.png" "paladin_M_stand.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Paladin%20(M)%20Lance%20%7BIS%7D-walk.png" "paladin_M_walk.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Paladin%20(F)%20Lance%20%7BL95%7D-stand.png" "paladin_F_stand.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Paladin%20(F)%20Lance%20%7BL95%7D-walk.png" "paladin_F_walk.png"

# Great Knight
echo "=== Great Knight ==="
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Great%20Knight%20(M)%20Axe%20%7BIS%7D-stand.png" "greatKnight_M_stand.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Great%20Knight%20(M)%20Axe%20%7BIS%7D-walk.png" "greatKnight_M_walk.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Great%20Knight%20(F)%20%7BIS,%20Blood%7D-stand.png" "greatKnight_F_stand.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Great%20Knight%20(F)%20%7BIS,%20Blood%7D-walk.png" "greatKnight_F_walk.png"

# Ranger
echo "=== Ranger ==="
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Ranger%20(M)%20%7BIS%7D-stand.png" "ranger_M_stand.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Ranger%20(M)%20%7BIS%7D-walk.png" "ranger_M_walk.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Ranger%20(F)%20Improved%20Bow%20%7Bflasuban%7D-stand.png" "ranger_F_stand.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Ranger%20(F)%20Improved%20Bow%20%7Bflasuban%7D-walk.png" "ranger_F_walk.png"

# Hero - Infantry - (Swd) Mercenaries and Heroes
echo "=== Hero ==="
download "$BASE_URL/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Hero%20(M)%20%7BIS%7D-stand.png" "hero_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Hero%20(M)%20Sword%20%7BIS%7D-walk.png" "hero_M_walk.png"
download "$BASE_URL/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Hero%20(F)%20%7BIS%7D-stand.png" "hero_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Hero%20(F)%20Sword%20%7BIS%7D-walk.png" "hero_F_walk.png"

# Valkyrie - Mounted - Valks, MKs, Magi
echo "=== Valkyrie ==="
download "$BASE_URL/Mounted%20-%20Valks,%20MKs,%20Magi/Valkyrie%20(F)%20%7BIS%7D-stand.png" "valkyrie_F_stand.png"
download "$BASE_URL/Mounted%20-%20Valks,%20MKs,%20Magi/Valkyrie%20(F)%20%7BIS%7D-walk.png" "valkyrie_F_walk.png"

# Mage Knight
echo "=== Mage Knight ==="
download "$BASE_URL/Mounted%20-%20Valks,%20MKs,%20Magi/Mage%20Knight%20(M)%20%7BIS%7D-stand.png" "mageKnight_M_stand.png"
download "$BASE_URL/Mounted%20-%20Valks,%20MKs,%20Magi/Mage%20Knight%20(M)%20%7BIS%7D-walk.png" "mageKnight_M_walk.png"
download "$BASE_URL/Mounted%20-%20Valks,%20MKs,%20Magi/Mage%20Knight%20(F)%20%7BIS%7D-stand.png" "mageKnight_F_stand.png"
download "$BASE_URL/Mounted%20-%20Valks,%20MKs,%20Magi/Mage%20Knight%20(F)%20%7BIS%7D-walk.png" "mageKnight_F_walk.png"

# Wyvern Rider - Mounted - Pegs, Wyverns, Griffons
echo "=== Wyvern Rider ==="
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Wyvern%20Rider%20(M)%20Lance%20%7Bflasuban%7D-stand.png" "wyvernRider_M_stand.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Wyvern%20Rider%20(M)%20Lance%20%7Bflasuban%7D-walk.png" "wyvernRider_M_walk.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Wyvern%20Rider%20(F)%20Lance%20%7Bflasuban%7D-stand.png" "wyvernRider_F_stand.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Wyvern%20Rider%20(F)%20Lance%20%7Bflasuban%7D-walk.png" "wyvernRider_F_walk.png"

# Wyvern Lord
echo "=== Wyvern Lord ==="
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Wyvern%20Lord%20(U)%20Lance%20%7BIS%7D-walk.png" "wyvernLord_M_stand.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Wyvern%20Lord%20(U)%20Lance%20%7BIS%7D-walk.png" "wyvernLord_M_walk.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Wyvern%20Lord%20(F)%20Lance%20%7BSHYUTER%7D-stand.png" "wyvernLord_F_stand.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Wyvern%20Lord%20(F)%20Lance%20%7BSHYUTER%7D-walk.png" "wyvernLord_F_walk.png"

# Pegasus Knight
echo "=== Pegasus Knight ==="
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Pegasi%20(F)%20T1%20Lance%20%7BIS%7D-stand.png" "pegasusKnight_F_stand.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Pegasi%20(F)%20T1%20Lance%20%7BIS%7D-walk.png" "pegasusKnight_F_walk.png"

# Falcon Knight
echo "=== Falcon Knight ==="
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Pegasi%20(F)%20T2%20Lance%20%7BIS%7D-stand.png" "falconKnight_F_stand.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Pegasi%20(F)%20T2%20Lance%20%7BIS%7D-walk.png" "falconKnight_F_walk.png"

echo ""
echo "========================================="
echo "Download complete!"
echo "Sprites saved to: $OUTPUT_DIR"
echo "========================================="
