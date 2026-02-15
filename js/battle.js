// battle.js — GBA-style battle animation system

class BattleScene {
  constructor() {
    this.active = false;
    this.phase = 'idle';
    this.timer = 0;
    this.phaseDuration = 0;
    this.attacker = null;
    this.defender = null;
    this.combatSteps = [];
    this.stepIndex = 0;
    this.attackerHP = 0;
    this.defenderHP = 0;
    this.attackerMaxHP = 0;
    this.defenderMaxHP = 0;
    this.attackerTargetHP = 0;
    this.defenderTargetHP = 0;
    this.effects = [];
    this.onComplete = null;
    this.fadeAlpha = 1;
    this.attackerSlide = 0;
    this.defenderSlide = 0;
    this.panelAlpha = 0;
    this.attackerAnimOffset = 0;
    this.defenderAnimOffset = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeTimer = 0;
    this.attackerDead = false;
    this.defenderDead = false;
    this.deathAlpha = 1;
    this.deathFall = 0;
    this.terrainType = 'plain';
    this.forecast = null;
  }

  start(attacker, defender, combatResult, forecast, onComplete) {
    this.active = true;
    this.attacker = attacker;
    this.defender = defender;
    this.combatSteps = combatResult.steps || [];
    this.stepIndex = 0;
    this.forecast = forecast;
    this.onComplete = onComplete;

    // Store HP before combat already happened - reconstruct from steps
    // Combat has already been executed, so we need to reconstruct starting HP
    // Walk backwards through steps to find original HP
    let atkHP = attacker.hp;
    let defHP = defender.hp;
    for (let i = this.combatSteps.length - 1; i >= 0; i--) {
      const step = this.combatSteps[i];
      if (step.hit) {
        if (step.target === attacker) {
          atkHP += step.damage;
          if (step.killed) atkHP = Math.max(atkHP, 1);
        } else if (step.target === defender) {
          defHP += step.damage;
          if (step.killed) defHP = Math.max(defHP, 1);
        }
      }
    }

    this.attackerHP = atkHP;
    this.defenderHP = defHP;
    this.attackerMaxHP = attacker.maxHp;
    this.defenderMaxHP = defender.maxHp;
    this.attackerTargetHP = atkHP;
    this.defenderTargetHP = defHP;

    this.attackerDead = false;
    this.defenderDead = false;
    this.deathAlpha = 1;
    this.deathFall = 0;
    this.effects = [];
    this.fadeAlpha = 1;
    this.attackerSlide = -200;
    this.defenderSlide = 200;
    this.panelAlpha = 0;
    this.attackerAnimOffset = 0;
    this.defenderAnimOffset = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeTimer = 0;

    // Determine terrain
    const defTerrain = GameMap.getTerrain(defender.x, defender.y);
    this.terrainType = defTerrain || 'plain';

    this.setPhase('intro');
  }

  setPhase(phase) {
    this.phase = phase;
    this.timer = 0;
    switch (phase) {
      case 'intro': this.phaseDuration = 300; break;
      case 'ready': this.phaseDuration = 500; break;
      case 'atk1': this.phaseDuration = 700; break;
      case 'def1': this.phaseDuration = 700; break;
      case 'atk2': this.phaseDuration = 700; break;
      case 'def2': this.phaseDuration = 700; break;
      case 'result': this.phaseDuration = 1000; break;
      case 'outro': this.phaseDuration = 400; break;
      default: this.phaseDuration = 0;
    }
  }

  nextPhase() {
    switch (this.phase) {
      case 'intro':
        this.setPhase('ready');
        break;
      case 'ready':
        if (this.stepIndex < this.combatSteps.length) {
          this.beginStrike();
        } else {
          this.setPhase('result');
        }
        break;
      case 'atk1':
      case 'def1':
      case 'atk2':
      case 'def2':
        if (this.stepIndex < this.combatSteps.length) {
          this.beginStrike();
        } else {
          this.setPhase('result');
        }
        break;
      case 'result':
        this.setPhase('outro');
        break;
      case 'outro':
        this.active = false;
        this.phase = 'idle';
        if (this.onComplete) this.onComplete();
        break;
    }
  }

  beginStrike() {
    const step = this.combatSteps[this.stepIndex];
    const isAttackerStriking = step.actor === this.attacker;

    // Determine phase name
    let phaseName;
    if (isAttackerStriking) {
      phaseName = this.stepIndex <= 1 ? 'atk1' : 'atk2';
    } else {
      phaseName = this.stepIndex <= 1 ? 'def1' : 'def2';
    }
    this.setPhase(phaseName);
    this.attackerAnimOffset = 0;
    this.defenderAnimOffset = 0;

    // Apply damage to target HP for animation
    if (step.hit) {
      if (step.target === this.defender) {
        this.defenderTargetHP = Math.max(0, this.defenderTargetHP - step.damage);
      } else {
        this.attackerTargetHP = Math.max(0, this.attackerTargetHP - step.damage);
      }
    }

    this.stepIndex++;
  }

  update(dt) {
    if (!this.active) return;

    this.timer += dt;
    const t = Math.min(1, this.timer / this.phaseDuration);

    // Update shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      this.shakeX = (Math.random() - 0.5) * 8;
      this.shakeY = (Math.random() - 0.5) * 6;
      if (this.shakeTimer <= 0) {
        this.shakeX = 0;
        this.shakeY = 0;
      }
    }

    // Smooth HP animation
    const hpSpeed = dt * 0.08;
    if (this.attackerHP > this.attackerTargetHP) {
      this.attackerHP = Math.max(this.attackerTargetHP, this.attackerHP - hpSpeed * this.attackerMaxHP);
    }
    if (this.defenderHP > this.defenderTargetHP) {
      this.defenderHP = Math.max(this.defenderTargetHP, this.defenderHP - hpSpeed * this.defenderMaxHP);
    }

    // Update effects
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.timer += dt;
      if (e.timer >= e.duration) {
        this.effects.splice(i, 1);
      }
    }

    // Phase-specific updates
    switch (this.phase) {
      case 'intro':
        this.fadeAlpha = 1 - t;
        if (this.timer >= this.phaseDuration) this.nextPhase();
        break;

      case 'ready':
        this.attackerSlide = -200 * (1 - this.easeOut(t));
        this.defenderSlide = 200 * (1 - this.easeOut(t));
        this.panelAlpha = this.easeOut(t);
        if (this.timer >= this.phaseDuration) this.nextPhase();
        break;

      case 'atk1':
      case 'atk2':
      case 'def1':
      case 'def2': {
        const step = this.combatSteps[this.stepIndex - 1];
        if (!step) { this.nextPhase(); break; }
        const isAttackerStriking = step.actor === this.attacker;

        if (t < 0.3) {
          // Dash forward
          const dashT = t / 0.3;
          if (isAttackerStriking) {
            this.attackerAnimOffset = this.easeOut(dashT) * 50;
          } else {
            this.defenderAnimOffset = -this.easeOut(dashT) * 50;
          }
        } else if (t < 0.45) {
          // Impact moment
          if (isAttackerStriking) {
            this.attackerAnimOffset = 50;
          } else {
            this.defenderAnimOffset = -50;
          }

          // Trigger effects once at impact
          if (this.timer - dt < this.phaseDuration * 0.3) {
            this.triggerHitEffects(step, isAttackerStriking);
          }
        } else if (t < 0.7) {
          // Return
          const retT = (t - 0.45) / 0.25;
          if (isAttackerStriking) {
            this.attackerAnimOffset = 50 * (1 - this.easeIn(retT));
          } else {
            this.defenderAnimOffset = -50 * (1 - this.easeIn(retT));
          }
          // Knockback on target
          if (step.hit) {
            const knockT = (t - 0.45) / 0.25;
            if (isAttackerStriking) {
              this.defenderAnimOffset = 15 * Math.sin(knockT * Math.PI);
            } else {
              this.attackerAnimOffset = -15 * Math.sin(knockT * Math.PI);
            }
          }
        } else {
          this.attackerAnimOffset = 0;
          this.defenderAnimOffset = 0;
        }

        if (this.timer >= this.phaseDuration) this.nextPhase();
        break;
      }

      case 'result':
        // Check if someone died
        if (this.defenderTargetHP <= 0 && !this.defenderDead) {
          this.defenderDead = true;
          this.addEffect('text', 0, 0, '撃破！', '#ff4444', 1500);
        }
        if (this.attackerTargetHP <= 0 && !this.attackerDead) {
          this.attackerDead = true;
          this.addEffect('text', 0, 0, '撃破！', '#ff4444', 1500);
        }
        if (this.defenderDead || this.attackerDead) {
          this.deathAlpha = Math.max(0, 1 - t * 1.5);
          this.deathFall = t * 30;
        }
        if (this.timer >= this.phaseDuration) this.nextPhase();
        break;

      case 'outro':
        this.fadeAlpha = t;
        if (this.timer >= this.phaseDuration) this.nextPhase();
        break;
    }
  }

  triggerHitEffects(step, isAttackerStriking) {
    const targetX = isAttackerStriking ? 560 : 240;
    const targetY = 240;

    if (!step.hit) {
      this.addEffect('miss', targetX, targetY, 'MISS', '#999', 800);
      return;
    }

    if (step.crit) {
      this.addEffect('flash', 0, 0, '', '#ffff00', 200);
      this.addEffect('crit_text', 400, 180, '必殺！', '#ffd700', 1000);
      this.addEffect('damage', targetX, targetY - 20, String(step.damage), '#ffd700', 1000);
      this.shakeTimer = 300;
    } else {
      this.addEffect('flash', 0, 0, '', '#ffffff', 120);
      this.addEffect('damage', targetX, targetY - 20, String(step.damage), '#ff3333', 800);
      this.shakeTimer = 150;
    }
  }

  addEffect(type, x, y, text, color, duration) {
    this.effects.push({ type, x, y, text, color, duration, timer: 0 });
  }

  easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  easeIn(t) { return t * t * t; }

  isActive() { return this.active; }

  render(ctx, canvasW, canvasH) {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    // Background
    this.drawBackground(ctx, this.terrainType, canvasW, canvasH);

    // Ground platform
    this.drawPlatform(ctx, canvasW, canvasH);

    // Units
    const groundY = canvasH * 0.62;
    const atkX = 180 + this.attackerSlide + this.attackerAnimOffset;
    const defX = canvasW - 180 + this.defenderSlide + this.defenderAnimOffset;
    const spriteSize = 64;

    // Draw attacker
    if (!this.attackerDead || this.deathAlpha > 0) {
      ctx.save();
      if (this.attackerDead) {
        ctx.globalAlpha = this.deathAlpha;
        ctx.translate(0, this.deathFall);
      }
      this.drawBattleUnit(ctx, this.attacker, atkX - spriteSize / 2, groundY - spriteSize, spriteSize, 'right', this.getCurrentStrikePhase() === 'atk');
      ctx.restore();
    }

    // Draw defender
    if (!this.defenderDead || this.deathAlpha > 0) {
      ctx.save();
      if (this.defenderDead) {
        ctx.globalAlpha = this.deathAlpha;
        ctx.translate(0, this.deathFall);
      }
      this.drawBattleUnit(ctx, this.defender, defX - spriteSize / 2, groundY - spriteSize, spriteSize, 'left', this.getCurrentStrikePhase() === 'def');
      ctx.restore();
    }

    // HP Panels
    if (this.panelAlpha > 0) {
      ctx.globalAlpha = this.panelAlpha;
      this.drawHPPanel(ctx, this.attacker, this.attackerHP, 20, canvasH - 130, false);
      this.drawHPPanel(ctx, this.defender, this.defenderHP, canvasW - 290, canvasH - 130, true);
      ctx.globalAlpha = 1;
    }

    // Weapon triangle indicators
    if (this.panelAlpha > 0 && this.forecast) {
      ctx.globalAlpha = this.panelAlpha;
      this.drawTriangleIndicators(ctx, canvasW, canvasH);
      ctx.globalAlpha = 1;
    }

    // Effects
    this.renderEffects(ctx, canvasW, canvasH);

    // Fade overlay
    if (this.fadeAlpha > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.fadeAlpha})`;
      ctx.fillRect(-10, -10, canvasW + 20, canvasH + 20);
    }

    ctx.restore();
  }

  getCurrentStrikePhase() {
    if (this.phase === 'atk1' || this.phase === 'atk2') return 'atk';
    if (this.phase === 'def1' || this.phase === 'def2') return 'def';
    return 'none';
  }

  drawBackground(ctx, terrainType, w, h) {
    let grad;
    switch (terrainType) {
      case 'forest':
        grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1a3a1a');
        grad.addColorStop(0.4, '#2a5a2a');
        grad.addColorStop(0.7, '#3a6a3a');
        grad.addColorStop(1, '#2a4a2a');
        break;
      case 'mountain':
        grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#4a4a5a');
        grad.addColorStop(0.4, '#6a6a7a');
        grad.addColorStop(0.7, '#8a7a6a');
        grad.addColorStop(1, '#5a4a3a');
        break;
      case 'wall':
      case 'gate':
        grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1a1a3a');
        grad.addColorStop(0.4, '#2a2a5a');
        grad.addColorStop(0.7, '#3a3a6a');
        grad.addColorStop(1, '#2a2a4a');
        break;
      case 'village':
        grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#5a4a3a');
        grad.addColorStop(0.4, '#7a6a5a');
        grad.addColorStop(0.7, '#8a7a6a');
        grad.addColorStop(1, '#6a5a4a');
        break;
      default: // plain
        grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#4a7aaa');
        grad.addColorStop(0.35, '#6a9aca');
        grad.addColorStop(0.65, '#5a8a5a');
        grad.addColorStop(1, '#4a7a4a');
        break;
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative elements based on terrain
    ctx.globalAlpha = 0.3;
    if (terrainType === 'forest') {
      // Trees in background
      for (let i = 0; i < 6; i++) {
        const tx = i * 140 + 30;
        const ty = h * 0.35 + Math.sin(i * 2.3) * 40;
        this.drawBgTree(ctx, tx, ty);
      }
    } else if (terrainType === 'mountain') {
      // Mountains
      ctx.fillStyle = '#8a8a9a';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(150, h * 0.2);
      ctx.lineTo(300, h * 0.45);
      ctx.lineTo(450, h * 0.15);
      ctx.lineTo(600, h * 0.4);
      ctx.lineTo(w, h * 0.25);
      ctx.lineTo(w, h * 0.5);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawBgTree(ctx, x, y) {
    ctx.fillStyle = '#1a4a1a';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 30, y + 50);
    ctx.lineTo(x + 30, y + 50);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x - 25, y + 25);
    ctx.lineTo(x + 25, y + 25);
    ctx.fill();
  }

  drawPlatform(ctx, w, h) {
    const groundY = h * 0.65;
    // Ground line
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, groundY, w, 3);
    // Platform gradient below
    const grad = ctx.createLinearGradient(0, groundY, 0, h);
    grad.addColorStop(0, 'rgba(0,0,0,0.2)');
    grad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, groundY, w, h - groundY);
  }

  drawBattleUnit(ctx, unit, x, y, size, facing, isStriking) {
    const colors = Sprites.getUnitColors(unit.faction);
    const hairColor = unit.portrait ? unit.portrait.hair : colors.accent;
    const eyeColor = unit.portrait ? unit.portrait.eyes : '#222';
    const skinColor = unit.portrait ? (unit.portrait.skin || colors.skin) : colors.skin;
    const s = size;
    const flip = facing === 'left' ? -1 : 1;

    ctx.save();
    ctx.translate(x + s / 2, y + s);
    ctx.scale(flip, 1);

    // Scale factor (64px sprite)
    const sc = s / 16;

    // Legs
    ctx.fillStyle = colors.armor;
    // Left leg
    ctx.fillRect(-3 * sc, -3 * sc, 2.5 * sc, 3 * sc);
    // Right leg
    ctx.fillRect(0.5 * sc, -3 * sc, 2.5 * sc, 3 * sc);
    // Boots
    ctx.fillStyle = '#333';
    ctx.fillRect(-3 * sc, -1 * sc, 2.5 * sc, 1 * sc);
    ctx.fillRect(0.5 * sc, -1 * sc, 2.5 * sc, 1 * sc);

    // Body
    ctx.fillStyle = colors.body;
    ctx.fillRect(-4 * sc, -10 * sc, 8 * sc, 7 * sc);
    // Armor plate
    ctx.fillStyle = colors.armor;
    ctx.fillRect(-3.5 * sc, -9.5 * sc, 7 * sc, 3 * sc);
    // Belt
    ctx.fillStyle = '#654';
    ctx.fillRect(-4 * sc, -4 * sc, 8 * sc, 1 * sc);
    // Accent trim
    ctx.fillStyle = colors.accent;
    ctx.fillRect(-4 * sc, -10 * sc, 8 * sc, 0.5 * sc);

    // Arms
    ctx.fillStyle = colors.body;
    // Back arm
    ctx.fillRect(-5.5 * sc, -9 * sc, 2 * sc, 5 * sc);
    // Front arm (weapon arm)
    if (isStriking) {
      // Arm extended forward
      ctx.fillRect(3 * sc, -10 * sc, 2 * sc, 4 * sc);
      ctx.fillStyle = skinColor;
      ctx.fillRect(3.2 * sc, -10.5 * sc, 1.6 * sc, 1.5 * sc);
    } else {
      ctx.fillRect(3.5 * sc, -9 * sc, 2 * sc, 5 * sc);
      ctx.fillStyle = skinColor;
      ctx.fillRect(3.7 * sc, -4.5 * sc, 1.6 * sc, 1.5 * sc);
    }

    // Neck
    ctx.fillStyle = skinColor;
    ctx.fillRect(-1 * sc, -11 * sc, 2 * sc, 1.5 * sc);

    // Head
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3 * sc, -15.5 * sc, 6 * sc, 5 * sc);

    // Hair
    ctx.fillStyle = hairColor;
    // Top
    ctx.fillRect(-3.5 * sc, -16.5 * sc, 7 * sc, 3 * sc);
    // Sides
    ctx.fillRect(-3.5 * sc, -15 * sc, 1.5 * sc, 4 * sc);
    ctx.fillRect(2 * sc, -15 * sc, 1.5 * sc, 3 * sc);
    // Back hair
    ctx.fillRect(-4 * sc, -14 * sc, 1 * sc, 5 * sc);

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(-1.5 * sc, -14 * sc, 1.8 * sc, 1.2 * sc);
    ctx.fillRect(0.5 * sc, -14 * sc, 1.8 * sc, 1.2 * sc);
    ctx.fillStyle = eyeColor;
    ctx.fillRect(-0.8 * sc, -13.8 * sc, 1 * sc, 1 * sc);
    ctx.fillRect(1.2 * sc, -13.8 * sc, 1 * sc, 1 * sc);
    // Pupils
    ctx.fillStyle = '#111';
    ctx.fillRect(-0.5 * sc, -13.6 * sc, 0.5 * sc, 0.6 * sc);
    ctx.fillRect(1.5 * sc, -13.6 * sc, 0.5 * sc, 0.6 * sc);

    // Nose
    ctx.fillStyle = '#da9';
    ctx.fillRect(0.5 * sc, -13 * sc, 0.8 * sc, 1 * sc);

    // Mouth
    ctx.fillStyle = '#c88';
    ctx.fillRect(-0.5 * sc, -11.5 * sc, 2 * sc, 0.5 * sc);

    // Weapon
    this.drawBattleWeapon(ctx, unit, sc, isStriking);

    // Boss crown
    if (unit.isBoss) {
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-2.5 * sc, -17.5 * sc, 5 * sc, 1.5 * sc);
      ctx.fillRect(-2.5 * sc, -18.5 * sc, 1 * sc, 1 * sc);
      ctx.fillRect(-0.5 * sc, -19 * sc, 1 * sc, 1.5 * sc);
      ctx.fillRect(1.5 * sc, -18.5 * sc, 1 * sc, 1 * sc);
    }

    // Mount
    const cls = getClassData(unit.classId);
    const tags = cls.tags || [];
    if (tags.includes('mounted') || tags.includes('flying')) {
      ctx.fillStyle = tags.includes('flying') ? '#8888cc' : '#aa8866';
      ctx.fillRect(-5 * sc, -2 * sc, 10 * sc, 3 * sc);
      ctx.fillRect(-6 * sc, -1 * sc, 2 * sc, 2 * sc);
      ctx.fillRect(4 * sc, -1 * sc, 2 * sc, 2 * sc);
      // Head of mount
      ctx.fillRect(5 * sc, -4 * sc, 3 * sc, 3 * sc);
      if (tags.includes('flying')) {
        // Wings
        ctx.fillStyle = 'rgba(150,150,220,0.7)';
        ctx.beginPath();
        ctx.moveTo(-2 * sc, -3 * sc);
        ctx.lineTo(-8 * sc, -10 * sc);
        ctx.lineTo(-6 * sc, -2 * sc);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  drawBattleWeapon(ctx, unit, sc, isStriking) {
    const cls = getClassData(unit.classId);
    const weps = cls.weapons || [];
    const wpn = unit.getEquippedWeapon();

    if (weps.includes('sword') || (wpn && wpn.type === 'sword')) {
      // Sword
      if (isStriking) {
        ctx.fillStyle = '#ddd';
        ctx.fillRect(4 * sc, -14 * sc, 1 * sc, 8 * sc);
        ctx.fillStyle = '#eee';
        ctx.fillRect(4.2 * sc, -14 * sc, 0.6 * sc, 6 * sc);
        ctx.fillStyle = '#aa8833';
        ctx.fillRect(3.5 * sc, -6.5 * sc, 2 * sc, 1 * sc);
      } else {
        ctx.fillStyle = '#ddd';
        ctx.fillRect(4.5 * sc, -9 * sc, 1 * sc, 8 * sc);
        ctx.fillStyle = '#aa8833';
        ctx.fillRect(4 * sc, -9 * sc, 2 * sc, 1 * sc);
      }
    } else if (weps.includes('lance') || (wpn && wpn.type === 'lance')) {
      // Lance
      ctx.fillStyle = '#aa8866';
      if (isStriking) {
        ctx.fillRect(3 * sc, -14 * sc, 0.8 * sc, 12 * sc);
        ctx.fillStyle = '#ccc';
        ctx.fillRect(2.6 * sc, -15.5 * sc, 1.6 * sc, 2.5 * sc);
      } else {
        ctx.fillRect(5 * sc, -12 * sc, 0.8 * sc, 14 * sc);
        ctx.fillStyle = '#ccc';
        ctx.fillRect(4.6 * sc, -13.5 * sc, 1.6 * sc, 2.5 * sc);
      }
    } else if (weps.includes('axe') || (wpn && wpn.type === 'axe')) {
      // Axe
      ctx.fillStyle = '#886644';
      if