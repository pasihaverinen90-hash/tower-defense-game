class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  // ─── Preload ───────────────────────────────────────────────────────────────
  preload() {
    this.load.image('tile_grass',   'assets/tiles/tile_grass.png');
    this.load.image('tile_path',    'assets/tiles/tile_path.png');
    this.load.image('tower_archer', 'assets/towers/archer.png');
    this.load.image('tower_cannon', 'assets/towers/cannon.png');
    this.load.image('tower_frost',  'assets/towers/frost.png');
    this.load.image('tower_tesla',  'assets/towers/tesla.png');
    this.load.spritesheet('grunt_walk',  'assets/enemies/grunt_walk.png',  { frameWidth: 160, frameHeight: 160 });
    this.load.spritesheet('runner_walk', 'assets/enemies/runner_walk.png', { frameWidth: 160, frameHeight: 160 });
    this.load.spritesheet('brute_walk',  'assets/enemies/brute_walk.png',  { frameWidth: 160, frameHeight: 160 });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  init(data) {
    this.levelIndex = (data && data.levelIndex !== undefined) ? data.levelIndex : 0;
    this.levelDef   = LEVEL_DEFS[this.levelIndex];
    this.buffs      = (data && data.buffs) ? data.buffs : { range: 0, speed: 0, damage: 0, crit: 0 };

    this.gold      = this.levelDef.startGold;
    this.lives     = this.levelDef.startLives;
    this.wave      = 0;
    this.waveActive    = false;
    this.gameOver      = false;
    this.levelComplete = false;
    this.gameWon       = false;

    this.towers      = [];
    this.enemies     = [];
    this.projectiles = [];
    this.effects     = [];

    // spawnQueues: one entry per active path, each with its own timer
    // [{ pathIdx, queue: [{type, delay},...], nextDelay }]
    this.spawnQueues    = [];
    this.waveCountdown  = 6000;

    this.selectedTowerType = null;
    this.selectedTower     = null;
  }

  // ─── Create ───────────────────────────────────────────────────────────────
  create() {
    // Build pixel arrays for every path in this level
    this.allPathPixels = this.levelDef.paths.map(p =>
      p.waypoints.map(wp => ({
        x: wp.x * TILE_SIZE + TILE_SIZE / 2,
        y: wp.y * TILE_SIZE + TILE_SIZE / 2,
      }))
    );

    // Union of ALL path tiles (for tower placement blocking)
    this.pathTiles = buildAllPathTiles(this.levelDef.paths);

    this._drawGrid();
    this._drawPathMarkers();
    this._createEnemyAnims();

    this.enemyGfx  = this.add.graphics().setDepth(7);
    this.projGfx   = this.add.graphics().setDepth(8);
    this.effectGfx = this.add.graphics().setDepth(9);
    this.hoverGfx  = this.add.graphics().setDepth(10);

    this.input.on('pointerdown', this._handleClick, this);

    this._pushRegistry();
    this.scene.launch('UIScene');
  }

  // ─── Registry ─────────────────────────────────────────────────────────────
  _pushRegistry() {
    this.registry.set('gold',          this.gold);
    this.registry.set('lives',         this.lives);
    this.registry.set('wave',          this.wave);
    this.registry.set('waveActive',    this.waveActive);
    this.registry.set('waveCountdown', this.waveCountdown);
    this.registry.set('totalWaves',    this.levelDef.waves.length);
    this.registry.set('levelIndex',    this.levelIndex);
    this.registry.set('levelName',     this.levelDef.name);
    this.registry.set('levelSubtitle', this.levelDef.subtitle);
    this.registry.set('totalLevels',   LEVEL_DEFS.length);
    this.registry.set('buffs',         this.buffs);
    this.registry.set('selectedTower', null);
    this.registry.set('gameOver',      false);
    this.registry.set('gameWon',       false);
  }

  _syncGold()  { this.registry.set('gold',  this.gold);  }
  _syncLives() { this.registry.set('lives', this.lives); }

  // ─── Grid drawing ──────────────────────────────────────────────────────────
  _drawGrid() {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const isPath = this.pathTiles.has(`${col},${row}`);
        this.add.image(
          col * TILE_SIZE + TILE_SIZE / 2,
          row * TILE_SIZE + TILE_SIZE / 2,
          isPath ? 'tile_path' : 'tile_grass'
        ).setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(0);
      }
    }
  }

  // Draw a spawn arrow and exit diamond for every path in the level
  _drawPathMarkers() {
    const gfx = this.add.graphics().setDepth(1);

    this.allPathPixels.forEach((pixels, idx) => {
      // Arrow colours cycle so multi-path levels are easy to read
      const arrowColors = [0xe74c3c, 0x3498db, 0x9b59b6, 0x2ecc71];
      const exitColors  = [0x2ecc71, 0xf39c12, 0xe67e22, 0x1abc9c];
      const ac = arrowColors[idx % arrowColors.length];
      const ec = exitColors[idx  % exitColors.length];

      const spawn = pixels[0];
      const exit  = pixels[pixels.length - 1];

      // Entry arrow (pointing right, clamped to left game edge)
      const sx = Math.max(0, spawn.x);
      const sy = spawn.y;
      gfx.fillStyle(ac, 0.95);
      gfx.fillTriangle(sx - 12, sy - 10, sx - 12, sy + 10, sx + 8, sy);

      // Exit diamond (clamped to right/bottom game edge)
      const ex = Math.min(GAME_WIDTH - 4, exit.x);
      const ey = Math.max(4, Math.min(GAME_HEIGHT - 4, exit.y));
      gfx.fillStyle(ec, 0.95);
      gfx.fillTriangle(ex - 10, ey, ex, ey - 10, ex + 10, ey);
      gfx.fillTriangle(ex - 10, ey, ex, ey + 10, ex + 10, ey);
    });
  }

  // ─── Enemy animations ─────────────────────────────────────────────────────
  _createEnemyAnims() {
    [['grunt', 'grunt_walk', 8], ['runner', 'runner_walk', 12], ['brute', 'brute_walk', 6]].forEach(([type, key, fps]) => {
      [['down', 0], ['right', 1], ['up', 2]].forEach(([dir, row]) => {
        this.anims.create({
          key: `${type}_${dir}`,
          frames: this.anims.generateFrameNumbers(key, { start: row * 4, end: row * 4 + 3 }),
          frameRate: fps, repeat: -1,
        });
      });
      this.anims.create({
        key: `${type}_left`,
        frames: this.anims.generateFrameNumbers(key, { start: 4, end: 7 }),
        frameRate: fps, repeat: -1,
      });
    });
  }

  // ─── Effects ──────────────────────────────────────────────────────────────
  addEffect(eff) { this.effects.push({ ...eff, maxTimer: eff.timer }); }

  _renderEffects(delta) {
    this.effectGfx.clear();
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const eff  = this.effects[i];
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
        this.effectGfx.moveTo(eff.x1, eff.y1); this.effectGfx.lineTo(eff.x2, eff.y2);
        this.effectGfx.strokePath();
        this.effectGfx.lineStyle(5, 0xffeaa7, alpha * 0.25);
        this.effectGfx.beginPath();
        this.effectGfx.moveTo(eff.x1, eff.y1); this.effectGfx.lineTo(eff.x2, eff.y2);
        this.effectGfx.strokePath();
      }
    }
  }

  // ─── Input ────────────────────────────────────────────────────────────────
  _handleClick(pointer) {
    if (this.gameOver || this.levelComplete || this.gameWon) return;
    if (pointer.x >= GAME_WIDTH) return;

    const tileX = Math.floor(pointer.x / TILE_SIZE);
    const tileY = Math.floor(pointer.y / TILE_SIZE);
    if (tileX < 0 || tileX >= COLS || tileY < 0 || tileY >= ROWS) return;

    const clicked = this.towers.find(t => t.tileX === tileX && t.tileY === tileY);
    if (clicked) { this.selectTower(clicked); return; }

    if (this.selectedTowerType &&
        !this.pathTiles.has(`${tileX},${tileY}`) &&
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
    this.towers.push(new Tower(this, tileX, tileY, type));
    this._syncGold();
  }

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
      type:           t.type,
      level:          t.level,
      damage:         t.damage,
      range:          t.range,
      targetPriority: t.targetPriority,
      canUpgrade:     t.canUpgrade(),
      upgradeCost:    t.getUpgradeCost(),
      sellValue:      t.getSellValue(),
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

  setTargetPriority(tower, priority) {
    if (!tower) return;
    tower.targetPriority = priority;
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

  // ─── Level complete ────────────────────────────────────────────────────────
  _onLevelComplete() {
    if (this.levelComplete) return;
    this.levelComplete = true;
    this.scene.stop('UIScene');

    if (this.levelIndex + 1 >= LEVEL_DEFS.length) {
      this.gameWon = true;
      this.scene.launch('UIScene');
      this.registry.set('gameWon', true);
    } else {
      this.scene.start('BuffScene', {
        livesLeft:  this.lives,
        levelIndex: this.levelIndex,
        buffs:      this.buffs,
      });
    }
  }

  // ─── Wave start — builds one spawn queue per path ──────────────────────────
  _startWave() {
    this.wave++;
    this.waveActive = true;
    this.registry.set('wave', this.wave);
    this.registry.set('waveActive', true);

    // Group wave enemies by path index
    const pathGroups = {};
    this.levelDef.waves[this.wave - 1].forEach(group => {
      const p = group.path !== undefined ? group.path : 0;
      if (!pathGroups[p]) pathGroups[p] = [];
      for (let i = 0; i < group.count; i++)
        pathGroups[p].push({ type: group.type, delay: group.interval });
    });

    // One independent spawn queue per path
    this.spawnQueues = Object.entries(pathGroups).map(([pathIdx, queue]) => ({
      pathIdx:   parseInt(pathIdx),
      queue,
      nextDelay: 0,   // start spawning immediately
    }));
  }

  skipToNextWave() {
    if (!this.waveActive) this.waveCountdown = 0;
  }

  // ─── Update loop ───────────────────────────────────────────────────────────
  update(time, delta) {
    if (this.gameOver || this.levelComplete) return;

    // ── Wave countdown ───────────────────────────────────────────────────────
    if (!this.waveActive) {
      this.waveCountdown -= delta;
      if (this.waveCountdown <= 0) {
        if (this.wave < this.levelDef.waves.length) this._startWave();
        else this._onLevelComplete();
      }
    }

    // ── Spawn from each path queue independently ─────────────────────────────
    if (this.waveActive) {
      for (const sq of this.spawnQueues) {
        if (sq.queue.length === 0) continue;
        sq.nextDelay -= delta;
        if (sq.nextDelay <= 0) {
          const s = sq.queue.shift();
          const pixels = this.allPathPixels[sq.pathIdx] || this.allPathPixels[0];
          this.enemies.push(new Enemy(this, s.type, pixels, this.wave));
          sq.nextDelay = Math.max(s.delay, 50);
        }
      }
    }

    // ── Update enemies ───────────────────────────────────────────────────────
    this.enemyGfx.clear();
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(delta);
      if (!e.alive) {
        this.gold += e.reward; this._syncGold();
        e.destroy(); this.enemies.splice(i, 1); continue;
      }
      if (e.reached) {
        this.lives = Math.max(0, this.lives - 1); this._syncLives();
        e.destroy(); this.enemies.splice(i, 1);
        if (this.lives <= 0) { this.gameOver = true; this.registry.set('gameOver', true); }
        continue;
      }
      e.renderTo(this.enemyGfx);
    }

    // ── Wave complete: ALL queues empty AND no enemies alive ─────────────────
    if (this.waveActive &&
        this.spawnQueues.every(sq => sq.queue.length === 0) &&
        this.enemies.length === 0) {
      this.waveActive = false;
      this.registry.set('waveActive', false);
      if (this.wave >= this.levelDef.waves.length) {
        this._onLevelComplete();
      } else {
        this.waveCountdown = 5000;
      }
    }

    // ── Towers fire ──────────────────────────────────────────────────────────
    // Frost towers: aura effect — slow all enemies in range, no projectile
    // All other towers: fire projectiles as normal
    const now = this.time.now;
    for (const tower of this.towers) {
      if (tower.type === 'frost') {
        tower.updateAura(this.enemies, delta);
      } else {
        const shot = tower.tryFire(this.enemies, now);
        if (shot) this.projectiles.push(new Projectile(this, shot));
      }
    }

    // ── Update projectiles ───────────────────────────────────────────────────
    this.projGfx.clear();
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(delta, this.enemies);
      if (!p.active) { this.projectiles.splice(i, 1); continue; }
      p.renderTo(this.projGfx);
    }

    this._renderEffects(delta);
    this._renderHover();
  }

  // ─── Hover highlight ─────────────────────────────────────────────────────
  _renderHover() {
    this.hoverGfx.clear();
    if (!this.selectedTowerType) return;
    const ptr = this.input.activePointer;
    if (ptr.x >= GAME_WIDTH) return;
    const tx = Math.floor(ptr.x / TILE_SIZE);
    const ty = Math.floor(ptr.y / TILE_SIZE);
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return;
    const canPlace = !this.pathTiles.has(`${tx},${ty}`) &&
                     !this.towers.some(t => t.tileX === tx && t.tileY === ty);
    const px = tx * TILE_SIZE, py = ty * TILE_SIZE;
    this.hoverGfx.fillStyle(canPlace ? 0x2ecc71 : 0xe74c3c, 0.28);
    this.hoverGfx.fillRect(px, py, TILE_SIZE - 1, TILE_SIZE - 1);
    if (canPlace) {
      const range = TOWER_DEFS[this.selectedTowerType].upgrades[0].range * TILE_SIZE;
      this.hoverGfx.lineStyle(1.5, 0xffffff, 0.3);
      this.hoverGfx.strokeCircle(px + TILE_SIZE / 2, py + TILE_SIZE / 2, range);
    }
  }
}
