class Tower {
  constructor(scene, tileX, tileY, type) {
    this.scene    = scene;
    this.tileX    = tileX;
    this.tileY    = tileY;
    this.type     = type;
    this.def      = TOWER_DEFS[type];
    this.level    = 0;
    this.selected = false;
    this.lastFireTime  = 0;
    this.totalInvested = this.def.cost;

    this.x = tileX * TILE_SIZE + TILE_SIZE / 2;
    this.y = tileY * TILE_SIZE + TILE_SIZE / 2;

    // Sprite or graphics fallback
    const spriteKey = `tower_${type}`;
    this.useSprite  = scene.textures.exists(spriteKey);

    if (this.useSprite) {
      this.sprite = scene.add.image(this.x, this.y, spriteKey);
      this.sprite.setDisplaySize(TILE_SIZE - 2, TILE_SIZE - 2);
      this.sprite.setDepth(4);
    }

    // Graphics for range ring + level dots (always needed)
    this.overlayGfx = scene.add.graphics().setDepth(6);
    this.rangeGfx   = scene.add.graphics().setDepth(3);

    // Fallback body gfx (used when no sprite)
    if (!this.useSprite) {
      this.bodyGfx = scene.add.graphics().setDepth(4);
    }

    this.applyUpgrade();
    this.render();
  }

  applyUpgrade() {
    const upg         = this.def.upgrades[this.level];
    this.damage       = upg.damage;
    this.range        = upg.range * TILE_SIZE;
    this.splashRadius = upg.splash || this.def.splash || 0;
    this.slow         = upg.slow   || this.def.slow   || 0;
    this.slowDuration = this.def.slowDuration || 0;
    this.chain        = upg.chain  || this.def.chain  || 0;
  }

  canUpgrade()     { return this.level < this.def.upgrades.length - 1; }
  getUpgradeCost() { return this.canUpgrade() ? this.def.upgrades[this.level + 1].cost : null; }
  getSellValue()   { return Math.floor(this.totalInvested * 0.6); }

  upgrade() {
    if (!this.canUpgrade()) return false;
    this.level++;
    this.totalInvested += this.def.upgrades[this.level].cost;
    this.applyUpgrade();
    this.render();
    return true;
  }

  findTarget(enemies) {
    let target = null, maxTraveled = -1;
    for (const e of enemies) {
      if (!e.alive || e.reached) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d <= this.range && e.distanceTraveled > maxTraveled) {
        maxTraveled = e.distanceTraveled;
        target = e;
      }
    }
    return target;
  }

  tryFire(enemies, now) {
    if (now - this.lastFireTime < this.def.fireRate) return null;
    const target = this.findTarget(enemies);
    if (!target) return null;
    this.lastFireTime = now;
    return {
      type: this.type, x: this.x, y: this.y, target,
      damage: this.damage, speed: this.def.projSpeed, color: this.def.projColor,
      splash: this.splashRadius, slow: this.slow,
      slowDuration: this.slowDuration, chain: this.chain,
    };
  }

  setSelected(sel) {
    this.selected = sel;
    this.render();
  }

  render() {
    this.rangeGfx.clear();
    this.overlayGfx.clear();

    const px = this.x;
    const py = this.y;

    // ── Fallback body (no sprite) ──────────────────────────────────────────
    if (!this.useSprite && this.bodyGfx) {
      this.bodyGfx.clear();
      const s = TILE_SIZE * 0.84, h = s / 2;
      this.bodyGfx.fillStyle(0x1e272e, 1);
      this.bodyGfx.fillRect(px - h, py - h, s, s);
      this.bodyGfx.fillStyle(this.def.color, 1);
      const inner = s * 0.62;
      this.bodyGfx.fillRect(px - inner/2, py - inner/2, inner, inner);
      this.bodyGfx.fillStyle(0xffffff, 0.15);
      this.bodyGfx.fillRect(px - inner/2, py - inner/2, inner, inner * 0.35);
    }

    // ── Level dots (gold dots at bottom of tile) ───────────────────────────
    for (let i = 0; i < this.level; i++) {
      this.overlayGfx.fillStyle(0xffd700, 1);
      this.overlayGfx.fillCircle(px - 4 + i * 7, py + TILE_SIZE / 2 - 7, 3);
    }

    // ── Range ring when selected ───────────────────────────────────────────
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
  }
}
