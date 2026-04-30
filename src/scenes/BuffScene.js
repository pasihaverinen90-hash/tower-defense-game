class BuffScene extends Phaser.Scene {
  constructor() { super({ key: 'BuffScene' }); }

  // data = { livesLeft, levelIndex, buffs }
  init(data) {
    this.livesLeft  = data.livesLeft  || 0;
    this.levelIndex = data.levelIndex || 0;
    this.buffs      = data.buffs      || { range: 0, speed: 0, damage: 0, crit: 0 };

    // Calculate points earned from lives remaining
    if (this.livesLeft >= 16)     this.totalPoints = 3;
    else if (this.livesLeft >= 8) this.totalPoints = 2;
    else                          this.totalPoints = 1;

    this.pointsLeft = this.totalPoints;

    // Working copy of buffs (will be passed to next level)
    this.pending = { ...this.buffs };
  }

  create() {
    this.input.enabled = true;
    this.input.setDefaultCursor('default');
    this._hitZones = [];
    this._contBW = 300; this._contBH = 56;
    this.input.on('pointerdown', (pointer) => {
      const x = pointer.x, y = pointer.y;
      for (const zone of this._hitZones) {
        if (x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h) {
          zone.cb();
          break;
        }
      }
    });
    this.input.on('pointermove', (pointer) => {
      if (!this.contBg) return;
      const cx2 = CANVAS_WIDTH / 2, H2 = CANVAS_HEIGHT;
      const bx = cx2 - this._contBW / 2, by = H2 - 68 - this._contBH / 2;
      const over = pointer.x >= bx && pointer.x <= bx + this._contBW &&
                   pointer.y >= by && pointer.y <= by + this._contBH;
      if (this.pointsLeft === 0) {
        this.contBg.clear();
        this._fillContBtn(over ? 0x2980b9 : 0x1e6fa5);
      }
    });
    const W = CANVAS_WIDTH, H = CANVAS_HEIGHT, cx = W / 2;

    // ── Dark overlay background ────────────────────────────────────────────
    this.add.rectangle(cx, H / 2, W, H, 0x060c12);

    // Subtle grid
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1c2a3a, 0.5);
    for (let x = 0; x < W; x += TILE_SIZE) {
      grid.beginPath(); grid.moveTo(x, 0); grid.lineTo(x, H); grid.strokePath();
    }
    for (let y = 0; y < H; y += TILE_SIZE) {
      grid.beginPath(); grid.moveTo(0, y); grid.lineTo(W, y); grid.strokePath();
    }

    // ── Header ─────────────────────────────────────────────────────────────
    const nextDef = LEVEL_DEFS[this.levelIndex + 1];

    this.add.text(cx, 40, '⭐  LEVEL COMPLETE!', {
      fontSize: '48px', fontFamily: 'Arial Black',
      color: '#f1c40f', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(cx, 100, `Up next: ${nextDef.name} — ${nextDef.subtitle}`, {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#74b9ff'
    }).setOrigin(0.5);

    // Lives & points earned
    const pointColor = this.totalPoints === 3 ? '#2ecc71' : this.totalPoints === 2 ? '#f39c12' : '#e74c3c';
    this.add.text(cx, 138, `You finished with ${this.livesLeft} lives  →`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#95a5a6'
    }).setOrigin(1, 0.5).setX(cx + 10);

    this.add.text(cx + 16, 138, `${'⭐'.repeat(this.totalPoints)} ${this.totalPoints} upgrade point${this.totalPoints > 1 ? 's' : ''}`, {
      fontSize: '16px', fontFamily: 'Arial Black', color: pointColor
    }).setOrigin(0, 0.5);

    // Divider
    const div = this.add.graphics();
    div.lineStyle(1, 0x2d3561, 1);
    div.beginPath(); div.moveTo(60, 162); div.lineTo(W - 60, 162); div.strokePath();

    // ── Points remaining display ───────────────────────────────────────────
    this.add.text(cx, 184, 'CHOOSE YOUR BUFFS', {
      fontSize: '13px', fontFamily: 'Arial Black', color: '#636e72', letterSpacing: 4
    }).setOrigin(0.5);

    this.pointsText = this.add.text(cx, 212, '', {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#f1c40f'
    }).setOrigin(0.5);

    // ── Buff cards ─────────────────────────────────────────────────────────
    this.buffDefs = [
      {
        key:   'range',
        icon:  '🎯',
        label: 'Range',
        desc:  '+0.5 tiles range per point',
        color: 0x2ecc71,
        textColor: '#2ecc71',
      },
      {
        key:   'speed',
        icon:  '⚡',
        label: 'Fire Rate',
        desc:  '-12% firing cooldown per point',
        color: 0xf39c12,
        textColor: '#f39c12',
      },
      {
        key:   'damage',
        icon:  '⚔',
        label: 'Damage',
        desc:  '+15% base damage per point',
        color: 0xe74c3c,
        textColor: '#e74c3c',
      },
      {
        key:   'crit',
        icon:  '💥',
        label: 'Critical Hit',
        desc:  '+8% crit chance (2× damage) per point',
        color: 0x9b59b6,
        textColor: '#9b59b6',
      },
    ];

    const CARD_W = 240, CARD_H = 170, GAP = 18;
    const totalW  = this.buffDefs.length * (CARD_W + GAP) - GAP;
    const startX  = cx - totalW / 2 + CARD_W / 2;
    const CARD_Y  = 380;

    this.cardObjects = {};   // key → { bg, plusBtn, minusBtn, dotsContainer }

    this.buffDefs.forEach((def, i) => {
      const bx = startX + i * (CARD_W + GAP);
      this._makeBuffCard(bx, CARD_Y, CARD_W, CARD_H, def);
    });

    // ── Continue button ────────────────────────────────────────────────────
    const contBW = 300, contBH = 56;
    this.contBg = this.add.graphics();

    this._drawContinueBtn();

    this.contText = this.add.text(cx, H - 68, '', {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#ffffff'
    }).setOrigin(0.5);

    this._hitZones.push({
      x: cx - contBW / 2, y: H - 68 - contBH / 2, w: contBW, h: contBH,
      cb: () => { if (this.pointsLeft === 0) this._continue(); }
    });

    // ── Note at bottom ─────────────────────────────────────────────────────
    this.add.text(cx, H - 22,
      'Buffs are PERMANENT and apply to all towers in the next level.',
      { fontSize: '12px', fontFamily: 'Arial', color: '#4a5568' }
    ).setOrigin(0.5);

    this._refresh();
  }

  // ─── Build one buff card ────────────────────────────────────────────────────
  _makeBuffCard(cx, cy, W, H, def) {
    const bg = this.add.graphics();

    // Static card face
    const face = this.add.graphics();
    face.fillStyle(0x141e2b, 1);
    face.fillRoundedRect(cx - W / 2, cy - H / 2, W, H, 12);

    // Coloured top bar
    face.fillStyle(def.color, 1);
    face.fillRoundedRect(cx - W / 2, cy - H / 2, W, 6, 3);

    this.add.text(cx - W / 2 + 16, cy - H / 2 + 18, def.icon, { fontSize: '28px' });
    this.add.text(cx - W / 2 + 56, cy - H / 2 + 18, def.label, {
      fontSize: '18px', fontFamily: 'Arial Black', color: def.textColor
    });
    this.add.text(cx - W / 2 + 14, cy - H / 2 + 54, def.desc, {
      fontSize: '12px', fontFamily: 'Arial', color: '#636e72',
      wordWrap: { width: W - 28 }
    });

    // Current level dots (drawn dynamically)
    const dotsY = cy + 12;
    const dotContainer = this.add.graphics();

    // – button
    const minusBg = this.add.graphics();
    this._hitZones.push({ x: cx - W / 2 + 8, y: cy + H / 2 - 44, w: 44, h: 36, cb: () => this._adjustBuff(def.key, -1) });

    // + button
    const plusBg = this.add.graphics();
    this._hitZones.push({ x: cx + W / 2 - 52, y: cy + H / 2 - 44, w: 44, h: 36, cb: () => this._adjustBuff(def.key, +1) });

    this.cardObjects[def.key] = {
      bg, dotContainer,
      minusBg, plusBg,
      cx, cy, W, H, def,
      dotsY,
    };
  }

  // ─── Adjust a buff value ────────────────────────────────────────────────────
  _adjustBuff(key, delta) {
    const current = this.pending[key];
    const newVal  = current + delta;

    if (delta > 0 && this.pointsLeft <= 0) return;   // no points left
    if (delta < 0 && current <= 0)         return;   // can't go below 0
    if (newVal > BUFF_MAX_PER_STAT)        return;   // cap per stat

    this.pending[key] += delta;
    this.pointsLeft   -= delta;
    this._refresh();
  }

  // ─── Redraw dynamic elements ────────────────────────────────────────────────
  _refresh() {
    // Points remaining text
    const pts = this.pointsLeft;
    this.pointsText.setText(
      pts === 0 ? '✅  All points spent!' : `Points remaining: ${'⭐'.repeat(pts)}  (${pts})`
    );
    this.pointsText.setColor(pts === 0 ? '#2ecc71' : '#f1c40f');

    // Each card
    Object.values(this.cardObjects).forEach(card => {
      const { key, color } = card.def;
      const val = this.pending[key];
      const cx  = card.cx, cy = card.cy, W = card.W, H = card.H;

      // Border highlight if any points spent here
      card.bg.clear();
      if (val > 0) {
        card.bg.lineStyle(2, color, 0.9);
        card.bg.strokeRoundedRect(cx - W / 2, cy - H / 2, W, H, 12);
      }

      // Dots showing current value
      card.dotContainer.clear();
      for (let d = 0; d < BUFF_MAX_PER_STAT; d++) {
        const filled = d < val;
        card.dotContainer.fillStyle(filled ? color : 0x2d3561, 1);
        card.dotContainer.fillCircle(cx - 28 + d * 20, card.dotsY, 7);
      }

      // Value text in centre
      // (re-use dotContainer for text would need separate objects; easier: use the bg)
      // We draw the numeric value next to dots instead
      card.dotContainer.fillStyle(0xecf0f1, 1);

      // Minus button
      const canMinus = val > 0;
      card.minusBg.clear();
      card.minusBg.fillStyle(canMinus ? 0x922b21 : 0x2d3436, 1);
      card.minusBg.fillRoundedRect(cx - W / 2 + 8, cy + H / 2 - 44, 44, 36, 6);
      card.minusBg.fillStyle(canMinus ? 0xffffff : 0x636e72, 1);
      // Draw minus symbol
      card.minusBg.fillRect(cx - W / 2 + 20, cy + H / 2 - 28, 20, 4);

      // Plus button
      const canPlus = this.pointsLeft > 0 && val < BUFF_MAX_PER_STAT;
      card.plusBg.clear();
      card.plusBg.fillStyle(canPlus ? 0x27ae60 : 0x2d3436, 1);
      card.plusBg.fillRoundedRect(cx + W / 2 - 52, cy + H / 2 - 44, 44, 36, 6);
      card.plusBg.fillStyle(canPlus ? 0xffffff : 0x636e72, 1);
      // Draw plus symbol
      card.plusBg.fillRect(cx + W / 2 - 40, cy + H / 2 - 28, 20, 4);
      card.plusBg.fillRect(cx + W / 2 - 32, cy + H / 2 - 36, 4, 20);
    });

    // Continue button
    this._drawContinueBtn();
  }

  _fillContBtn(col) {
    const W = CANVAS_WIDTH, H = CANVAS_HEIGHT;
    const BW = 300, BH = 56;
    this.contBg.fillStyle(col, 1);
    this.contBg.fillRoundedRect(W / 2 - BW / 2, H - 68 - BH / 2, BW, BH, 12);
    const nextName = LEVEL_DEFS[this.levelIndex + 1] ? LEVEL_DEFS[this.levelIndex + 1].name.toUpperCase() : 'NEXT LEVEL';
    const label = this.pointsLeft === 0 ? `▶▶  CONTINUE TO ${nextName}` : `Spend all ${this.totalPoints} point${this.totalPoints > 1 ? 's' : ''} to continue`;
    this.contText.setText(label);
    this.contText.setColor(this.pointsLeft === 0 ? '#ffffff' : '#636e72');
  }

  _drawContinueBtn() {
    this.contBg.clear();
    this._fillContBtn(this.pointsLeft === 0 ? 0x2980b9 : 0x1a2940);
  }

  // ─── Move to next level ─────────────────────────────────────────────────────
  _continue() {
    this.scene.start('GameScene', {
      levelIndex: this.levelIndex + 1,
      buffs:      this.pending,
    });
  }
}
