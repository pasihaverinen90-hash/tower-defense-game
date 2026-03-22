class Enemy {
  constructor(scene, type, pathPixels) {
    this.scene      = scene;
    this.type       = type;
    const def       = ENEMY_DEFS[type];
    this.maxHealth  = def.health;
    this.health     = def.health;
    this.baseSpeed  = def.speed;
    this.speed      = def.speed;
    this.reward     = def.reward;
    this.color      = def.color;
    this.radius     = def.radius;

    this.pathPixels       = pathPixels;
    this.waypointIndex    = 1;
    this.alive            = true;
    this.reached          = false;   // true when enemy exits the map
    this.slowEndTime      = 0;
    this.distanceTraveled = 0;       // used for tower targeting (target furthest along)

    this.x = pathPixels[0].x;
    this.y = pathPixels[0].y;
  }

  // Called by Frost tower projectiles
  applySlowEffect(slow, duration) {
    this.speed      = this.baseSpeed * slow;
    this.slowEndTime = this.scene.time.now + duration;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.alive  = false;
    }
  }

  update(delta) {
    // Remove slow when it expires
    if (this.slowEndTime > 0 && this.scene.time.now > this.slowEndTime) {
      this.speed       = this.baseSpeed;
      this.slowEndTime = 0;
    }

    if (this.waypointIndex >= this.pathPixels.length) {
      this.reached = true;
      return;
    }

    const target = this.pathPixels[this.waypointIndex];
    const dx   = target.x - this.x;
    const dy   = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const move = this.speed * (delta / 1000);

    if (dist <= move) {
      this.x = target.x;
      this.y = target.y;
      this.distanceTraveled += dist;
      this.waypointIndex++;
    } else {
      this.x += (dx / dist) * move;
      this.y += (dy / dist) * move;
      this.distanceTraveled += move;
    }
  }

  // Draw this enemy into a shared Graphics object (called each frame)
  renderTo(gfx) {
    const isSlowed = this.slowEndTime > this.scene.time.now;

    // Body fill
    gfx.fillStyle(isSlowed ? 0x74b9ff : this.color, 1);
    gfx.fillCircle(this.x, this.y, this.radius);

    // White outline for brutes
    if (this.type === 'brute') {
      gfx.lineStyle(2, 0xecf0f1, 0.8);
      gfx.strokeCircle(this.x, this.y, this.radius);
    }

    // Slow indicator ring
    if (isSlowed) {
      gfx.lineStyle(1.5, 0x0984e3, 0.7);
      gfx.strokeCircle(this.x, this.y, this.radius + 3);
    }

    // Health bar background
    const bw = this.radius * 2.8;
    const bh = 4;
    const bx = this.x - bw / 2;
    const by = this.y - this.radius - 8;
    gfx.fillStyle(0x2c2c2c, 0.9);
    gfx.fillRect(bx, by, bw, bh);

    // Health bar fill
    const ratio    = this.health / this.maxHealth;
    const hpColor  = ratio > 0.6 ? 0x2ecc71 : ratio > 0.3 ? 0xf39c12 : 0xe74c3c;
    gfx.fillStyle(hpColor, 1);
    gfx.fillRect(bx, by, bw * ratio, bh);
  }
}
