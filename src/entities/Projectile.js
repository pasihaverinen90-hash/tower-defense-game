class Projectile {
  constructor(scene, data) {
    this.scene        = scene;
    this.type         = data.type;
    this.x            = data.x;
    this.y            = data.y;
    this.target       = data.target;
    this.damage       = data.damage;
    this.speed        = data.speed;
    this.color        = data.color;
    this.splash       = data.splash       || 0;
    this.slow         = data.slow         || 0;
    this.slowDuration = data.slowDuration || 0;
    this.chain        = data.chain        || 0;
    this.active       = true;
  }

  update(delta, enemies) {
    if (!this.active) return;

    // Target died or escaped before we hit it – cancel
    if (!this.target.alive || this.target.reached) {
      this.active = false;
      return;
    }

    const dx   = this.target.x - this.x;
    const dy   = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const move = this.speed * (delta / 1000);

    if (dist <= move + 2) {
      // ─── Hit! ───────────────────────────────────────────────────────────
      this.x = this.target.x;
      this.y = this.target.y;
      this.onHit(enemies);
      this.active = false;
    } else {
      this.x += (dx / dist) * move;
      this.y += (dy / dist) * move;
    }
  }

  onHit(enemies) {
    if (this.splash > 0) {
      // ── Cannon: area of effect ──────────────────────────────────────────
      this.scene.addEffect({ type: 'splash', x: this.x, y: this.y, radius: this.splash, timer: 220 });
      for (const e of enemies) {
        if (!e.alive || e.reached) continue;
        if (Math.hypot(e.x - this.x, e.y - this.y) <= this.splash) {
          e.takeDamage(this.damage);
        }
      }

    } else if (this.chain > 0) {
      // ── Tesla: chain lightning ──────────────────────────────────────────
      const hit = new Set([this.target]);
      this.target.takeDamage(this.damage);
      let last = this.target;

      for (let i = 1; i < this.chain; i++) {
        let nearest = null;
        let nearestDist = TILE_SIZE * 3.5;
        for (const e of enemies) {
          if (!e.alive || e.reached || hit.has(e)) continue;
          const d = Math.hypot(e.x - last.x, e.y - last.y);
          if (d < nearestDist) { nearestDist = d; nearest = e; }
        }
        if (!nearest) break;
        hit.add(nearest);
        nearest.takeDamage(Math.floor(this.damage * 0.75));  // 75% damage per chain
        this.scene.addEffect({ type: 'chain', x1: last.x, y1: last.y, x2: nearest.x, y2: nearest.y, timer: 180 });
        last = nearest;
      }

    } else {
      // ── Single target ───────────────────────────────────────────────────
      this.target.takeDamage(this.damage);
    }

    // Apply slow (Frost tower)
    if (this.slow > 0 && this.target.alive) {
      this.target.applySlowEffect(this.slow, this.slowDuration);
    }
  }

  renderTo(gfx) {
    if (!this.active) return;
    gfx.fillStyle(this.color, 1);
    const r = this.type === 'cannon' ? 7 : this.type === 'frost' ? 5 : 4;
    gfx.fillCircle(this.x, this.y, r);

    if (this.type === 'frost') {
      gfx.fillStyle(0xffffff, 0.5);
      gfx.fillCircle(this.x, this.y, 2);
    }
    if (this.type === 'tesla') {
      gfx.fillStyle(0xffffff, 0.8);
      gfx.fillCircle(this.x, this.y, 2);
    }
  }
}
