class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const W = CANVAS_WIDTH, H = CANVAS_HEIGHT;
    const cx = W / 2;

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1117);
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1c2a3a, 0.7);
    for (let x = 0; x < W; x += TILE_SIZE) {
      grid.beginPath(); grid.moveTo(x, 0); grid.lineTo(x, H); grid.strokePath();
    }
    for (let y = 0; y < H; y += TILE_SIZE) {
      grid.beginPath(); grid.moveTo(0, y); grid.lineTo(W, y); grid.strokePath();
    }

    // Title
    this.add.text(cx, H * 0.10, 'TOWER DEFENSE', {
      fontSize: '58px', fontFamily: 'Arial Black',
      color: '#f39c12', stroke: '#7d4a00', strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(cx, H * 0.20, 'Place towers. Survive the waves. Conquer both levels.', {
      fontSize: '16px', fontFamily: 'Arial', color: '#95a5a6'
    }).setOrigin(0.5);

    // ── Tower showcase ──────────────────────────────────────────────────────
    const towerInfo = [
      { type: 'archer', sub: '50g · Fast · Balanced' },
      { type: 'cannon', sub: '100g · Slow · Splash' },
      { type: 'frost',  sub: '75g · Slows foes' },
      { type: 'tesla',  sub: '125g · Chains x2' },
    ];
    const cardW = 185, cardH = 96;
    const tStartX = cx - (towerInfo.length * (cardW + 12)) / 2 + cardW / 2;
    const cardY   = H * 0.36;

    towerInfo.forEach((info, i) => {
      const def = TOWER_DEFS[info.type];
      const bx  = tStartX + i * (cardW + 12);
      const card = this.add.graphics();
      card.fillStyle(0x1a2233, 1);
      card.fillRoundedRect(bx - cardW / 2, cardY - cardH / 2, cardW, cardH, 8);
      card.lineStyle(1.5, def.color, 0.5);
      card.strokeRoundedRect(bx - cardW / 2, cardY - cardH / 2, cardW, cardH, 8);

      const icon = this.add.graphics();
      icon.fillStyle(0x1e272e, 1);
      icon.fillRect(bx - 20, cardY - cardH / 2 + 10, 40, 40);
      icon.fillStyle(def.color, 1);
      icon.fillRect(bx - 13, cardY - cardH / 2 + 17, 26, 26);

      this.add.text(bx, cardY + 8,  def.name, { fontSize: '14px', fontFamily: 'Arial Black', color: '#ecf0f1' }).setOrigin(0.5);
      this.add.text(bx, cardY + 28, info.sub, { fontSize: '11px', fontFamily: 'Arial',       color: '#7f8c8d' }).setOrigin(0.5);
    });

    // ── Level select ────────────────────────────────────────────────────────
    this.add.text(cx, H * 0.56, 'SELECT LEVEL', {
      fontSize: '13px', fontFamily: 'Arial Black', color: '#636e72', letterSpacing: 4
    }).setOrigin(0.5);

    const levelCards = [
      { index: 0, color: 0x27ae60, label: 'LEVEL 1', sub: 'The S-Bend', desc: '15 waves · Classic path · Beginner friendly' },
      { index: 1, color: 0x2980b9, label: 'LEVEL 2', sub: 'The Gauntlet', desc: '15 waves · Zigzag path · Harder enemy mix' },
    ];

    const lcW = 360, lcH = 100;
    const lcStartX = cx - (levelCards.length * (lcW + 20)) / 2 + lcW / 2;
    const lcY      = H * 0.70;

    levelCards.forEach((lc, i) => {
      const lx = lcStartX + i * (lcW + 20);
      const bg = this.add.graphics();

      const drawBg = (col) => {
        bg.clear();
        bg.fillStyle(col, 1);
        bg.fillRoundedRect(lx - lcW / 2, lcY - lcH / 2, lcW, lcH, 10);
        bg.lineStyle(2, lc.color, 0.8);
        bg.strokeRoundedRect(lx - lcW / 2, lcY - lcH / 2, lcW, lcH, 10);
      };
      drawBg(0x141e2b);

      // Colour bar on left edge
      const accent = this.add.graphics();
      accent.fillStyle(lc.color, 1);
      accent.fillRoundedRect(lx - lcW / 2 + 2, lcY - lcH / 2 + 2, 8, lcH - 4, 6);

      this.add.text(lx - lcW / 2 + 24, lcY - 30, lc.label,  { fontSize: '20px', fontFamily: 'Arial Black', color: '#ecf0f1' });
      this.add.text(lx - lcW / 2 + 24, lcY - 2,  lc.sub,    { fontSize: '14px', fontFamily: 'Arial Black', color: `#${lc.color.toString(16).padStart(6,'0')}` });
      this.add.text(lx - lcW / 2 + 24, lcY + 22, lc.desc,   { fontSize: '12px', fontFamily: 'Arial',       color: '#636e72' });

      const zone = this.add.zone(lx - lcW / 2, lcY - lcH / 2, lcW, lcH)
        .setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover',  () => drawBg(0x1a2d45));
      zone.on('pointerout',   () => drawBg(0x141e2b));
      zone.on('pointerdown',  () => {
        this.scene.start('GameScene', { levelIndex: lc.index });
      });
    });

    // ── Enemy legend ────────────────────────────────────────────────────────
    const enemyInfo = [
      { type: 'grunt',  sub: 'Normal · Low HP' },
      { type: 'runner', sub: 'Very fast · Fragile' },
      { type: 'brute',  sub: 'Slow · Tank HP' },
    ];
    this.add.text(cx, H * 0.86, 'ENEMIES', {
      fontSize: '12px', fontFamily: 'Arial Black', color: '#636e72', letterSpacing: 4
    }).setOrigin(0.5);

    const eStartX = cx - 200;
    enemyInfo.forEach((info, i) => {
      const def = ENEMY_DEFS[info.type];
      const ex  = eStartX + i * 200, ey = H * 0.93;
      const g   = this.add.graphics();
      g.fillStyle(def.color, 1);
      g.fillCircle(ex, ey, def.radius);
      this.add.text(ex + def.radius + 8, ey, `${def.name}  ${info.sub}`, {
        fontSize: '12px', fontFamily: 'Arial', color: '#95a5a6'
      }).setOrigin(0, 0.5);
    });
  }
}
