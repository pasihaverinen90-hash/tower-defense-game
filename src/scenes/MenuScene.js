class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const W = CANVAS_WIDTH, H = CANVAS_HEIGHT, cx = W / 2;

    // ── Background grid ────────────────────────────────────────────────────
    this.add.rectangle(cx, H / 2, W, H, 0x0d1117);
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1c2a3a, 0.7);
    for (let x = 0; x < W; x += TILE_SIZE) {
      grid.beginPath(); grid.moveTo(x, 0); grid.lineTo(x, H); grid.strokePath();
    }
    for (let y = 0; y < H; y += TILE_SIZE) {
      grid.beginPath(); grid.moveTo(0, y); grid.lineTo(W, y); grid.strokePath();
    }

    // ── Title ──────────────────────────────────────────────────────────────
    this.add.text(cx, H * 0.11, 'TOWER DEFENSE', {
      fontSize: '58px', fontFamily: 'Arial Black',
      color: '#f39c12', stroke: '#7d4a00', strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(cx, H * 0.21, 'Place towers. Survive the waves. Earn permanent buffs.', {
      fontSize: '16px', fontFamily: 'Arial', color: '#95a5a6'
    }).setOrigin(0.5);

    // ── Tower cards ────────────────────────────────────────────────────────
    const towerInfo = [
      { type: 'archer', sub: '50g · Fast · Balanced' },
      { type: 'cannon', sub: '100g · Slow · Splash' },
      { type: 'frost',  sub: '75g · Slows foes' },
      { type: 'tesla',  sub: '125g · Chains x2' },
    ];
    const cardW = 185, cardH = 90;
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
      icon.fillRect(bx - 20, cardY - cardH / 2 + 8, 40, 40);
      icon.fillStyle(def.color, 1);
      icon.fillRect(bx - 13, cardY - cardH / 2 + 15, 26, 26);

      this.add.text(bx, cardY + 8,  def.name, { fontSize: '14px', fontFamily: 'Arial Black', color: '#ecf0f1' }).setOrigin(0.5);
      this.add.text(bx, cardY + 27, info.sub,  { fontSize: '11px', fontFamily: 'Arial',       color: '#7f8c8d' }).setOrigin(0.5);
    });

    // ── Buff system preview ────────────────────────────────────────────────
    this.add.text(cx, H * 0.54, '⭐  PERMANENT BUFF SYSTEM', {
      fontSize: '13px', fontFamily: 'Arial Black', color: '#f39c12', letterSpacing: 3
    }).setOrigin(0.5);

    this.add.text(cx, H * 0.60,
      'After each level, earn 1–3 upgrade points based on lives remaining.\nSpend them on permanent buffs that carry into the next level!',
      { fontSize: '14px', fontFamily: 'Arial', color: '#95a5a6', align: 'center' }
    ).setOrigin(0.5);

    const buffCards = [
      { icon: '🎯', label: 'Range',    desc: '+0.5 tiles per point', color: 0x2ecc71 },
      { icon: '⚡', label: 'Fire Rate', desc: '-12% cooldown',        color: 0xf39c12 },
      { icon: '⚔',  label: 'Damage',   desc: '+15% base damage',     color: 0xe74c3c },
      { icon: '💥', label: 'Critical',  desc: '+8% crit chance',      color: 0x9b59b6 },
    ];
    const bcW = 220, bcH = 70;
    const bcStartX = cx - (buffCards.length * (bcW + 10)) / 2 + bcW / 2;
    const bcY = H * 0.73;

    buffCards.forEach((b, i) => {
      const bx = bcStartX + i * (bcW + 10);
      const bg = this.add.graphics();
      bg.fillStyle(0x141e2b, 1);
      bg.fillRoundedRect(bx - bcW / 2, bcY - bcH / 2, bcW, bcH, 8);
      bg.lineStyle(1.5, b.color, 0.4);
      bg.strokeRoundedRect(bx - bcW / 2, bcY - bcH / 2, bcW, bcH, 8);

      this.add.text(bx - bcW / 2 + 16, bcY - 16, b.icon,  { fontSize: '22px' });
      this.add.text(bx - bcW / 2 + 48, bcY - 18, b.label, { fontSize: '14px', fontFamily: 'Arial Black', color: '#ecf0f1' });
      this.add.text(bx - bcW / 2 + 48, bcY + 2,  b.desc,  { fontSize: '12px', fontFamily: 'Arial',       color: '#636e72' });
    });

    // ── Lives → points legend ──────────────────────────────────────────────
    this.add.text(cx, H * 0.84,
      '16–20 lives = ⭐⭐⭐    8–15 lives = ⭐⭐    1–7 lives = ⭐',
      { fontSize: '13px', fontFamily: 'Arial', color: '#636e72', align: 'center' }
    ).setOrigin(0.5);

    // ── PLAY button ────────────────────────────────────────────────────────
    const BW = 260, BH = 56, br = 12;
    const bx = cx, by = H * 0.93;
    const btnBg = this.add.graphics();

    const drawBtn = (col) => {
      btnBg.clear();
      btnBg.fillStyle(col, 1);
      btnBg.fillRoundedRect(bx - BW / 2, by - BH / 2, BW, BH, br);
    };
    drawBtn(0x27ae60);

    this.add.text(bx, by, '▶   PLAY', {
      fontSize: '26px', fontFamily: 'Arial Black', color: '#ffffff'
    }).setOrigin(0.5);

    const zone = this.add.zone(bx - BW / 2, by - BH / 2, BW, BH)
      .setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover',  () => drawBtn(0x2ecc71));
    zone.on('pointerout',   () => drawBtn(0x27ae60));
    zone.on('pointerdown',  () => {
      // Always start from Level 1 with no buffs
      this.scene.start('GameScene', { levelIndex: 0, buffs: { range: 0, speed: 0, damage: 0, crit: 0 } });
    });
  }
}
