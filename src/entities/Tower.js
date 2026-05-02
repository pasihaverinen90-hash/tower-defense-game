class Tower {
  constructor(scene, tileX, tileY, type) {
    this.scene    = scene;
    this.tileX    = tileX;
    this.tileY    = tileY;
    this.type     = type;
    this.def      = TOWER_DEFS[type];
    this.level    = 0;
    this.selected = false;
    this.lastFireTime   = 0;
    this.totalInvested  = this.def.cost;
    this.targetPriority = 'first';   // 'first' | 'closest' | 'mostHp' | 'leastHp' 

    this.x = tileX * TILE_SIZE + TILE_SIZE / 2;
    this.y = tileY * TILE_SIZE + TILE_SIZE / 2;

    // Sprite or fallback graphics
    const spriteKey = `tower_${type}`;
    this.useSprite  = scene.textures.exists(spriteKey);

    if (this.useSprite) {
      this.sprite = scene.add.image(this.x, this.y, spriteKey);
      this.sprite.setDisplaySize(TILE_SIZE - 2, TILE_SIZE - 2);
      this.sprite.setDepth(4);
    }

    this.overlayGfx = scene.add.graphics().setDepth(6);
    this.rangeGfx   = scene.add.graphics().setDepth(3);

    // Frost-only: persistent animated aura field (drawn every update, below towers)
    if (type === 'frost') {
      this.auraGfx   = scene.add.graphics().setDepth(2);
      this.auraPulse = 0;   // 0–2π drives the sine wave
    }

    if (!this.useSprite) {
      this.bodyGfx = scene.add.graphics().setDepth(4);
    }

    this.applyUpgrade();
    this.render();
  }

  // ─── Stats: base upgrade + permanent buffs ─────────────────────────────────
  applyUpgrade() {
    const upg   = this.def.upgrades[this.level];
    const buffs = this.scene.buffs || { range: 0, speed: 0, damage: 0, crit: 0 };

    this.damage     = Math.ceil(upg.damage * (1 + buffs.damage * BUFF_EFFECTS.damage));
    this.range      = (upg.range + buffs.range * BUFF_EFFECTS.range) * TILE_SIZE;
    this.fireRate   = Math.floor(this.def.fireRate * (1 - buffs.speed * BUFF_EFFECTS.speed));
    this.critChance = buffs.crit * BUFF_EFFECTS.crit;

    this.splashRadius = upg.splash || this.def.splash || 0;
    this.slow         = upg.slow   || this.def.slow   || 0;
    this.slowDuration = this.def.slowDuration || 0;
    this.chain        = upg.chain  || this.def.chain  || 0;
  }

  canUpgrade()     { return this.level < this.def.upgrades.length - 1; }
  getUpgradeCost() { return this.canUpgrade() ? this.def.upgrades[this.level + 1].cost : null; }
  getSellValue()   { return Math.floor(this.totalInvested * 0.6); }

  // ─── Frost aura: called every frame by GameScene ────────────────────────────
  // Applies slow to every enemy within range. No projectile. No cooldown.
  // slowDuration is kept short (500ms) so enemies stop being slowed quickly
  // once they step out of the aura field.
  updateAura(enemies, delta) {
    // Advance the pulse animation
    this.auraPulse = (this.auraPulse + delta * 0.003) % (Math.PI * 2);

    // Slow every enemy in range
    for (const e of enemies) {
      if (!e.alive || e.reached) continue;
      if (Math.hypot(e.x - this.x, e.y - this.y) <= this.range) {
        // Refresh the slow so it stays active while inside the aura
        e.applySlowEffect(this.slow, 500);
      }
    }

    // Draw animated aura
    this._renderAura();
  }

  _renderAura() {
    this.auraGfx.clear();

    const pulse     = Math.sin(this.auraPulse);         // -1 to 1
    const baseAlpha = 0.10 + pulse * 0.06;              // 0.04 – 0.16
    const ringAlpha = 0.30 + pulse * 0.15;              // 0.15 – 0.45
    const outerR    = this.range;
    const innerR    = this.range * (0.72 + pulse * 0.04);

    // Soft filled disc
    this.auraGfx.fillStyle(0x74b9ff, baseAlpha);
    this.auraGfx.fillCircle(this.x, this.y, outerR);

    // Outer pulsing ring
    this.auraGfx.lineStyle(2, 0x0984e3, ringAlpha);
    this.auraGfx.strokeCircle(this.x, this.y, outerR);

    // Inner shimmer ring
    this.auraGfx.lineStyle(1, 0xdfe6e9, ringAlpha * 0.6);
    this.auraGfx.strokeCircle(this.x, this.y, innerR);

    // Tiny sparkle dots rotating around the tower centre
    const dotCount = 6;
    for (let i = 0; i < dotCount; i++) {
      const angle  = this.auraPulse * 0.8 + (i / dotCount) * Math.PI * 2;
      const radius = TILE_SIZE * 0.55;
      const dx     = Math.cos(angle) * radius;
      const dy     = Math.sin(angle) * radius;
      const alpha  = 0.4 + 0.4 * Math.sin(this.auraPulse + i);
      this.auraGfx.fillStyle(0xdfe6e9, Math.max(0, alpha));
      this.auraGfx.fillCircle(this.x + dx, this.y + dy, 2.5);
    }
  }

  // ─── Normal shot towers ─────────────────────────────────────────────────────
  findTarget(enemies) {
    // Filter to only enemies within range
    const inRange = enemies.filter(e =>
      e.alive && !e.reached &&
      Math.hypot(e.x - this.x, e.y - this.y) <= this.range
    );
    if (inRange.length === 0) return null;

    switch (this.targetPriority) {
      case 'first':   // furthest along the path (default)
        return inRange.reduce((best, e) => e.distanceTraveled > best.distanceTraveled ? e : best);
      case 'closest': // nearest to this tower
        return inRange.reduce((best, e) => {
          const d = Math.hypot(e.x - this.x, e.y - this.y);
          const b = Math.hypot(best.x - this.x, best.y - this.y);
          return d < b ? e : best;
        });
      case 'mostHp':  // highest current HP (tanks / brutes)
        return inRange.reduce((best, e) => e.health > best.health ? e : best);
      case 'leastHp': // lowest current HP (finish them off)
        return inRange.reduce((best, e) => e.health < best.health ? e : best);
      default:
        return inRange[0];
    }
  }

  tryFire(enemies, now) {
    if (now - this.lastFireTime < this.fireRate) return null;
    const target = this.findTarget(enemies);
    if (!target) return null;
    this.lastFireTime = now;

    const isCrit = Math.random() < (this.critChance || 0);
    const damage = isCrit ? this.damage * CRIT_MULTIPLIER : this.damage;

    return {
      type: this.type, x: this.x, y: this.y, target,
      damage, isCrit,
      speed:  this.def.projSpeed,
      color:  isCrit ? 0xffffff : this.def.projColor,
      splash: this.splashRadius,
      chain:  this.chain,
    };
  }

  // ─── Render (static visuals — called on place/upgrade/select) ──────────────
  setSelected(sel) {
    this.selected = sel;
    this.render();
  }

  render() {
    this.rangeGfx.clear();
    this.overlayGfx.clear();

    const px = this.x, py = this.y;

    if (!this.useSprite && this.bodyGfx) {
      this.bodyGfx.clear();
      const s = TILE_SIZE * 0.84, h = s / 2;
      this.bodyGfx.fillStyle(0x1e272e, 1);
      this.bodyGfx.fillRect(px - h, py - h, s, s);
      this.bodyGfx.fillStyle(this.def.color, 1);
      const inner = s * 0.62;
      this.bodyGfx.fillRect(px - inner / 2, py - inner / 2, inner, inner);
    }

    // Gold upgrade level dots
    for (let i = 0; i < this.level; i++) {
      this.overlayGfx.fillStyle(0xffd700, 1);
      this.overlayGfx.fillCircle(px - 4 + i * 7, py + TILE_SIZE / 2 - 7, 3);
    }

    // Purple crit dot (top-right corner)
    if (this.critChance > 0) {
      this.overlayGfx.fillStyle(0x9b59b6, 1);
      this.overlayGfx.fillCircle(px + TILE_SIZE / 2 - 6, py - TILE_SIZE / 2 + 6, 4);
    }

    // Frost: always show a faint static ring so you can see coverage without selecting
    if (this.type === 'frost') {
      this.rangeGfx.lineStyle(1, 0x74b9ff, 0.25);
      this.rangeGfx.strokeCircle(px, py, this.range);
    }

    // Selected: show solid range ring
    if (this.selected) {
      this.rangeGfx.fillStyle(0xffffff, 0.06);
      this.rangeGfx.fillCircle(px, py, this.range);
      this.rangeGfx.lineStyle(1.5, 0xffffff, 0.4);
      this.rangeGfx.strokeCircle(px, py, this.range);
    }
  }

  destroy() {
    if (this.sprite)     this.sprite.destroy();
    if (this.bodyGfx)    this.bodyGfx.destroy();
    if (this.overlayGfx) this.overlayGfx.destroy();
    if (this.rangeGfx)   this.rangeGfx.destroy();
    if (this.auraGfx)    this.auraGfx.destroy();
  }
}
