// ─── Tower Definitions ────────────────────────────────────────────────────────
const TOWER_DEFS = {
  archer: {
    name: 'Archer',
    cost: 50,
    color: 0x2ecc71,
    projColor: 0x27ae60,
    fireRate: 700,       // ms between shots
    projSpeed: 360,
    upgrades: [
      { damage: 15, range: 3.0, cost: 0   },
      { damage: 28, range: 3.5, cost: 75  },
      { damage: 45, range: 4.0, cost: 125 },
    ]
  },
  cannon: {
    name: 'Cannon',
    cost: 100,
    color: 0xe74c3c,
    projColor: 0xc0392b,
    fireRate: 2000,
    projSpeed: 200,
    splash: 64,          // splash radius in px
    upgrades: [
      { damage: 60,  range: 2.5, cost: 0,   splash: 64 },
      { damage: 110, range: 3.0, cost: 100, splash: 80 },
      { damage: 180, range: 3.5, cost: 175, splash: 96 },
    ]
  },
  frost: {
    name: 'Frost',
    cost: 75,
    color: 0x3498db,
    projColor: 0x74b9ff,
    fireRate: 1000,
    projSpeed: 280,
    slow: 0.4,           // slows enemy to 40% speed
    slowDuration: 2500,
    upgrades: [
      { damage: 8,  range: 3.0, cost: 0,   slow: 0.4 },
      { damage: 15, range: 3.5, cost: 75,  slow: 0.3 },
      { damage: 25, range: 4.0, cost: 125, slow: 0.2 },
    ]
  },
  tesla: {
    name: 'Tesla',
    cost: 125,
    color: 0xf39c12,
    projColor: 0xfdcb6e,
    fireRate: 1200,
    projSpeed: 420,
    chain: 3,            // chains to N enemies
    upgrades: [
      { damage: 30, range: 3.0, cost: 0,   chain: 3 },
      { damage: 50, range: 3.5, cost: 125, chain: 4 },
      { damage: 80, range: 4.0, cost: 200, chain: 5 },
    ]
  }
};
