class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  create() {
    const PX = GAME_WIDTH, PW = UI_WIDTH;
    this.PX = PX; this.PW = PW;

    const panel = this.add.graphics();
    panel.fillStyle(0x0d1117, 1);
    panel.fillRect(PX, 0, PW, CANVAS_HEIGHT);
    panel.lineStyle(2, 0x2d3561, 1);
    panel.beginPath(); panel.moveTo(PX, 0); panel.lineTo(PX, CANVAS_HEIGHT); panel.strokePath();

    this.infoGfx   = this.add.graphics();
    this.infoTexts = [];
    this._sellArmedTower = null;
    this._sellArmedTimer = null;
    this._lastWaveActive = undefined;
    this._lastPaused     = undefined;

    this._createStaticUI();
    this._createTowerShop();
    this._createSkipButton();
    this._createOverlays();

    this.registry.events.on('changedata', () => this._updateHUD(), this);
    this._updateHUD();
  }

  // ─── Countdown bar runs every frame to avoid rebuilding interactive zones ───
  update() {
    const gs = this.scene.get('GameScene');
    if (!gs || !this.countdownBar) return;

    const waveActive = gs.waveActive;
    const wave       = gs.wave;
    const total      = this.registry.get('totalWaves') ?? 0;
    const countdown  = gs.waveCountdown;

    this.countdownBar.clear();
    if (!waveActive && wave < total) {
      const maxCD = wave === 0 ? 6000 : 5000;
      this.countdownBar.fillStyle(0x2d6a9f, 1);
      this.countdownBar.fillRect(this.PX + 8, 100, (this.PW - 16) * Math.min(1, countdown / maxCD), 12);
      this.countdownText.setText(`Next wave in ${Math.ceil(countdown / 1000)}s`);
    } else {
      this.countdownText.setText(waveActive ? 'Wave active!' : '');
    }

    // Refresh skip/pause buttons (cheap — only redraws if state changed)
    if (this._lastWaveActive !== waveActive) {
      this._lastWaveActive = waveActive;
      this._drawSkipBtn();
    }
    if (this._lastPaused !== gs.paused) {
      this._lastPaused = gs.paused;
      this._drawPauseBtn(!!gs.paused);
    }
  }

  // ─── Static HUD ────────────────────────────────────────────────────────────
  _createStaticUI() {
    const PX = this.PX, PW = this.PW, cx = PX + PW / 2;

    const rowStyle = { fontSize: '11px', fontFamily: 'Arial', color: '#636e72' };
    const valStyle = { fontSize: '20px', fontFamily: 'Arial Black', color: '#ecf0f1' };

    this.add.text(PX + 14, 10, '💰 GOLD',  rowStyle);
    this.add.text(PX + 14, 36, '❤️ LIVES', rowStyle);
    this.add.text(PX + 14, 62, '🌊 WAVE',  rowStyle);

    this.goldText  = this.add.text(PX + 82, 6,  '150', valStyle);
    this.livesText = this.add.text(PX + 82, 32, '20',  valStyle);
    this.waveText  = this.add.text(PX + 82, 58, '0/15',valStyle);

    this.levelNameText = this.add.text(cx, 88, '', {
      fontSize: '10px', fontFamily: 'Arial Black', color: '#f39c12'
    }).setOrigin(0.5);

    // Countdown bar
    const cbg = this.add.graphics();
    cbg.fillStyle(0x1c2a3a, 1);
    cbg.fillRect(PX + 8, 100, PW - 16, 12);
    this.countdownBar  = this.add.graphics();
    this.countdownText = this.add.text(cx, 106, '', {
      fontSize: '10px', fontFamily: 'Arial', color: '#95a5a6'
    }).setOrigin(0.5);

    // Active buffs strip
    this.add.text(cx, 120, 'ACTIVE BUFFS', {
      fontSize: '9px', fontFamily: 'Arial Black', color: '#4a5568', letterSpacing: 2
    }).setOrigin(0.5);
    this.buffGfx   = this.add.graphics();
    this.buffTexts = [];

    // Divider + Shop header
    const div = this.add.graphics();
    div.lineStyle(1, 0x2d3561, 1);
    div.beginPath(); div.moveTo(PX + 8, 160); div.lineTo(PX + PW - 8, 160); div.strokePath();

    this.add.text(cx, 168, 'TOWERS', {
      fontSize: '12px', fontFamily: 'Arial Black', color: '#636e72', letterSpacing: 3
    }).setOrigin(0.5);
  }

  // ─── Tower shop ────────────────────────────────────────────────────────────
  _createTowerShop() {
    const PX = this.PX, PW = this.PW;
    const BH = 58, GAP = 5;
    const SHOP_TYPES  = ['archer', 'cannon', 'frost', 'tesla'];
    const TYPE_LABELS = { archer: 'Fast · Balanced', cannon: 'Slow · Splash', frost: 'Medium · Slows', tesla: 'Slow · Chains x2' };

    this.shopButtons = {};
    SHOP_TYPES.forEach((type, i) => {
      const def = TOWER_DEFS[type];
      const bx = PX + 8, by = 180 + i * (BH + GAP), bw = PW - 16;

      const bg = this.add.graphics();
      const draw = (col) => {
        bg.clear();
        bg.fillStyle(col, 1);
        bg.fillRoundedRect(bx, by, bw, BH, 7);
        bg.lineStyle(1.5, def.color, 0.4);
        bg.strokeRoundedRect(bx, by, bw, BH, 7);
      };
      draw(0x141e2b);

      const icon = this.add.graphics();
      icon.fillStyle(0x1e272e, 1);
      icon.fillRect(bx + 8, by + 7, 40, 40);
      const spriteKey = `tower_${type}`;
      if (this.textures.exists(spriteKey)) {
        this.add.image(bx + 28, by + 27, spriteKey).setDisplaySize(36, 36);
      } else {
        icon.fillStyle(def.color, 1);
        icon.fillRect(bx + 15, by + 14, 26, 26);
      }

      this.add.text(bx + 58, by + 6,  def.name,           { fontSize: '14px', fontFamily: 'Arial Black', color: '#ecf0f1' });
      this.add.text(bx + 58, by + 24, `${def.cost}g`,     { fontSize: '13px', fontFamily: 'Arial',       color: '#f1c40f' });
      this.add.text(bx + 58, by + 40, TYPE_LABELS[type],  { fontSize: '10px', fontFamily: 'Arial',       color: '#636e72' });

      const zone = this.add.zone(bx, by, bw, BH).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover',  () => { if (this.registry.get('selectedTowerType') !== type) draw(0x1e2d40); });
      zone.on('pointerout',   () => { if (this.registry.get('selectedTowerType') !== type) draw(0x141e2b); });
      zone.on('pointerdown',  () => this._onShopClick(type));
      this.shopButtons[type] = { bg, draw };
    });
  }

  _onShopClick(type) {
    const current   = this.registry.get('selectedTowerType');
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) return;
    Object.values(this.shopButtons).forEach(b => b.draw(0x141e2b));
    if (current === type) {
      this.registry.set('selectedTowerType', null);
      gameScene.selectedTowerType = null;
      gameScene.selectTower(null);
    } else {
      this.shopButtons[type].draw(0x1a3d5c);
      this.registry.set('selectedTowerType', type);
      gameScene.selectedTowerType = type;
      gameScene.selectTower(null);
    }
  }

  // ─── Skip + Pause buttons (bottom row, side-by-side) ───────────────────────
  _createSkipButton() {
    const PX = this.PX, PW = this.PW;
    const by = CANVAS_HEIGHT - 54, bh = 40;
    const pauseBW = 56;
    const skipBX  = PX + 8;
    const skipBW  = PW - 16 - pauseBW - 6;
    const pauseBX = skipBX + skipBW + 6;

    // Skip / Start Wave button
    this.skipBg = this.add.graphics();
    this.skipText = this.add.text(skipBX + skipBW / 2, by + 20, '', {
      fontSize: '14px', fontFamily: 'Arial Black', color: '#74b9ff'
    }).setOrigin(0.5);
    this._skipBtnBounds = { x: skipBX, y: by, w: skipBW, h: bh };
    this._drawSkipBtn();
    const skipZone = this.add.zone(skipBX, by, skipBW, bh).setOrigin(0).setInteractive({ useHandCursor: true });
    skipZone.on('pointerdown', () => {
      const gs = this.scene.get('GameScene');
      if (gs && !gs.waveActive) gs.skipToNextWave();
    });

    // Pause / Resume button
    this.pauseBg = this.add.graphics();
    this.pauseText = this.add.text(pauseBX + pauseBW / 2, by + 20, '⏸', {
      fontSize: '20px', fontFamily: 'Arial Black', color: '#f1c40f'
    }).setOrigin(0.5);
    this._pauseBtnBounds = { x: pauseBX, y: by, w: pauseBW, h: bh };
    this._drawPauseBtn(false);
    const pauseZone = this.add.zone(pauseBX, by, pauseBW, bh).setOrigin(0).setInteractive({ useHandCursor: true });
    pauseZone.on('pointerdown', () => {
      const gs = this.scene.get('GameScene');
      if (gs) gs.togglePause();
    });
  }

  _drawSkipBtn() {
    const gs = this.scene.get('GameScene');
    const waveActive = gs ? gs.waveActive : false;
    const { x, y, w, h } = this._skipBtnBounds;
    this.skipBg.clear();
    this.skipBg.fillStyle(waveActive ? 0x141e2b : 0x1a2940, 1);
    this.skipBg.fillRoundedRect(x, y, w, h, 7);
    this.skipBg.lineStyle(1.5, waveActive ? 0x2d3561 : 0x3498db, waveActive ? 0.5 : 1);
    this.skipBg.strokeRoundedRect(x, y, w, h, 7);
    if (waveActive) {
      this.skipText.setText('Wave in progress');
      this.skipText.setColor('#4a5568');
    } else {
      this.skipText.setText('▶  Start Wave Now');
      this.skipText.setColor('#74b9ff');
    }
  }

  _drawPauseBtn(paused) {
    const { x, y, w, h } = this._pauseBtnBounds;
    this.pauseBg.clear();
    this.pauseBg.fillStyle(paused ? 0x6c5300 : 0x1a2940, 1);
    this.pauseBg.fillRoundedRect(x, y, w, h, 7);
    this.pauseBg.lineStyle(1.5, paused ? 0xf1c40f : 0x2d3561, 1);
    this.pauseBg.strokeRoundedRect(x, y, w, h, 7);
    this.pauseText.setText(paused ? '▶' : '⏸');
  }

  // ─── Game Over / Victory overlays only (level complete now handled by BuffScene) ──
  _createOverlays() {
    const W = CANVAS_WIDTH, H = CANVAS_HEIGHT, cx = W / 2, cy = H / 2;
    this.gameOverOverlay = this._makeOverlay(cx, cy, '💀 GAME OVER', '#e74c3c', 'The enemies broke through!');
    this.gameWonOverlay  = this._makeOverlay(cx, cy, '🏆 VICTORY!',  '#f1c40f', 'You conquered all levels!');
    this.gameOverOverlay.setVisible(false);
    this.gameWonOverlay.setVisible(false);
  }

  _makeOverlay(cx, cy, title, titleColor, subtitle) {
    const W = CANVAS_WIDTH, H = CANVAS_HEIGHT;
    const container = this.add.container(cx, cy);
    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.82);
    dim.fillRect(-W / 2, -H / 2, W, H);
    const titleTxt = this.add.text(0, -80, title, {
      fontSize: '62px', fontFamily: 'Arial Black', color: titleColor,
      stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);
    const subTxt = this.add.text(0, 10, subtitle, {
      fontSize: '20px', fontFamily: 'Arial', color: '#b2bec3'
    }).setOrigin(0.5);
    const btn = this.add.text(0, 90, '▶  PLAY AGAIN', {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#ffffff',
      backgroundColor: '#27ae60', padding: { x: 24, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover',  () => btn.setStyle({ backgroundColor: '#2ecc71' }));
    btn.on('pointerout',   () => btn.setStyle({ backgroundColor: '#27ae60' }));
    btn.on('pointerdown',  () => { this.scene.stop('GameScene'); this.scene.start('MenuScene'); });
    container.add([dim, titleTxt, subTxt, btn]);
    return container;
  }

  // ─── HUD update ─────────────────────────────────────────────────────────────
  _updateHUD() {
    const gold      = this.registry.get('gold')          ?? 150;
    const lives     = this.registry.get('lives')         ?? 20;
    const wave      = this.registry.get('wave')          ?? 0;
    const total     = this.registry.get('totalWaves')    ?? 15;
    const levelName = this.registry.get('levelName')     ?? '';
    const levelSub  = this.registry.get('levelSubtitle') ?? '';
    const buffs     = this.registry.get('buffs')         ?? null;
    const gameOver  = this.registry.get('gameOver')      ?? false;
    const gameWon   = this.registry.get('gameWon')       ?? false;
    const selTower  = this.registry.get('selectedTower');

    this.goldText.setText(gold);
    this.livesText.setText(lives);
    this.waveText.setText(`${wave}/${total}`);
    this.livesText.setColor(lives <= 5 ? '#e74c3c' : '#ecf0f1');
    this.levelNameText.setText(`${levelName}  ·  ${levelSub}`);

    // Active buffs
    this._drawBuffStrip(buffs);
    this._updateTowerInfo(selTower, gold);

    if (gameOver) this.gameOverOverlay.setVisible(true);
    if (gameWon)  this.gameWonOverlay.setVisible(true);
  }

  // ─── Buff strip ─────────────────────────────────────────────────────────────
  _drawBuffStrip(buffs) {
    this.buffGfx.clear();
    this.buffTexts.forEach(t => t.destroy());
    this.buffTexts = [];

    if (!buffs) return;
    const active = [
      { key: 'range',  icon: '🎯', color: 0x2ecc71 },
      { key: 'speed',  icon: '⚡', color: 0xf39c12 },
      { key: 'damage', icon: '⚔',  color: 0xe74c3c },
      { key: 'crit',   icon: '💥', color: 0x9b59b6 },
    ].filter(b => buffs[b.key] > 0);

    if (active.length === 0) {
      const t = this.add.text(this.PX + this.PW / 2, 140, 'None yet', {
        fontSize: '10px', fontFamily: 'Arial', color: '#4a5568'
      }).setOrigin(0.5);
      this.buffTexts.push(t);
      return;
    }

    const spacing = (this.PW - 16) / active.length;
    active.forEach((b, i) => {
      const bx = this.PX + 8 + spacing * i + spacing / 2;
      const by = 140;
      this.buffGfx.fillStyle(b.color, 0.15);
      this.buffGfx.fillRoundedRect(bx - spacing / 2 + 2, by - 10, spacing - 4, 20, 4);

      const label = `${b.icon}+${buffs[b.key]}`;
      const t = this.add.text(bx, by, label, {
        fontSize: '11px', fontFamily: 'Arial Black',
        color: `#${b.color.toString(16).padStart(6, '0')}`
      }).setOrigin(0.5);
      this.buffTexts.push(t);
    });
  }

  // ─── Tower info panel ───────────────────────────────────────────────────────
  _updateTowerInfo(data, gold) {
    this.infoGfx.clear();
    this.infoTexts.forEach(t => t.destroy());
    this.infoTexts = [];
    if (!data) return;

    const PX = this.PX, PW = this.PW;
    const def = TOWER_DEFS[data.type];
    const TOP = 418;

    // Divider
    this.infoGfx.lineStyle(1, 0x2d3561, 1);
    this.infoGfx.beginPath();
    this.infoGfx.moveTo(PX + 8, TOP - 10); this.infoGfx.lineTo(PX + PW - 8, TOP - 10);
    this.infoGfx.strokePath();

    // Colour dot + name
    this.infoGfx.fillStyle(def.color, 1);
    this.infoGfx.fillCircle(PX + 18, TOP + 10, 7);

    const T = (x, y, text, style) => {
      const obj = this.add.text(x, y, text, style);
      this.infoTexts.push(obj);
      return obj;
    };

    T(PX + 32, TOP,      `${def.name}  Lv${data.level + 1}`,                     { fontSize: '14px', fontFamily: 'Arial Black', color: '#ecf0f1' });
    T(PX + 14, TOP + 22, `⚔  ${data.damage} dmg`,                                { fontSize: '12px', fontFamily: 'Arial', color: '#dfe6e9' });
    T(PX + 14, TOP + 38, `🎯 ${(data.range / TILE_SIZE).toFixed(1)} tile range`,  { fontSize: '12px', fontFamily: 'Arial', color: '#dfe6e9' });

    // ── Targeting priority buttons ─────────────────────────────────────────
    // Skip for frost (it hits everything in range, targeting is irrelevant)
    if (data.type !== 'frost') {
      T(PX + 8, TOP + 58, 'TARGET', { fontSize: '9px', fontFamily: 'Arial Black', color: '#4a5568', letterSpacing: 2 });

      const priorities = [
        { key: 'first',   label: '1st',   tip: 'Furthest along path' },
        { key: 'closest', label: 'Near',  tip: 'Closest to tower'    },
        { key: 'mostHp',  label: 'Most',  tip: 'Highest HP'          },
        { key: 'leastHp', label: 'Least', tip: 'Lowest HP'           },
      ];

      const btnW = (PW - 20) / 4;
      const btnH = 26;
      const btnY = TOP + 70;

      priorities.forEach((p, i) => {
        const bx     = PX + 8 + i * (btnW + 1);
        const active = data.targetPriority === p.key;

        this.infoGfx.fillStyle(active ? 0x2980b9 : 0x1a2940, 1);
        this.infoGfx.fillRoundedRect(bx, btnY, btnW, btnH, 4);
        if (active) {
          this.infoGfx.lineStyle(1, 0x3498db, 1);
          this.infoGfx.strokeRoundedRect(bx, btnY, btnW, btnH, 4);
        }

        T(bx + btnW / 2, btnY + 13, p.label, {
          fontSize: '10px', fontFamily: 'Arial Black',
          color: active ? '#ffffff' : '#636e72'
        }).setOrigin(0.5);

        const z = this.add.zone(bx, btnY, btnW, btnH).setOrigin(0).setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => {
          const gs = this.scene.get('GameScene');
          if (gs?.selectedTower) gs.setTargetPriority(gs.selectedTower, p.key);
        });
        this.infoTexts.push(z);
      });
    }

    // ── Upgrade button ─────────────────────────────────────────────────────
    const BX  = PX + 8, BW = PW - 16;
    const BY1 = data.type !== 'frost' ? TOP + 104 : TOP + 58;
    const BH  = 34;

    if (data.canUpgrade) {
      const canAfford = gold >= data.upgradeCost;
      this.infoGfx.fillStyle(canAfford ? 0x27ae60 : 0x2d3561, 1);
      this.infoGfx.fillRoundedRect(BX, BY1, BW, BH, 6);
      T(PX + PW / 2, BY1 + 17, `⬆  Upgrade  ${data.upgradeCost}g`, {
        fontSize: '13px', fontFamily: 'Arial Black', color: canAfford ? '#ffffff' : '#636e72'
      }).setOrigin(0.5);
      if (canAfford) {
        const z = this.add.zone(BX, BY1, BW, BH).setOrigin(0).setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => { const gs = this.scene.get('GameScene'); if (gs?.selectedTower) gs.upgradeTower(gs.selectedTower); });
        this.infoTexts.push(z);
      }
    } else {
      T(PX + 14, BY1 + 8, '✅ Max Level', { fontSize: '12px', fontFamily: 'Arial Black', color: '#2ecc71' });
    }

    // ── Sell button (two-click confirm) ────────────────────────────────────
    const BY2 = BY1 + BH + 8;
    const gs  = this.scene.get('GameScene');
    if (this._sellArmedTower && gs?.selectedTower !== this._sellArmedTower) {
      this._clearSellArm();
    }
    const armed = !!this._sellArmedTower && gs?.selectedTower === this._sellArmedTower;

    this.infoGfx.fillStyle(armed ? 0xe67e22 : 0x922b21, 1);
    this.infoGfx.fillRoundedRect(BX, BY2, BW, BH, 6);
    T(PX + PW / 2, BY2 + 17, armed ? '⚠  Click again to confirm' : `💰 Sell  +${data.sellValue}g`, {
      fontSize: '13px', fontFamily: 'Arial Black', color: armed ? '#ffffff' : '#f5b7b1'
    }).setOrigin(0.5);
    const sz = this.add.zone(BX, BY2, BW, BH).setOrigin(0).setInteractive({ useHandCursor: true });
    sz.on('pointerdown', () => this._onSellClick());
    this.infoTexts.push(sz);
  }

  _onSellClick() {
    const gs = this.scene.get('GameScene');
    if (!gs?.selectedTower) return;
    if (this._sellArmedTower === gs.selectedTower) {
      this._clearSellArm();
      gs.sellTower(gs.selectedTower);
    } else {
      this._sellArmedTower = gs.selectedTower;
      if (this._sellArmedTimer) this._sellArmedTimer.remove(false);
      this._sellArmedTimer = this.time.delayedCall(3000, () => {
        this._sellArmedTower = null;
        this._sellArmedTimer = null;
        this._updateHUD();
      });
      this._updateHUD();
    }
  }

  _clearSellArm() {
    this._sellArmedTower = null;
    if (this._sellArmedTimer) { this._sellArmedTimer.remove(false); this._sellArmedTimer = null; }
  }
}
