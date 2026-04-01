class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  create() {
    const PX = GAME_WIDTH;
    const PW = UI_WIDTH;
    this.PX = PX;
    this.PW = PW;

    const panel = this.add.graphics();
    panel.fillStyle(0x0d1117, 1);
    panel.fillRect(PX, 0, PW, CANVAS_HEIGHT);
    panel.lineStyle(2, 0x2d3561, 1);
    panel.beginPath(); panel.moveTo(PX, 0); panel.lineTo(PX, CANVAS_HEIGHT); panel.strokePath();

    this.infoGfx   = this.add.graphics();
    this.infoTexts = [];

    this._createStaticUI();
    this._createTowerShop();
    this._createSkipButton();
    this._createOverlays();

    this.registry.events.on('changedata', () => this._updateHUD(), this);
    this._updateHUD();

    this.input.setDefaultCursor('default');
  }

  // ─── Static HUD ────────────────────────────────────────────────────────────
  _createStaticUI() {
    const PX = this.PX, PW = this.PW, cx = PX + PW / 2;

    const rowStyle = { fontSize: '11px', fontFamily: 'Arial', color: '#636e72' };
    const valStyle = { fontSize: '20px', fontFamily: 'Arial Black', color: '#ecf0f1' };

    this.add.text(PX + 14, 12, '💰 GOLD',  rowStyle);
    this.add.text(PX + 14, 42, '❤️ LIVES', rowStyle);
    this.add.text(PX + 14, 72, '🌊 WAVE',  rowStyle);

    this.goldText  = this.add.text(PX + 85, 8,  '150', valStyle);
    this.livesText = this.add.text(PX + 85, 38, '20',  valStyle);
    this.waveText  = this.add.text(PX + 85, 68, '0/15',valStyle);

    // Level name banner
    this.levelNameText = this.add.text(cx, 94, '', {
      fontSize: '11px', fontFamily: 'Arial Black',
      color: '#f39c12', letterSpacing: 1
    }).setOrigin(0.5);

    // Countdown bar
    this.countdownBg = this.add.graphics();
    this.countdownBg.fillStyle(0x1c2a3a, 1);
    this.countdownBg.fillRect(PX + 8, 108, PW - 16, 12);

    this.countdownBar  = this.add.graphics();
    this.countdownText = this.add.text(cx, 114, '', {
      fontSize: '11px', fontFamily: 'Arial', color: '#95a5a6', align: 'center'
    }).setOrigin(0.5);

    const div = this.add.graphics();
    div.lineStyle(1, 0x2d3561, 1);
    div.beginPath(); div.moveTo(PX + 8, 128); div.lineTo(PX + PW - 8, 128); div.strokePath();

    this.add.text(cx, 136, 'TOWERS', {
      fontSize: '12px', fontFamily: 'Arial Black', color: '#636e72', letterSpacing: 3
    }).setOrigin(0.5);
  }

  // ─── Tower shop ────────────────────────────────────────────────────────────
  _createTowerShop() {
    const PX = this.PX, PW = this.PW;
    const BH = 62, GAP = 6;
    const SHOP_TYPES  = ['archer', 'cannon', 'frost', 'tesla'];
    const TYPE_LABELS = {
      archer: 'Fast · Balanced',
      cannon: 'Slow · Splash',
      frost:  'Medium · Slows',
      tesla:  'Slow · Chains x2',   // updated label to reflect nerf
    };

    this.shopButtons = {};
    SHOP_TYPES.forEach((type, i) => {
      const def = TOWER_DEFS[type];
      const bx  = PX + 8;
      const by  = 152 + i * (BH + GAP);
      const bw  = PW - 16;

      const bg   = this.add.graphics();
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
      icon.fillRect(bx + 8, by + 9, 44, 44);
      this.add.image(bx + 30, by + 31, `tower_${type}`)
        .setDisplaySize(36, 36);

      this.add.text(bx + 62, by + 8,  def.name,           { fontSize: '15px', fontFamily: 'Arial Black', color: '#ecf0f1' });
      this.add.text(bx + 62, by + 28, `${def.cost}g`,     { fontSize: '13px', fontFamily: 'Arial',       color: '#f1c40f' });
      this.add.text(bx + 62, by + 44, TYPE_LABELS[type],  { fontSize: '11px', fontFamily: 'Arial',       color: '#636e72' });

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

  // ─── Skip button ───────────────────────────────────────────────────────────
  _createSkipButton() {
    const PX = this.PX, PW = this.PW;
    const bx = PX + 8, by = CANVAS_HEIGHT - 54, bw = PW - 16, bh = 40;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a2940, 1);
    bg.fillRoundedRect(bx, by, bw, bh, 7);
    bg.lineStyle(1.5, 0x2d3561, 1);
    bg.strokeRoundedRect(bx, by, bw, bh, 7);

    this.add.text(this.PX + this.PW / 2, by + 20, '⏭  Skip Wave', {
      fontSize: '14px', fontFamily: 'Arial Black', color: '#74b9ff'
    }).setOrigin(0.5);

    const zone = this.add.zone(bx, by, bw, bh).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      const gs = this.scene.get('GameScene');
      if (gs) gs.skipToNextWave();
    });
  }

  // ─── Overlays (Game Over, Level Complete, Victory) ─────────────────────────
  _createOverlays() {
    const W = CANVAS_WIDTH, H = CANVAS_HEIGHT;
    const cx = W / 2, cy = H / 2;

    this.gameOverOverlay    = this._makeEndOverlay(cx, cy, '💀 GAME OVER',  '#e74c3c', 'The enemies broke through!', false);
    this.levelCompleteOverlay = this._makeLevelCompleteOverlay(cx, cy);
    this.gameWonOverlay     = this._makeEndOverlay(cx, cy, '🏆 VICTORY!',   '#f1c40f', 'You conquered both levels!', false);

    this.gameOverOverlay.setVisible(false);
    this.levelCompleteOverlay.setVisible(false);
    this.gameWonOverlay.setVisible(false);
  }

  _makeEndOverlay(cx, cy, title, titleColor, subtitle, hasNext) {
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

    restartTxt.on('pointerover', () => restartTxt.setStyle({ backgroundColor: '#2ecc71' }));
    restartTxt.on('pointerout',  () => restartTxt.setStyle({ backgroundColor: '#27ae60' }));
    restartTxt.on('pointerdown', () => {
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    container.add([dim, titleTxt, subTxt, restartTxt]);
    return container;
  }

  _makeLevelCompleteOverlay(cx, cy) {
    const W = CANVAS_WIDTH;
    const container = this.add.container(cx, -40);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRoundedRect(-280, -38, 560, 76, 10);
    bg.lineStyle(2, 0xf1c40f, 0.8);
    bg.strokeRoundedRect(-280, -38, 560, 76, 10);

    const titleTxt = this.add.text(-160, 0, '⭐  LEVEL COMPLETE!', {
      fontSize: '26px', fontFamily: 'Arial Black', color: '#f1c40f',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0, 0.5);

    this.levelCompleteCountdownTxt = this.add.text(180, 0, '', {
      fontSize: '18px', fontFamily: 'Arial', color: '#95a5a6',
    }).setOrigin(0, 0.5);

    container.add([bg, titleTxt, this.levelCompleteCountdownTxt]);
    return container;
  }

  // ─── HUD update ─────────────────────────────────────────────────────────────
  _updateHUD() {
    const gold          = this.registry.get('gold')          ?? 150;
    const lives         = this.registry.get('lives')         ?? 20;
    const wave          = this.registry.get('wave')          ?? 0;
    const total         = this.registry.get('totalWaves')    ?? 15;
    const waveActive    = this.registry.get('waveActive')    ?? false;
    const countdown     = this.registry.get('waveCountdown') ?? 0;
    const levelIndex    = this.registry.get('levelIndex')    ?? 0;
    const levelName     = this.registry.get('levelName')     ?? '';
    const levelSubtitle = this.registry.get('levelSubtitle') ?? '';
    const gameOver      = this.registry.get('gameOver')      ?? false;
    const levelComplete = this.registry.get('levelComplete') ?? false;
    const gameWon       = this.registry.get('gameWon')       ?? false;
    const selTower      = this.registry.get('selectedTower');

    this.goldText.setText(gold);
    this.livesText.setText(lives);
    this.waveText.setText(`${wave}/${total}`);
    this.livesText.setColor(lives <= 5 ? '#e74c3c' : '#ecf0f1');
    this.levelNameText.setText(`${levelName}  ·  ${levelSubtitle}`);

    // Countdown bar
    this.countdownBar.clear();
    if (!waveActive && wave < total) {
      const maxCD = wave === 0 ? 6000 : 22000;
      const ratio  = Math.min(1, countdown / maxCD);
      const bx = this.PX + 8, bw = this.PW - 16;
      this.countdownBar.fillStyle(0x2d6a9f, 1);
      this.countdownBar.fillRect(bx, 108, bw * ratio, 12);
      this.countdownText.setText(`Next wave in ${Math.ceil(countdown / 1000)}s`);
    } else if (waveActive) {
      this.countdownText.setText('Wave active!');
    } else {
      this.countdownText.setText('');
    }

    this._updateTowerInfo(selTower, gold);

    // Show correct overlay
    if (levelComplete) {
      this.levelCompleteOverlay.setVisible(true);
      const remaining = this.registry.get('nextLevelCountdown') ?? 4000;
      if (this.levelCompleteCountdownTxt) {
        this.levelCompleteCountdownTxt.setText(`Next level in ${Math.ceil(remaining / 1000)}s`);
      }
    }
    if (gameOver) this.gameOverOverlay.setVisible(true);
    if (gameWon)  this.gameWonOverlay.setVisible(true);
  }

  // ─── Tower info panel ───────────────────────────────────────────────────────
  _updateTowerInfo(data, gold) {
    this.infoGfx.clear();
    this.infoTexts.forEach(t => t.destroy());
    this.infoTexts = [];

    if (!data) return;

    const PX  = this.PX, PW = this.PW;
    const def = TOWER_DEFS[data.type];
    const TOP = 466;

    this.infoGfx.lineStyle(1, 0x2d3561, 1);
    this.infoGfx.beginPath();
    this.infoGfx.moveTo(PX + 8, TOP - 10);
    this.infoGfx.lineTo(PX + PW - 8, TOP - 10);
    this.infoGfx.strokePath();

    this.infoGfx.fillStyle(def.color, 1);
    this.infoGfx.fillCircle(PX + 18, TOP + 10, 7);

    const T = (x, y, text, style) => {
      const obj = this.add.text(x, y, text, style);
      this.infoTexts.push(obj);
      return obj;
    };

    T(PX + 32, TOP,     `${def.name}  Lv${data.level + 1}`,                        { fontSize: '15px', fontFamily: 'Arial Black', color: '#ecf0f1' });
    T(PX + 14, TOP + 24, `⚔  Dmg: ${data.damage}`,                                 { fontSize: '12px', fontFamily: 'Arial', color: '#dfe6e9' });
    T(PX + 14, TOP + 40, `🎯 Range: ${(data.range / TILE_SIZE).toFixed(1)} tiles`,  { fontSize: '12px', fontFamily: 'Arial', color: '#dfe6e9' });

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
