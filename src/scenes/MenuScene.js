class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const W = CANVAS_WIDTH;
    const H = CANVAS_HEIGHT;

    // ── Background ──────────────────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1117);

    // Subtle grid lines
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1c2a3a, 0.7);
    for (let x = 0; x < W; x += TILE_SIZE) {
      grid.beginPath(); grid.moveTo(x, 0); grid.lineTo(x, H); grid.strokePath();
    }
    for (let y = 0; y < H; y += TILE_SIZE) {
      grid.beginPath(); grid.moveTo(0, y); grid.lineTo(W, y); grid.strokePath();
    }

    // ── Title ───────────────────────────────────────────────────────────────
    this.add.text(W / 2, H * 0.18, 'TOWER DEFENSE', {
      fontSize: '58px', fontFamily: 'Arial Black', fontStyle: 'bold',
      color: '#f39c12', stroke: '#7d4a00', strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.29, 'Survive 15 waves. Place towers. Protect the realm.', {
      fontSize: '17px', fontFamily: 'Arial', color: '#95a5a6'
    }).setOrigin(0.5);

    // ── Tower Showcase ──────────────────────────────────────────────────────
    const towerInfo = [
      { type: 'archer', label: 'ARCHER',  sub: '50g  · Fast · Balanced' },
      { type: 'cannon', label: 'CANNON',  sub: '100g · Slow · Splash dmg' },
      { type: 'frost',  label: 'FROST',   sub: '75g  · Medium · Slows foes' },
      { type: 'tesla',  label: 'TESLA',   sub: '125g · Medium · Chains hits' },
    ];

    const cardW  = 200;
    const cardH  = 130;
    const startX = W / 2 - (towerInfo.length * (cardW + 16)) / 2 + cardW / 2;
    const cardY  = H * 0.53;

    towerInfo.forEach((info, i) => {
      const def = TOWER_DEFS[info.type];
      const cx  = startX + i * (cardW + 16);

      // Card background
      const card = this.add.graphics();
      card.fillStyle(0x1a2233, 1);
      card.fillRoundedRect(cx - cardW / 2, cardY - cardH / 2, cardW, cardH, 10);
      card.lineStyle(2, def.color, 0.6);
      card.strokeRoundedRect(cx - cardW / 2, cardY - cardH / 2, cardW, cardH, 10);

      // Tower icon (mini)
      const iconGfx = this.add.graphics();
      iconGfx.fillStyle(0x1e272e, 1);
      iconGfx.fillRect(cx - 22, cardY - cardH / 2 + 14, 44, 44);
      iconGfx.fillStyle(def.color, 1);
      iconGfx.fillRect(cx - 14, cardY - cardH / 2 + 22, 28, 28);

      this.add.text(cx, cardY + 12, info.label, {
        fontSize: '15px', fontFamily: 'Arial Black', color: '#ecf0f1'
      }).setOrigin(0.5);

      this.add.text(cx, cardY + 36, info.sub, {
        fontSize: '12px', fontFamily: 'Arial', color: '#7f8c8d'
      }).setOrigin(0.5);
    });

    // ── Enemy types legend ───────────────────────────────────────────────────
    const enemyInfo = [
      { type: 'grunt',  label: 'Grunt',  sub: 'Normal speed · Low HP' },
      { type: 'runner', label: 'Runner', sub: 'Very fast · Fragile' },
      { type: 'brute',  label: 'Brute',  sub: 'Slow · Tank HP' },
    ];

    this.add.text(W / 2, H * 0.74, 'ENEMIES', {
      fontSize: '13px', fontFamily: 'Arial Black', color: '#636e72', letterSpacing: 4
    }).setOrigin(0.5);

    const eStartX = W / 2 - 200;
    enemyInfo.forEach((info, i) => {
      const def = ENEMY_DEFS[info.type];
      const ex  = eStartX + i * 200;
      const ey  = H * 0.83;
      const g   = this.add.graphics();
      g.fillStyle(def.color, 1);
      g.fillCircle(ex, ey, def.radius);
      this.add.text(ex + def.radius + 10, ey, `${info.label}\n${info.sub}`, {
        fontSize: '12px', fontFamily: 'Arial', color: '#95a5a6'
      }).setOrigin(0, 0.5);
    });

    // ── Start button ─────────────────────────────────────────────────────────
    this._makeButton(W / 2, H * 0.93, '▶  START GAME', 0x27ae60, 0x2ecc71, () => {
      this.scene.start('GameScene');
    });

    this.input.setDefaultCursor('default');
  }

  _makeButton(cx, cy, label, colorNorm, colorHover, cb) {
    const bw = 220, bh = 48, r = 10;
    const bg = this.add.graphics();

    const draw = (col) => {
      bg.clear();
      bg.fillStyle(col, 1);
      bg.fillRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, r);
    };
    draw(colorNorm);

    const txt = this.add.text(cx, cy, label, {
      fontSize: '20px', fontFamily: 'Arial Black', color: '#ffffff'
    }).setOrigin(0.5);

    const zone = this.add.zone(cx - bw / 2, cy - bh / 2, bw, bh).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover',  () => draw(colorHover));
    zone.on('pointerout',   () => draw(colorNorm));
    zone.on('pointerdown',  cb);
  }
}
