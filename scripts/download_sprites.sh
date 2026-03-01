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

# =============================
# LORDS (Male/Female)
# =============================
echo "=== Lords ==="
# Male Lord (Eliwood style)
download "$BASE_URL/Male%20Lords/Lord%20(Eliwood)%20(M)%20%7BIS%7D-stand.png" "lord_M_stand.png"
download "$BASE_URL/Male%20Lords/Lord%20(Eliwood)%20(M)%20%7BIS%7D-walk.png" "lord_M_walk.png"
# Female Lord (Eirika style)
download "$BASE_URL/Female%20Lords/Lord%20(Eirika)%20(F)%20%7BIS%7D-stand.png" "lord_F_stand.png"
download "$BASE_URL/Female%20Lords/Lord%20(Eirika)%20(F)%20%7BIS%7D-walk.png" "lord_F_walk.png"
# Master Lord (promoted)
download "$BASE_URL/Male%20Lords/Master%20Lord%20(Eliwood)%20(M)%20%7BIS%7D-stand.png" "masterLord_M_stand.png"
download "$BASE_URL/Male%20Lords/Master%20Lord%20(Eliwood)%20(M)%20%7BIS%7D-walk.png" "masterLord_M_walk.png"
download "$BASE_URL/Female%20Lords/Master%20Lord%20(Eirika)%20(F)%20%7BIS%7D-stand.png" "masterLord_F_stand.png"
download "$BASE_URL/Female%20Lords/Master%20Lord%20(Eirika)%20(F)%20%7BIS%7D-walk.png" "masterLord_F_walk.png"

# =============================
# CAVALIER / PALADIN / GREAT KNIGHT / RANGER
# =============================
echo "=== Cavalier ==="
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Cavalier%20(M)%20Lance%20%7BIS%7D-stand.png" "cavalier_M_stand.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Cavalier%20(M)%20Lance%20%7BIS%7D-walk.png" "cavalier_M_walk.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Cavalier%20(F)%20Sword%20%7BSALVAGED,%20Pikmin%7D-stand.png" "cavalier_F_stand.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Cavalier%20(F)%20Sword%20%7BSALVAGED,%20Pikmin%7D-walk.png" "cavalier_F_walk.png"

echo "=== Paladin ==="
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Paladin%20(M)%20Lance%20%7BIS%7D-stand.png" "paladin_M_stand.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Paladin%20(M)%20Lance%20%7BIS%7D-walk.png" "paladin_M_walk.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Paladin%20(F)%20Lance%20%7BL95%7D-stand.png" "paladin_F_stand.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Paladin%20(F)%20Lance%20%7BL95%7D-walk.png" "paladin_F_walk.png"

echo "=== Great Knight ==="
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Great%20Knight%20(M)%20Axe%20%7BIS%7D-stand.png" "greatKnight_M_stand.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Great%20Knight%20(M)%20Axe%20%7BIS%7D-walk.png" "greatKnight_M_walk.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Great%20Knight%20(F)%20%7BIS,%20Blood%7D-stand.png" "greatKnight_F_stand.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Great%20Knight%20(F)%20%7BIS,%20Blood%7D-walk.png" "greatKnight_F_walk.png"

echo "=== Ranger ==="
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Ranger%20(M)%20%7BIS%7D-stand.png" "ranger_M_stand.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Ranger%20(M)%20%7BIS%7D-walk.png" "ranger_M_walk.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Ranger%20(F)%20Improved%20Bow%20%7Bflasuban%7D-stand.png" "ranger_F_stand.png"
download "$BASE_URL/Mounted%20-%20Cavs,%20Paladins,%20Rangers/Ranger%20(F)%20Improved%20Bow%20%7Bflasuban%7D-walk.png" "ranger_F_walk.png"

# =============================
# ARCHER / SNIPER
# =============================
echo "=== Archer ==="
download "$BASE_URL/Infantry%20-%20(Bow)%20Archers/Archer%20(M)%20%7BIS%7D-stand.png" "archer_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Bow)%20Archers/Archer%20(M)%20%7BIS%7D-walk.png" "archer_M_walk.png"
download "$BASE_URL/Infantry%20-%20(Bow)%20Archers/Archer%20(F)%20%7BIS%7D-stand.png" "archer_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Bow)%20Archers/Archer%20(F)%20%7BIS%7D-walk.png" "archer_F_walk.png"

echo "=== Sniper ==="
download "$BASE_URL/Infantry%20-%20(Bow)%20Archers/Sniper%20(M)%20%7BIS%7D-stand.png" "sniper_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Bow)%20Archers/Sniper%20(M)%20%7BIS%7D-walk.png" "sniper_M_walk.png"
download "$BASE_URL/Infantry%20-%20(Bow)%20Archers/Sniper%20(F)%20%7BIS%7D-stand.png" "sniper_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Bow)%20Archers/Sniper%20(F)%20%7BIS%7D-walk.png" "sniper_F_walk.png"

# =============================
# FIGHTER / WARRIOR / HERO
# =============================
echo "=== Fighter ==="
download "$BASE_URL/Infantry%20-%20(Axe)%20Fighters/Fighter%20(M)%20%7BIS%7D-stand.png" "fighter_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Axe)%20Fighters/Fighter%20(M)%20%7BIS%7D-walk.png" "fighter_M_walk.png"
download "$BASE_URL/Infantry%20-%20(Axe)%20Fighters/Fighter%20(F)%20%7BSALVAGED%7D-stand.png" "fighter_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Axe)%20Fighters/Fighter%20(F)%20%7BSALVAGED%7D-walk.png" "fighter_F_walk.png"

echo "=== Warrior ==="
download "$BASE_URL/Infantry%20-%20(Axe)%20Fighters/Warrior%20(M)%20%7BIS%7D-stand.png" "warrior_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Axe)%20Fighters/Warrior%20(M)%20%7BIS%7D-walk.png" "warrior_M_walk.png"
download "$BASE_URL/Infantry%20-%20(Axe)%20Fighters/Warrior%20(F)%20%7BIS,%20L95,%20RandomWizard%7D-stand.png" "warrior_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Axe)%20Fighters/Warrior%20(F)%20%7BIS,%20L95,%20RandomWizard%7D-walk.png" "warrior_F_walk.png"

echo "=== Hero ==="
download "$BASE_URL/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Hero%20(M)%20%7BIS%7D-stand.png" "hero_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Hero%20(M)%20Sword%20%7BIS%7D-walk.png" "hero_M_walk.png"
download "$BASE_URL/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Hero%20(F)%20%7BIS%7D-stand.png" "hero_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Hero%20(F)%20Sword%20%7BIS%7D-walk.png" "hero_F_walk.png"

# =============================
# MERCENARY / SWORDMASTER
# =============================
echo "=== Mercenary ==="
download "$BASE_URL/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Mercenary%20(M)%20%7BIS%7D-stand.png" "mercenary_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Mercenary%20(M)%20%7BIS%7D-walk.png" "mercenary_M_walk.png"
download "$BASE_URL/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Mercenary%20(F)%20%7BSALVAGED%7D-stand.png" "mercenary_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Mercenary%20(F)%20%7BSALVAGED%7D-walk.png" "mercenary_F_walk.png"

echo "=== Swordmaster ==="
download "$BASE_URL/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Swordmaster%20(M)%20%7BIS%7D-stand.png" "swordmaster_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Swordmaster%20(M)%20%7BIS%7D-walk.png" "swordmaster_M_walk.png"
download "$BASE_URL/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Swordmaster%20(F)%20%7BIS%7D-stand.png" "swordmaster_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Swordmaster%20(F)%20%7BIS%7D-walk.png" "swordmaster_F_walk.png"

# =============================
# THIEF / ASSASSIN
# =============================
echo "=== Thief ==="
download "$BASE_URL/Infantry%20-%20(Thief,%20Rogue,%20Assassin)/Thief%20(M)%20%7BIS%7D-stand.png" "thief_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Thief,%20Rogue,%20Assassin)/Thief%20(M)%20%7BIS%7D-walk.png" "thief_M_walk.png"
download "$BASE_URL/Infantry%20-%20(Thief,%20Rogue,%20Assassin)/Thief%20(F)%20%7BIS%7D-stand.png" "thief_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Thief,%20Rogue,%20Assassin)/Thief%20(F)%20%7BIS%7D-walk.png" "thief_F_walk.png"

echo "=== Assassin ==="
download "$BASE_URL/Infantry%20-%20(Thief,%20Rogue,%20Assassin)/Assassin%20(M)%20%7BIS%7D-stand.png" "assassin_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Thief,%20Rogue,%20Assassin)/Assassin%20(M)%20%7BIS%7D-walk.png" "assassin_M_walk.png"
download "$BASE_URL/Infantry%20-%20(Thief,%20Rogue,%20Assassin)/Assassin%20(F)%20%7BIS%7D-stand.png" "assassin_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Thief,%20Rogue,%20Assassin)/Assassin%20(F)%20%7BIS%7D-walk.png" "assassin_F_walk.png"

# =============================
# CLERIC / BISHOP / VALKYRIE
# =============================
echo "=== Cleric ==="
download "$BASE_URL/Infantry%20-%20(Staff)%20Clerics,%20Priests,%20Monks/Cleric%20(F)%20%7BIS%7D-stand.png" "cleric_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Staff)%20Clerics,%20Priests,%20Monks/Cleric%20(F)%20%7BIS%7D-walk.png" "cleric_F_walk.png"
download "$BASE_URL/Infantry%20-%20(Staff)%20Clerics,%20Priests,%20Monks/Priest%20(M)%20%7BIS%7D-stand.png" "cleric_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Staff)%20Clerics,%20Priests,%20Monks/Priest%20(M)%20%7BIS%7D-walk.png" "cleric_M_walk.png"

echo "=== Bishop ==="
download "$BASE_URL/Infantry%20-%20(Staff)%20Clerics,%20Priests,%20Monks/Bishop%20(M)%20%7BIS%7D-stand.png" "bishop_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Staff)%20Clerics,%20Priests,%20Monks/Bishop%20(M)%20%7BIS%7D-walk.png" "bishop_M_walk.png"
download "$BASE_URL/Infantry%20-%20(Staff)%20Clerics,%20Priests,%20Monks/Bishop%20(F)%20%7BIS%7D-stand.png" "bishop_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Staff)%20Clerics,%20Priests,%20Monks/Bishop%20(F)%20%7BIS%7D-walk.png" "bishop_F_walk.png"

echo "=== Valkyrie ==="
download "$BASE_URL/Mounted%20-%20Valks,%20MKs,%20Magi/Valkyrie%20(F)%20%7BIS%7D-stand.png" "valkyrie_F_stand.png"
download "$BASE_URL/Mounted%20-%20Valks,%20MKs,%20Magi/Valkyrie%20(F)%20%7BIS%7D-walk.png" "valkyrie_F_walk.png"
download "$BASE_URL/Mounted%20-%20Valks,%20MKs,%20Magi/Valkyrie%20(M)%20%7BSALVAGED%7D-stand.png" "valkyrie_M_stand.png"
download "$BASE_URL/Mounted%20-%20Valks,%20MKs,%20Magi/Valkyrie%20(M)%20%7BSALVAGED%7D-walk.png" "valkyrie_M_walk.png"

# =============================
# MAGE / SAGE / MAGE KNIGHT
# =============================
echo "=== Mage ==="
download "$BASE_URL/Infantry%20-%20(Mag)%20Mages/Mage%20(M)%20%7BIS%7D-stand.png" "mage_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Mag)%20Mages/Mage%20(M)%20%7BIS%7D-walk.png" "mage_M_walk.png"
download "$BASE_URL/Infantry%20-%20(Mag)%20Mages/Mage%20(F)%20%7BIS%7D-stand.png" "mage_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Mag)%20Mages/Mage%20(F)%20%7BIS%7D-walk.png" "mage_F_walk.png"

echo "=== Sage ==="
download "$BASE_URL/Infantry%20-%20(Mag)%20Mages/Sage%20(M)%20%7BIS%7D-stand.png" "sage_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Mag)%20Mages/Sage%20(M)%20%7BIS%7D-walk.png" "sage_M_walk.png"
download "$BASE_URL/Infantry%20-%20(Mag)%20Mages/Sage%20(F)%20%7BIS%7D-stand.png" "sage_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Mag)%20Mages/Sage%20(F)%20%7BIS%7D-walk.png" "sage_F_walk.png"

echo "=== Mage Knight ==="
download "$BASE_URL/Mounted%20-%20Valks,%20MKs,%20Magi/Mage%20Knight%20(M)%20%7BIS%7D-stand.png" "mageKnight_M_stand.png"
download "$BASE_URL/Mounted%20-%20Valks,%20MKs,%20Magi/Mage%20Knight%20(M)%20%7BIS%7D-walk.png" "mageKnight_M_walk.png"
download "$BASE_URL/Mounted%20-%20Valks,%20MKs,%20Magi/Mage%20Knight%20(F)%20%7BIS%7D-stand.png" "mageKnight_F_stand.png"
download "$BASE_URL/Mounted%20-%20Valks,%20MKs,%20Magi/Mage%20Knight%20(F)%20%7BIS%7D-walk.png" "mageKnight_F_walk.png"

# =============================
# WYVERN RIDER / WYVERN LORD
# =============================
echo "=== Wyvern Rider ==="
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Wyvern%20Rider%20(M)%20Lance%20%7Bflasuban%7D-stand.png" "wyvernRider_M_stand.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Wyvern%20Rider%20(M)%20Lance%20%7Bflasuban%7D-walk.png" "wyvernRider_M_walk.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Wyvern%20Rider%20(F)%20Lance%20%7Bflasuban%7D-stand.png" "wyvernRider_F_stand.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Wyvern%20Rider%20(F)%20Lance%20%7Bflasuban%7D-walk.png" "wyvernRider_F_walk.png"

echo "=== Wyvern Lord ==="
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Wyvern%20Lord%20(U)%20Lance%20%7BIS%7D-stand.png" "wyvernLord_M_stand.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Wyvern%20Lord%20(U)%20Lance%20%7BIS%7D-walk.png" "wyvernLord_M_walk.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Wyvern%20Lord%20(F)%20Lance%20%7BSHYUTER%7D-stand.png" "wyvernLord_F_stand.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Wyvern%20Lord%20(F)%20Lance%20%7BSHYUTER%7D-walk.png" "wyvernLord_F_walk.png"

# =============================
# PEGASUS KNIGHT / FALCON KNIGHT
# =============================
echo "=== Pegasus Knight ==="
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Pegasi%20(F)%20T1%20Lance%20%7BIS%7D-stand.png" "pegasusKnight_F_stand.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Pegasi%20(F)%20T1%20Lance%20%7BIS%7D-walk.png" "pegasusKnight_F_walk.png"
# Pegasus Knight is typically female-only in FE

echo "=== Falcon Knight ==="
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Pegasi%20(F)%20T2%20Lance%20%7BIS%7D-stand.png" "falconKnight_F_stand.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Pegasi%20(F)%20T2%20Lance%20%7BIS%7D-walk.png" "falconKnight_F_walk.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Pegasi%20(M)%20T2%20Lance%20%7BSALVAGED%7D-stand.png" "falconKnight_M_stand.png"
download "$BASE_URL/Mounted%20-%20Pegs,%20Wyverns,%20Griffons/Pegasi%20(M)%20T2%20Lance%20%7BSALVAGED%7D-walk.png" "falconKnight_M_walk.png"

# =============================
# KNIGHT / GENERAL
# =============================
echo "=== Knight (Armored) ==="
download "$BASE_URL/Infantry%20-%20(Armored)%20Knights,%20Generals,%20Barons/Knight%20(M)%20Lance%20%7BIS%7D-stand.png" "knight_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Armored)%20Knights,%20Generals,%20Barons/Knight%20(M)%20Lance%20%7BIS%7D-walk.png" "knight_M_walk.png"
download "$BASE_URL/Infantry%20-%20(Armored)%20Knights,%20Generals,%20Barons/Knight%20(F)%20Lance%20%7BL95%7D-stand.png" "knight_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Armored)%20Knights,%20Generals,%20Barons/Knight%20(F)%20Lance%20%7BL95%7D-walk.png" "knight_F_walk.png"

echo "=== General ==="
download "$BASE_URL/Infantry%20-%20(Armored)%20Knights,%20Generals,%20Barons/General%20(M)%20%7BIS%7D-stand.png" "general_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Armored)%20Knights,%20Generals,%20Barons/General%20(M)%20%7BIS%7D-walk.png" "general_M_walk.png"
download "$BASE_URL/Infantry%20-%20(Armored)%20Knights,%20Generals,%20Barons/General%20(F)%20%7BIS%7D-stand.png" "general_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Armored)%20Knights,%20Generals,%20Barons/General%20(F)%20%7BIS%7D-walk.png" "general_F_walk.png"

# =============================
# ENEMY CLASSES
# =============================
echo "=== Soldier ==="
download "$BASE_URL/Infantry%20-%20(Lnc)%20Soldiers/Soldier%20(U)%20%7BIS%7D-stand.png" "soldier_stand.png"
download "$BASE_URL/Infantry%20-%20(Lnc)%20Soldiers/Soldier%20(U)%20%7BIS%7D-walk.png" "soldier_walk.png"

echo "=== Brigand ==="
download "$BASE_URL/Infantry%20-%20(Axe)%20Brigands,%20Pirates,%20Berserkers/Brigand%20(U)%20%7BIS%7D-stand.png" "brigand_stand.png"
download "$BASE_URL/Infantry%20-%20(Axe)%20Brigands,%20Pirates,%20Berserkers/Brigand%20(U)%20%7BIS%7D-walk.png" "brigand_walk.png"

echo "=== Dark Mage ==="
download "$BASE_URL/Infantry%20-%20(Dark)%20Shamans,%20Druids/Dark%20Mage%20(M)%20%7BIS%7D-stand.png" "darkMage_M_stand.png"
download "$BASE_URL/Infantry%20-%20(Dark)%20Shamans,%20Druids/Dark%20Mage%20(M)%20%7BIS%7D-walk.png" "darkMage_M_walk.png"
download "$BASE_URL/Infantry%20-%20(Dark)%20Shamans,%20Druids/Dark%20Mage%20(F)%20%7BSALVAGED%7D-stand.png" "darkMage_F_stand.png"
download "$BASE_URL/Infantry%20-%20(Dark)%20Shamans,%20Druids/Dark%20Mage%20(F)%20%7BSALVAGED%7D-walk.png" "darkMage_F_walk.png"

echo "=== Skeleton ==="
download "$BASE_URL/Monsters%20-%20Basic%20FE8%20Monsters/Skeleton%20(U)%20%7BIS%7D-stand.png" "skeleton_stand.png"
download "$BASE_URL/Monsters%20-%20Basic%20FE8%20Monsters/Skeleton%20(U)%20%7BIS%7D-walk.png" "skeleton_walk.png"

echo ""
echo "========================================="
echo "Download complete!"
echo "Sprites saved to: $OUTPUT_DIR"
echo "========================================="
