#!/bin/bash
DIR="assets/sprites/map"
mkdir -p "$DIR"

declare -A urls
urls=(
  ["mercenary_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Mercenary%20(M)%20%7BIS%7D-stand.png"
  ["mercenary_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Mercenary%20(M)%20%7BIS%7D-walk.png"
  ["hero_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Hero%20(M)%20%7BIS%7D-stand.png"
  ["hero_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Swd)%20Mercenaries%20and%20Heroes/Hero%20(M)%20Sword%20%7BIS%7D-walk.png"
  ["archer_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Bow)%20Archers%20and%20Hunters/Archer%20(M)%20%7BIS%7D-stand.png"
  ["archer_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Bow)%20Archers%20and%20Hunters/Archer%20(M)%20%7BIS%7D-walk.png"
  ["sniper_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Bow)%20Snipers%20and%20Ballistae/Sniper%20(M)%20%7BIS%7D-stand.png"
  ["sniper_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Bow)%20Snipers%20and%20Ballistae/Sniper%20(M)%20%7BIS%7D-walk.png"
  ["mage_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Magi%20-%20Nature-Type/Mage%20(M)%20%7BIS%7D-stand.png"
  ["mage_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Magi%20-%20Nature-Type/Mage%20(M)%20%7BIS%7D-walk.png"
  ["sage_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Magi%20-%20Nature-Type/Sage%20(M)%20%7BIS%7D-stand.png"
  ["sage_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Magi%20-%20Nature-Type/Sage%20(M)%20%7BIS%7D-walk.png"
  ["cleric_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Magi%20-%20Holy-Type/Cleric%20(F)%20Generic%20%7BIS%7D-stand.png"
  ["cleric_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Magi%20-%20Holy-Type/Cleric%20(F)%20Generic%20%7BIS%7D-walk.png"
  ["bishop_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Magi%20-%20Holy-Type/Bishop%20(M)%20%7BIS%7D-stand.png"
  ["bishop_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Magi%20-%20Holy-Type/Bishop%20(M)%20%7BIS%7D-walk.png"
  ["thief_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Swd)%20Thieves,%20Rogues,%20Assassins/Thief%20(M)%20%7BIS%7D-stand.png"
  ["thief_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Swd)%20Thieves,%20Rogues,%20Assassins/Thief%20(M)%20%7BIS%7D-walk.png"
  ["assassin_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Swd)%20Thieves,%20Rogues,%20Assassins/Assassin%20(M)%20%7BIS%7D-stand.png"
  ["assassin_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Swd)%20Thieves,%20Rogues,%20Assassins/Assassin%20(M)%20%7BIS%7D-walk.png"
  ["swordmaster_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Swd)%20Myrms%20and%20Swordmasters/Swordmaster%20(M)%20%7BIS%7D-stand.png"
  ["swordmaster_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Swd)%20Myrms%20and%20Swordmasters/Swordmaster%20(M)%20%7BIS%7D-walk.png"
  ["knight_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20Knights,%20Generals,%20Armors/Knight%20(U)%20Lance%20%7BIS%7D-stand.png"
  ["knight_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20Knights,%20Generals,%20Armors/Knight%20(U)%20Lance%20%7BIS%7D-walk.png"
  ["general_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20Knights,%20Generals,%20Armors/General%20(U)%20Lance%20%7BIS%7D-stand.png"
  ["general_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20Knights,%20Generals,%20Armors/General%20(U)%20Lance%20%7BIS%7D-walk.png"
  ["soldier_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Lnc)%20Soldiers,%20Halberdiers/Soldier%20(M)%20Lance%20%7BIS%7D-stand.png"
  ["soldier_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Lnc)%20Soldiers,%20Halberdiers/Soldier%20(M)%20Lance%20%7BIS%7D-walk.png"
  ["darkmage_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Magi%20-%20Dark-Type/Shaman%20(M)%20%7BIS%7D-stand.png"
  ["darkmage_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Magi%20-%20Dark-Type/Shaman%20(M)%20%7BIS%7D-walk.png"
  ["brigand_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Axe)%20Brigs,%20Pirates,%20Zerkers/Brigand%20(M)%20Axe%20%7BIS%7D-stand.png"
  ["brigand_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Infantry%20-%20(Axe)%20Brigs,%20Pirates,%20Zerkers/Brigand%20(M)%20Axe%20%7BIS%7D-walk.png"
  ["skeleton_stand.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Monsters%20-%20Basic%20Types/Bonewalker%20(U)%20Sword%20%7BIS%7D-stand.png"
  ["skeleton_move.png"]="https://raw.githubusercontent.com/Klokinator/FE-Repo/main/Map%20Sprites/Monsters%20-%20Basic%20Types/Bonewalker%20(U)%20Sword%20%7BIS%7D-walk.png"
)

for file in "${!urls[@]}"; do
  echo "Downloading $file..."
  wget -q "${urls[$file]}" -O "$DIR/$file"
done

echo "Done downloading. Now removing backgrounds..."
./scripts/remove_bg.sh "$DIR"
