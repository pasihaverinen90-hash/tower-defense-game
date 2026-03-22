class Projectile {
  constructor(scene, shot) {
    this.scene        = scene;
    this.type         = shot.type;
    this.x            = shot.x;
    this.y            = shot.y;
    this.target       = shot.target;
    this.damage       = shot.damage;
    this.speed        = shot.speed;
    this.color        = shot.color;
    this.splashRadius = shot.splash;
    this.slow         = shot.slow;
    this.slowDuration = shot.slowDuration;
    this.chainValue   = shot.chain;

    this.active = true;
    this.traveled = 0;
  }

  update(delta, enemies) {
    if (!this.active || !this.target.alive) {
      this.active = false;
      return;
    }

    // Move towards target
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Distance per frame
    const moveDistance = this.speed * (delta / 1000);
    this.traveled += moveDistance;

    if (dist <= moveDistance) {
      // Hit the target
      this._onHit(enemies);
      this.active = false;
    } else {
      // Move towards target
      const ratio = moveDistance / dist;
      this.x += dx * ratio;
      this.y += dy * ratio;
    }
  }

  _onHit(enemies) {
    // Apply damage to primary target
    this.target.takeDamage(this.damage);

    // Apply slow effect if any
    if (this.slow > 0 && this.slowDuration > 0) {
      this.target.applySlowEffect(this.slow, this.slowDuration);
    }

    // Splash damage
    if (this.splashRadius > 0) {
      for (const enemy of enemies) {
        if (!enemy.alive || enemy === this.target) continue;
        const d = Math.hypot(enemy.x - this.target.x, enemy.y - this.target.y);
        if (d <= this.splashRadius) {
          const splashDamage = this.damage * 0.5; // 50% of main damage
          enemy.takeDamage(splashDamage);
          if (this.slow > 0) {
            enemy.applySlowEffect(this.slow, this.slowDuration);
          }
        }
      }

      // Add splash effect
      this.scene.addEffect({
        type: 'splash',
        x: this.target.x,
        y: this.target.y,
        radius: this.splashRadius,
        timer: 250,
      });
    }

    // Chain lightning
    if (this.chainValue > 0) {
      this._chainAttack(enemies, 0, [this.target]);
    }
  }

  _chainAttack(enemies, depth, hitEnemies) {
    if (depth >= this.chainValue) return;

    const searchRadius = TILE_SIZE * 3; // search radius for chain targets
    let nextTarget = null;
    let shortestDist = searchRadius;

    for (const enemy of enemies) {
      if (!enemy.alive || hitEnemies.includes(enemy)) continue;
      const d = Math.hypot(enemy.x - this.target.x, enemy.y - this.target.y);
      if (d < shortestDist) {
        shortestDist = d;
        nextTarget = enemy;
      }
    }

    if (!nextTarget) return;

    // Damage next target
    const chainDamage = this.damage * 0.75; // 75% of main damage
    nextTarget.takeDamage(chainDamage);

    // Add chain effect
    this.scene.addEffect({
      type: 'chain',
      x1: this.target.x,
      y1: this.target.y,
      x2: nextTarget.x,
      y2: nextTarget.y,
      timer: 150,
    });

    // Continue chain from new target
    hitEnemies.push(nextTarget);
    const prevTarget = this.target;
    this.target = nextTarget;
    this._chainAttack(enemies, depth + 1, hitEnemies);
    this.target = prevTarget;
  }

  renderTo(gfx) {
    const radius = 4;
    gfx.fillStyle(this.color, 1);
    gfx.fillCircle(this.x, this.y, radius);

    // Trailing glow
    gfx.fillStyle(this.color, 0.3);
    gfx.fillCircle(this.x, this.y, radius * 1.8);
  }
}
