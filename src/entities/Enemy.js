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
    this.reached          = false;
    this.slowEndTime      = 0;
    this.distanceTraveled = 0;

    this.x = pathPixels[0].x;
    this.y = pathPixels[0].y;

    // Animated sprites for grunt and brute, circle fallback for runner
    const ANIMATED = { grunt: 'grunt_walk', brute: 'brute_walk' };
    const ANIM_SIZE = { grunt: 44, brute: 52 };

    if (ANIMATED[type] && scene.textures.exists(ANIMATED[type])) {
      this.useSprite  = true;
      this.isAnimated = true;
      this.sprite = scene.add.sprite(this.x, this.y, ANIMATED[type]);
      this.sprite.setDisplaySize(ANIM_SIZE[type], ANIM_SIZE[type]);
      this.sprite.setDepth(5);
      this.sprite.play(`${type}_down`);
      this.lastDir = 'down';
    } else {
      const spriteKey = `enemy_${type}`;
      this.useSprite  = scene.textures.exists(spriteKey);
      if (this.useSprite) {
        this.sprite = scene.add.image(this.x, this.y, spriteKey);
        this.sprite.setDisplaySize(type === 'runner' ? 32 : 40, type === 'runner' ? 32 : 40);
        this.sprite.setDepth(5);
      }
    }
  }

  applySlowEffect(slow, duration) {
    this.speed       = this.baseSpeed * slow;
    this.slowEndTime = this.scene.time.now + duration;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) { this.health = 0; this.alive = false; }
  }

  destroy() {
    if (this.sprite) { this.sprite.destroy(); this.sprite = null; }
  }

  update(delta) {
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

    if (this.sprite) {
      this.sprite.setPosition(this.x, this.y);
      const isSlowed = this.slowEndTime > this.scene.time.now;
      this.sprite.setTint(isSlowed ? 0x74b9ff : 0xffffff);

      if (this.isAnimated) {
        const absDx = Math.abs(dx), absDy = Math.abs(dy);
        let dir;
        if (absDx > absDy) {
          dir = dx > 0 ? 'right' : 'left';
        } else {
          dir = dy > 0 ? 'down' : 'up';
        }
        if (dir !== this.lastDir) {
          this.lastDir = dir;
          this.sprite.setFlipX(false);
          if (dir === 'left') {
            this.sprite.play(`${this.type}_left`, true);
            this.sprite.setFlipX(true);
          } else {
            this.sprite.play(`${this.type}_${dir}`, true);
          }
        }
      }
    }
  }

  renderTo(gfx) {
    const isSlowed = this.slowEndTime > this.scene.time.now;

    // Fallback circle for enemy types without a sprite yet
    if (!this.useSprite) {
      gfx.fillStyle(isSlowed ? 0x74b9ff : this.color, 1);
      gfx.fillCircle(this.x, this.y, this.radius);
      if (this.type === 'brute') {
        gfx.lineStyle(2, 0xecf0f1, 0.8);
        gfx.strokeCircle(this.x, this.y, this.radius);
      }
      if (isSlowed) {
        gfx.lineStyle(1.5, 0x0984e3, 0.7);
        gfx.strokeCircle(this.x, this.y, this.radius + 3);
      }
    }

    // Health bar (always shown above sprite or circle)
    const bw = this.radius * 2.8;
    const bh = 4;
    const bx = this.x - bw / 2;
    const by = this.y - this.radius - 10;
    gfx.fillStyle(0x2c2c2c, 0.9);
    gfx.fillRect(bx, by, bw, bh);
    const ratio   = this.health / this.maxHealth;
    const hpColor = ratio > 0.6 ? 0x2ecc71 : ratio > 0.3 ? 0xf39c12 : 0xe74c3c;
    gfx.fillStyle(hpColor, 1);
    gfx.fillRect(bx, by, bw * ratio, bh);
  }
}
