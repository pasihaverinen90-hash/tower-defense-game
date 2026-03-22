class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────
  create() {
    const PX = GAME_WIDTH;  // panel left edge (960)
    const PW = UI_WIDTH;    // panel width (240)
    this.PX = PX;
    this.PW = PW;

    // Panel background
    const panel = this.add.graphics();
    panel.fillStyle(0x0d1117, 1);
    panel.fillRect(PX, 0, PW, CANVAS_HEIGHT);
    panel.lineStyle(2, 0x2d3561, 1);
    panel.beginPath(); panel.moveTo(PX, 0); panel.lineTo(PX, CANVAS_HEIGHT); panel.strokePath();

    // Section containers for dynamic content
    this.infoGfx  = this.add.graphics();
    this.infoTexts = [];  // text objects for tower info, cleared on each update

    this._createStaticUI();
    this._createTowerShop();
    this._createSkipButton();
    this._createOverlays();

    // Listen for changes pushed from GameScene
    this.registry.events.on('changedata', () => this._updateHUD(), this);
    this._updateHUD();

    this.input.setDefaultCursor('default');
  }

  // ─── Static HUD text labels & stat fields ──────────────────────────────────
  _createStaticUI() {
    const PX = this.PX;
    const PW = this.PW;
    const cx = PX + PW / 2;

    // ── Stat rows ─────────────────────────────────────────────────────────────
    const rowStyle = { fontSize: '11px', fontFamily: 'Arial', color: '#636e72' };
    const valStyle = { fontSize: '20px', fontFamily: 'Arial Black', color: '#ecf0f1' };

    this.add.text(PX + 14, 12, '💰 GOLD',  rowStyle);
    this.add.text(PX + 14, 42, '❤️ LIVES', rowStyle);
    this.add.text(PX + 14, 72, '🌊 WAVE',  rowStyle);

    this.goldText  = this.add.text(PX + 85, 8,  '150', valStyle);
    this.livesText = this.add.text(PX + 85, 38, '20',  valStyle);
    this.waveText  = this.add.text(PX + 85, 68, '0/15',valStyle);

    // countdown bar background
    this.countdownBg = this.add.graphics();
    this.countdownBg.fillStyle(0x1c2a3a, 1);
    this.countdownBg.fillRect(PX + 8, 100, PW - 16, 14);

    this.countdownBar  = this.add.graphics();
    this.countdownText = this.add.text(cx, 107, '', {
      fontSize: '11px', fontFamily: 'Arial', color: '#95a5a6', align: 'center'
    }).setOrigin(0.5);

    // Divider
    const div = this.add.graphics();
    div.lineStyle(1, 0x2d3561, 1);
    div.beginPath(); div.moveTo(PX + 8, 122); div.lineTo(PX + PW - 8, 122); div.strokePath();

    this.add.text(cx, 130, 'TOWERS', {
      fontSize: '12px', fontFamily: 'Arial Black', color: '#636e72', letterSpacing: 3
    }).setOrigin(0.5);
  }

  // ─── Tower shop (4 buttons) ────────────────────────────────────────────────
  _createTowerShop() {
    const PX = this.PX, PW = this.PW;
    const BH = 62, GAP = 6;
    const SHOP_TYPES = ['archer', 'cannon', 'frost', 'tesla'];
    const TYPE_LABELS = {
      archer: 'Fast · Balanced',
      cannon: 'Slow · Splash',
      frost:  'Medium · Slows',
      tesla:  'Med · Chains x3',
    };

    this.shopButtons = {};
    SHOP_TYPES.forEach((type, i) => {
      const def = TOWER_DEFS[type];
      const bx  = PX + 8;
      const by  = 148 + i * (BH + GAP);
      const bw  = PW - 16;

      const bg = this.add.graphics();
      const draw = (col) => {
        bg.clear();
        bg.fillStyle(col, 1);
        bg.fillRoundedRect(bx, by, bw, BH, 7);
        bg.lineStyle(1.5, def.color, 0.4);
        bg.strokeRoundedRect(bx, by, bw, BH, 7);
      };
      draw(0x141e2b);

      // Mini tower icon
      const icon = this.add.graphics();
      icon.fillStyle(0x1e272e, 1);
      icon.fillRect(bx + 8, by + 9, 44, 44);
      icon.fillStyle(def.color, 1);
      icon.fillRect(bx + 16, by + 17, 28, 28);
      icon.fillStyle(0xffffff, 0.12);
      icon.fillRect(bx + 16, by + 17, 28, 10);

      this.add.text(bx + 62, by + 8,  def.name,           { fontSize: '15px', fontFamily: 'Arial Black', color: '#ecf0f1' });
      this.add.text(bx + 62, by + 28, `${def.cost}g`,     { fontSize: '13px', fontFamily: 'Arial',       color: '#f1c40f' });
      this.add.text(bx + 62, by + 44, TYPE_LABELS[type],  { fontSize: '11px', fontFamily: 'Arial',       color: '#636e72' });

      const zone = this.add.zone(bx, by, bw, BH).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover',  () => { if (this.registry.get('selectedTowerType') !== type) draw(0x1e2d40); });
      zone.on('pointerout',   () => { if (this.registry.get('selectedTowerType') !== type) draw(0x141e2b); });
      zone.on('pointerdown',  () => this._onShopClick(type));

      this.shopButtons[type] = { bg, draw, bx, by, bw, BH, def };
    });
  }

  _onShopClick(type) {
    const current = this.registry.get('selectedTowerType');
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) return;

    // Reset all shop buttons
    Object.values(this.shopButtons).forEach(b => b.draw(0x141e2b));

    if (current === type) {
      // Deselect
      this.registry.set('selectedTowerType', null);
      gameScene.selectedTowerType = null;
      gameScene.selectTower(null);
    } else {
      // Select new type, highlight button
      const b = this.shopButtons[type];
      b.draw(0x1a3d5c);
      this.registry.set('selectedTowerType', type);
      gameScene.selectedTowerType = type;
      gameScene.selectTower(null);
    }
  }

  // ─── Skip Wave button ───────────────────────────────────────────────────────
  _createSkipButton() {
    const PX = this.PX, PW = this.PW;
    const bx = PX + 8, by = CANVAS_HEIGHT - 54, bw = PW - 16, bh = 40;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a2940, 1);
    bg.fillRoundedRect(bx, by, bw, bh, 7);
    bg.lineStyle(1.5, 0x2d3561, 1);
    bg.strokeRoundedRect(bx, by, bw, bh, 7);

    this.add.text(PX + PW / 2, by + 20, '⏭  Skip Wave', {
      fontSize: '14px', fontFamily: 'Arial Black', color: '#74b9ff'
    }).setOrigin(0.5);

    const zone = this.add.zone(bx, by, bw, bh).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      const gs = this.scene.get('GameScene');
      if (gs) gs.skipToNextWave();
    });
  }

  // ─── Game Over / Win overlays ───────────────────────────────────────────────
  _createOverlays() {
    const W = CANVAS_WIDTH, H = CANVAS_HEIGHT;
    const cx = W / 2, cy = H / 2;

    this.gameOverOverlay = this._makeOverlay(cx, cy, '💀 GAME OVER', '#e74c3c', 'The enemies broke through!');
    this.gameWonOverlay  = this._makeOverlay(cx, cy, '🏆 VICTORY!',  '#f1c40f', 'You survived all 15 waves!');
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

    const restartTxt = this.add.text(0, 90, '▶  PLAY AGAIN', {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#ffffff',
      backgroundColor: '#27ae60', padding: { x: 24, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartTxt.on('pointerover',  () => restartTxt.setStyle({ backgroundColor: '#2ecc71' }));
    restartTxt.on('pointerout',   () => restartTxt.setStyle({ backgroundColor: '#27ae60' }));
    restartTxt.on('pointerdown',  () => {
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    container.add([dim, titleTxt, subTxt, restartTxt]);
    return container;
  }

  // ─── HUD update ────────────────────────────────────────────────────────────
  _updateHUD() {
    const gold        = this.registry.get('gold')          ?? 150;
    const lives       = this.registry.get('lives')         ?? 20;
    const wave        = this.registry.get('wave')          ?? 0;
    const total       = this.registry.get('totalWaves')    ?? 15;
    const waveActive  = this.registry.get('waveActive')    ?? false;
    const countdown   = this.registry.get('waveCountdown') ?? 0;
    const gameOver    = this.registry.get('gameOver')      ?? false;
    const gameWon     = this.registry.get('gameWon')       ?? false;
    const selTower    = this.registry.get('selectedTower');

    this.goldText.setText(gold);
    this.livesText.setText(lives);
    this.waveText.setText(`${wave}/${total}`);
    this.livesText.setColor(lives <= 5 ? '#e74c3c' : '#ecf0f1');

    // Countdown bar
    this.countdownBar.clear();
    if (!waveActive && wave < total) {
      const maxCD = wave === 0 ? 6000 : 22000;
      const ratio  = Math.min(1, countdown / maxCD);
      const bx = this.PX + 8, bw = this.PW - 16;
      this.countdownBar.fillStyle(0x2d6a9f, 1);
      this.countdownBar.fillRect(bx, 100, bw * ratio, 14);
      const secs = Math.ceil(countdown / 1000);
      this.countdownText.setText(waveActive ? '' : `Next wave in ${secs}s`);
    } else if (waveActive) {
      this.countdownText.setText('Wave active!');
    } else {
      this.countdownText.setText('');
    }

    // Tower info panel
    this._updateTowerInfo(selTower, gold);

    // Overlays
    if (gameOver) this.gameOverOverlay.setVisible(true);
    if (gameWon)  this.gameWonOverlay.setVisible(true);
  }

  // ─── Selected tower info (dynamic) ─────────────────────────────────────────
  _updateTowerInfo(data, gold) {
    // Clear previous info
    this.infoGfx.clear();
    this.infoTexts.forEach(t => t.destroy());
    this.infoTexts = [];

    if (!data) return;

    const PX = this.PX, PW = this.PW;
    const def  = TOWER_DEFS[data.type];
    const TOP  = 460;  // top of info panel

    // Divider
    this.infoGfx.lineStyle(1, 0x2d3561, 1);
    this.infoGfx.beginPath();
    this.infoGfx.moveTo(PX + 8, TOP - 10);
    this.infoGfx.lineTo(PX + PW - 8, TOP - 10);
    this.infoGfx.strokePath();

    // Colour dot + name
    this.infoGfx.fillStyle(def.color, 1);
    this.infoGfx.fillCircle(PX + 18, TOP + 10, 7);

    const T = (x, y, text, style) => {
      const obj = this.add.text(x, y, text, style);
      this.infoTexts.push(obj);
      return obj;
    };

    T(PX + 32, TOP,     `${def.name}  Lv${data.level + 1}`,           { fontSize: '15px', fontFamily: 'Arial Black', color: '#ecf0f1' });
    T(PX + 14, TOP + 24, `⚔  Dmg: ${data.damage}`,                    { fontSize: '12px', fontFamily: 'Arial', color: '#dfe6e9' });
    T(PX + 14, TOP + 40, `🎯 Range: ${(data.range / TILE_SIZE).toFixed(1)} tiles`, { fontSize: '12px', fontFamily: 'Arial', color: '#dfe6e9' });

    // Upgrade button
    const BX = PX + 8, BW = PW - 16, BY1 = TOP + 62, BH = 34;
    if (data.canUpgrade) {
      const canAfford = gold >= data.upgradeCost;
      this.infoGfx.fillStyle(canAfford ? 0x27ae60 : 0x2d3561, 1);
      this.infoGfx.fillRoundedRect(BX, BY1, BW, BH, 6);

      T(PX + PW / 2, BY1 + 17, `⬆  Upgrade  ${data.upgradeCost}g`, {
        fontSize: '13px', fontFamily: 'Arial Black',
        color: canAfford ? '#ffffff' : '#636e72'
      }).setOrigin(0.5);

      if (canAfford) {
        const zone = this.add.zone(BX, BY1, BW, BH).setOrigin(0).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => {
          const gs = this.scene.get('GameScene');
          if (gs && gs.selectedTower) gs.upgradeTower(gs.selectedTower);
        });
        this.infoTexts.push(zone);
      }
    } else {
      T(PX + 14, BY1 + 8, '✅ Max Level Reached', { fontSize: '12px', fontFamily: 'Arial Black', color: '#2ecc71' });
    }

    // Sell button
    const BY2 = BY1 + BH + 8;
    this.infoGfx.fillStyle(0x922b21, 1);
    this.infoGfx.fillRoundedRect(BX, BY2, BW, BH, 6);
    T(PX + PW / 2, BY2 + 17, `💰 Sell  +${data.sellValue}g`, {
      fontSize: '13px', fontFamily: 'Arial Black', color: '#f5b7b1'
    }).setOrigin(0.5);

    const sellZone = this.add.zone(BX, BY2, BW, BH).setOrigin(0).setInteractive({ useHandCursor: true });
    sellZone.on('pointerdown', () => {
      const gs = this.scene.get('GameScene');
      if (gs && gs.selectedTower) gs.sellTower(gs.selectedTower);
    });
    this.infoTexts.push(sellZone);
  }
}
