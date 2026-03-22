class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────
  init() {
    this.gold      = 150;
    this.lives     = 20;
    this.wave      = 0;
    this.waveActive  = false;
    this.gameOver    = false;
    this.gameWon     = false;

    this.towers      = [];
    this.enemies     = [];
    this.projectiles = [];
    this.effects     = [];    // temporary visual effects (chain, splash)

    this.spawnQueue      = [];
    this.nextSpawnDelay  = 0;
    this.waveCountdown   = 6000;   // 6 s before first wave

    this.selectedTowerType = null;
    this.selectedTower     = null;
  }

  create() {
    // Build pixel-space waypoints for enemy movement
    this.pathPixels = PATH_WAYPOINTS.map(wp => ({
      x: wp.x * TILE_SIZE + TILE_SIZE / 2,
      y: wp.y * TILE_SIZE + TILE_SIZE / 2,
    }));

    // Shared render graphics (cleared every frame)
    this.enemyGfx  = this.add.graphics().setDepth(100);
    this.projGfx   = this.add.graphics().setDepth(101);
    this.effectGfx = this.add.graphics().setDepth(102);
    this.hoverGfx  = this.add.graphics().setDepth(103);

    // Static grid drawn once
    this._drawGrid();
    this._drawPathMarkers();

    // Input
    this.input.on('pointerdown', this._handleClick, this);

    // Push initial state to registry so UIScene can read it
    this._pushRegistry();

    // Start UIScene alongside this one
    this.scene.launch('UIScene');
  }

  // ─── Registry sync ─────────────────────────────────────────────────────────
  _pushRegistry() {
    this.registry.set('gold',          this.gold);
    this.registry.set('lives',         this.lives);
    this.registry.set('wave',          this.wave);
    this.registry.set('waveActive',    this.waveActive);
    this.registry.set('waveCountdown', this.waveCountdown);
    this.registry.set('totalWaves',    WAVE_DEFS.length);
    this.registry.set('selectedTower', null);
    this.registry.set('gameOver',      false);
    this.registry.set('gameWon',       false);
  }

  _syncGold()  { this.registry.set('gold',  this.gold);  }
  _syncLives() { this.registry.set('lives', this.lives); }

  // ─── Static visuals ─────────────────────────────────────────────────────────
  _drawGrid() {
    const gfx = this.add.graphics().setDepth(-10);
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const isPath = PATH_TILES.has(`${col},${row}`);
        gfx.fillStyle(isPath ? 0x7d6142 : 0x2d5a27, 1);
        gfx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    }
    // Subtle grid lines
    gfx.lineStyle(1, 0x000000, 0.18);
    for (let c = 0; c <= COLS; c++) {
      gfx.beginPath(); gfx.moveTo(c * TILE_SIZE, 0); gfx.lineTo(c * TILE_SIZE, GAME_HEIGHT); gfx.strokePath();
    }
    for (let r = 0; r <= ROWS; r++) {
      gfx.beginPath(); gfx.moveTo(0, r * TILE_SIZE); gfx.lineTo(GAME_WIDTH, r * TILE_SIZE); gfx.strokePath();
    }
  }

  _drawPathMarkers() {
    const gfx   = this.add.graphics().setDepth(-10);
    const spawn = this.pathPixels[0];
    const exit  = this.pathPixels[this.pathPixels.length - 1];

    // Spawn arrow (red triangle pointing right)
    gfx.fillStyle(0xe74c3c, 0.9);
    gfx.fillTriangle(
      spawn.x - 12, spawn.y - 10,
      spawn.x - 12, spawn.y + 10,
      spawn.x + 8,  spawn.y
    );

    // Exit diamond (green)
    gfx.fillStyle(0x2ecc71, 0.9);
    gfx.fillTriangle(exit.x - 10, exit.y, exit.x, exit.y - 10, exit.x + 10, exit.y);
    gfx.fillTriangle(exit.x - 10, exit.y, exit.x, exit.y + 10, exit.x + 10, exit.y);
  }

  // ─── Effects system ─────────────────────────────────────────────────────────
  addEffect(eff) {
    this.effects.push({ ...eff, maxTimer: eff.timer });
  }

  _renderEffects(delta) {
    this.effectGfx.clear();
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const eff = this.effects[i];
      eff.timer -= delta;
      if (eff.timer <= 0) { this.effects.splice(i, 1); continue; }

      const progress = 1 - eff.timer / eff.maxTimer;
      const alpha    = eff.timer / eff.maxTimer;

      if (eff.type === 'splash') {
        this.effectGfx.lineStyle(2.5, 0xff7675, alpha);
        this.effectGfx.strokeCircle(eff.x, eff.y, eff.radius * progress);
        this.effectGfx.lineStyle(1, 0xffeaa7, alpha * 0.5);
        this.effectGfx.strokeCircle(eff.x, eff.y, eff.radius * progress * 0.7);
      }
      if (eff.type === 'chain') {
        this.effectGfx.lineStyle(2, 0xffd700, alpha);
        this.effectGfx.beginPath();
        this.effectGfx.moveTo(eff.x1, eff.y1);
        this.effectGfx.lineTo(eff.x2, eff.y2);
        this.effectGfx.strokePath();
        this.effectGfx.lineStyle(5, 0xffeaa7, alpha * 0.25);
        this.effectGfx.beginPath();
        this.effectGfx.moveTo(eff.x1, eff.y1);
        this.effectGfx.lineTo(eff.x2, eff.y2);
        this.effectGfx.strokePath();
      }
    }
  }

  // ─── Input ─────────────────────────────────────────────────────────────────
  _handleClick(pointer) {
    if (this.gameOver || this.gameWon) return;
    if (pointer.x >= GAME_WIDTH) return;   // UI area – handled by UIScene

    const tileX = Math.floor(pointer.x / TILE_SIZE);
    const tileY = Math.floor(pointer.y / TILE_SIZE);
    if (tileX < 0 || tileX >= COLS || tileY < 0 || tileY >= ROWS) return;

    // Clicked on an existing tower?
    const clicked = this.towers.find(t => t.tileX === tileX && t.tileY === tileY);
    if (clicked) { this.selectTower(clicked); return; }

    // Placing a tower?
    if (this.selectedTowerType &&
        !PATH_TILES.has(`${tileX},${tileY}`) &&
        !this.towers.find(t => t.tileX === tileX && t.tileY === tileY)) {
      this._placeTower(tileX, tileY, this.selectedTowerType);
    } else {
      this.selectTower(null);
    }
  }

  _placeTower(tileX, tileY, type) {
    const cost = TOWER_DEFS[type].cost;
    if (this.gold < cost) return;
    this.gold -= cost;
    const tower = new Tower(this, tileX, tileY, type);
    this.towers.push(tower);
    this._syncGold();
  }

  // Called by UIScene buttons too
  selectTower(tower) {
    if (this.selectedTower) this.selectedTower.setSelected(false);
    this.selectedTower = tower;
    if (tower) {
      tower.setSelected(true);
      this.selectedTowerType = null;
      this.registry.set('selectedTowerType', null);
    }
    this._syncSelectedTower();
  }

  _syncSelectedTower() {
    const t = this.selectedTower;
    this.registry.set('selectedTower', t ? {
      type:        t.type,
      level:       t.level,
      damage:      t.damage,
      range:       t.range,
      canUpgrade:  t.canUpgrade(),
      upgradeCost: t.getUpgradeCost(),
      sellValue:   t.getSellValue(),
    } : null);
  }

  upgradeTower(tower) {
    if (!tower) return;
    const cost = tower.getUpgradeCost();
    if (!tower.canUpgrade() || this.gold < cost) return;
    this.gold -= cost;
    tower.level++;
    tower.totalInvested += cost;
    tower.applyUpgrade();
    tower.render();
    this._syncGold();
    this._syncSelectedTower();
  }

  sellTower(tower) {
    if (!tower) return;
    this.gold += tower.getSellValue();
    const idx = this.towers.indexOf(tower);
    if (idx !== -1) this.towers.splice(idx, 1);
    tower.destroy();
    this.selectTower(null);
    this._syncGold();
  }

  // ─── Wave management ────────────────────────────────────────────────────────
  _startWave() {
    this.wave++;
    this.waveActive = true;
    this.registry.set('wave',       this.wave);
    this.registry.set('waveActive', true);

    // Build flat spawn queue from wave groups
    this.spawnQueue     = [];
    this.nextSpawnDelay = 0;
    const groups = WAVE_DEFS[this.wave - 1];
    groups.forEach(group => {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({ type: group.type, delay: group.interval });
      }
    });
  }

  skipToNextWave() {
    if (!this.waveActive) this.waveCountdown = 0;
  }

  // ─── Main update loop ───────────────────────────────────────────────────────
  update(time, delta) {
    if (this.gameOver || this.gameWon) return;

    // 1 ── Wave countdown / start ─────────────────────────────────────────────
    if (!this.waveActive) {
      this.waveCountdown -= delta;
      this.registry.set('waveCountdown', Math.max(0, this.waveCountdown));
      if (this.waveCountdown <= 0) {
        if (this.wave < WAVE_DEFS.length) {
          this._startWave();
        } else {
          this.gameWon = true;
          this.registry.set('gameWon', true);
        }
      }
    }

    // 2 ── Spawn enemies ───────────────────────────────────────────────────────
    if (this.waveActive && this.spawnQueue.length > 0) {
      this.nextSpawnDelay -= delta;
      if (this.nextSpawnDelay <= 0) {
        const spawn = this.spawnQueue.shift();
        this.enemies.push(new Enemy(this, spawn.type, this.pathPixels));
        this.nextSpawnDelay = Math.max(spawn.delay, 50);
      }
    }

    // 3 ── Update & cull enemies ───────────────────────────────────────────────
    this.enemyGfx.clear();
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(delta);

      if (!e.alive) {
        this.gold += e.reward;
        this._syncGold();
        this.enemies.splice(i, 1);
        continue;
      }
      if (e.reached) {
        this.lives = Math.max(0, this.lives - 1);
        this._syncLives();
        this.enemies.splice(i, 1);
        if (this.lives <= 0) {
          this.gameOver = true;
          this.registry.set('gameOver', true);
        }
        continue;
      }
      e.renderTo(this.enemyGfx);
    }

    // 4 ── Check wave complete ─────────────────────────────────────────────────
    if (this.waveActive && this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.waveActive = false;
      this.registry.set('waveActive', false);
      if (this.wave >= WAVE_DEFS.length) {
        this.gameWon = true;
        this.registry.set('gameWon', true);
      } else {
        this.waveCountdown = 22000;
        this.registry.set('waveCountdown', this.waveCountdown);
      }
    }

    // 5 ── Towers fire ─────────────────────────────────────────────────────────
    const now = this.time.now;
    for (const tower of this.towers) {
      const shot = tower.tryFire(this.enemies, now);
      if (shot) this.projectiles.push(new Projectile(this, shot));
    }

    // 6 ── Update & render projectiles ─────────────────────────────────────────
    this.projGfx.clear();
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(delta, this.enemies);
      if (!p.active) { this.projectiles.splice(i, 1); continue; }
      p.renderTo(this.projGfx);
    }

    // 7 ── Temporary effects ───────────────────────────────────────────────────
    this._renderEffects(delta);

    // 8 ── Hover highlight ─────────────────────────────────────────────────────
    this._renderHover();
  }

  // ─── Hover tile highlight ───────────────────────────────────────────────────
  _renderHover() {
    this.hoverGfx.clear();
    if (!this.selectedTowerType) return;

    const ptr = this.input.activePointer;
    if (ptr.x >= GAME_WIDTH) return;
    const tx = Math.floor(ptr.x / TILE_SIZE);
    const ty = Math.floor(ptr.y / TILE_SIZE);
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return;

    const isPath   = PATH_TILES.has(`${tx},${ty}`);
    const hasTower = this.towers.some(t => t.tileX === tx && t.tileY === ty);
    const canPlace = !isPath && !hasTower;

    const px = tx * TILE_SIZE;
    const py = ty * TILE_SIZE;

    this.hoverGfx.fillStyle(canPlace ? 0x2ecc71 : 0xe74c3c, 0.28);
    this.hoverGfx.fillRect(px, py, TILE_SIZE - 1, TILE_SIZE - 1);

    if (canPlace) {
      const range = TOWER_DEFS[this.selectedTowerType].upgrades[0].range * TILE_SIZE;
      this.hoverGfx.lineStyle(1.5, 0xffffff, 0.3);
      this.hoverGfx.strokeCircle(px + TILE_SIZE / 2, py + TILE_SIZE / 2, range);
    }
  }
}
