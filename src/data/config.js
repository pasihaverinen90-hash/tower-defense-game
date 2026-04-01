// ─── Grid & Canvas ───────────────────────────────────────────────────────────
const TILE_SIZE     = 48;
const COLS          = 20;
const ROWS          = 14;
const GAME_WIDTH    = COLS * TILE_SIZE;        // 960
const GAME_HEIGHT   = ROWS * TILE_SIZE;        // 672
const UI_WIDTH      = 240;
const CANVAS_WIDTH  = GAME_WIDTH + UI_WIDTH;   // 1200
const CANVAS_HEIGHT = GAME_HEIGHT;             // 672

// ─── Path tile builder (called per-level inside GameScene) ───────────────────
function buildPathTiles(waypoints) {
  const tiles = new Set();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (a.x === b.x) {
      const minY = Math.min(a.y, b.y), maxY = Math.max(a.y, b.y);
      for (let y = minY; y <= maxY; y++)
        if (a.x >= 0 && a.x < COLS && y >= 0 && y < ROWS)
          tiles.add(`${a.x},${y}`);
    } else {
      const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
      for (let x = minX; x <= maxX; x++)
        if (x >= 0 && x < COLS && a.y >= 0 && a.y < ROWS)
          tiles.add(`${x},${a.y}`);
    }
  }
  return tiles;
}

// ─── Tower Definitions ────────────────────────────────────────────────────────
const TOWER_DEFS = {
  archer: {
    name: 'Archer',
    cost: 50,
    color: 0x2ecc71,
    projColor: 0x27ae60,
    fireRate: 700,
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
    splash: 64,
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
    slow: 0.4,
    slowDuration: 2500,
    upgrades: [
      { damage: 8,  range: 3.0, cost: 0,   slow: 0.4 },
      { damage: 15, range: 3.5, cost: 75,  slow: 0.3 },
      { damage: 25, range: 4.0, cost: 125, slow: 0.2 },
    ]
  },
  // ── Tesla — nerfed: slower fire, less damage, fewer chains ────────────────
  tesla: {
    name: 'Tesla',
    cost: 125,
    color: 0xf39c12,
    projColor: 0xfdcb6e,
    fireRate: 1900,      // was 1200
    projSpeed: 420,
    chain: 2,            // was 3
    upgrades: [
      { damage: 22, range: 3.0, cost: 0,   chain: 2 },  // was 30 / chain 3
      { damage: 38, range: 3.5, cost: 125, chain: 3 },  // was 50 / chain 4
      { damage: 58, range: 4.0, cost: 190, chain: 4 },  // was 80 / chain 5
    ]
  }
};

// ─── Enemy Definitions ────────────────────────────────────────────────────────
const ENEMY_DEFS = {
  grunt:  { name: 'Grunt',  speed: 80,  health: 80,  reward: 10, color: 0xe67e22, radius: 13 },
  runner: { name: 'Runner', speed: 160, health: 40,  reward: 15, color: 0x9b59b6, radius: 10 },
  brute:  { name: 'Brute',  speed: 50,  health: 350, reward: 30, color: 0x7f8c8d, radius: 20 },
};

// ─── Level Definitions ────────────────────────────────────────────────────────
const LEVEL_DEFS = [

  // ══════════════════════════════════════════════════════════════════════════
  // LEVEL 1 — "The S-Bend"
  // Classic S-shape. Gentle intro to all tower types.
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Level 1',
    subtitle: 'The S-Bend',
    startGold: 150,
    startLives: 20,
    waypoints: [
      { x: -1, y: 2  },
      { x: 5,  y: 2  },
      { x: 5,  y: 11 },
      { x: 14, y: 11 },
      { x: 14, y: 4  },
      { x: 20, y: 4  },
    ],
    waves: [
      /* 01 */ [{ type: 'grunt',  count: 8,  interval: 1000 }],
      /* 02 */ [{ type: 'grunt',  count: 12, interval: 900  }],
      /* 03 */ [{ type: 'grunt',  count: 8,  interval: 900  }, { type: 'runner', count: 4,  interval: 700  }],
      /* 04 */ [{ type: 'runner', count: 10, interval: 600  }],
      /* 05 */ [{ type: 'grunt',  count: 10, interval: 900  }, { type: 'brute',  count: 1,  interval: 3000 }],
      /* 06 */ [{ type: 'grunt',  count: 15, interval: 800  }],
      /* 07 */ [{ type: 'runner', count: 12, interval: 500  }, { type: 'grunt',  count: 5,  interval: 900  }],
      /* 08 */ [{ type: 'brute',  count: 3,  interval: 2000 }],
      /* 09 */ [{ type: 'grunt',  count: 10, interval: 700  }, { type: 'runner', count: 8,  interval: 500  }],
      /* 10 */ [{ type: 'brute',  count: 2,  interval: 3000 }, { type: 'runner', count: 15, interval: 400  }],
      /* 11 */ [{ type: 'grunt',  count: 20, interval: 600  }],
      /* 12 */ [{ type: 'runner', count: 20, interval: 350  }, { type: 'brute',  count: 2,  interval: 2500 }],
      /* 13 */ [{ type: 'grunt',  count: 15, interval: 600  }, { type: 'brute',  count: 3,  interval: 2000 }],
      /* 14 */ [{ type: 'runner', count: 25, interval: 300  }, { type: 'brute',  count: 4,  interval: 1800 }],
      /* 15 */ [{ type: 'grunt',  count: 20, interval: 500  }, { type: 'runner', count: 20, interval: 350  }, { type: 'brute', count: 5, interval: 2000 }],
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LEVEL 2 — "The Gauntlet"
  // Tight zigzag with 6 turns. Fewer tower spots, harder enemy mix.
  // Enemies are faster and more numerous. Bonus 25g to compensate.
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Level 2',
    subtitle: 'The Gauntlet',
    startGold: 175,
    startLives: 20,
    waypoints: [
      { x: -1, y: 1  },   // spawn top-left
      { x: 4,  y: 1  },   // right along the top
      { x: 4,  y: 8  },   // drop down
      { x: 10, y: 8  },   // right to centre
      { x: 10, y: 2  },   // back up
      { x: 16, y: 2  },   // right upper section
      { x: 16, y: 12 },   // plunge to the bottom
      { x: 20, y: 12 },   // exit bottom-right
    ],
    waves: [
      /* 01 */ [{ type: 'grunt',  count: 10, interval: 900  }],
      /* 02 */ [{ type: 'grunt',  count: 14, interval: 800  }],
      /* 03 */ [{ type: 'runner', count: 8,  interval: 550  }],
      /* 04 */ [{ type: 'grunt',  count: 10, interval: 800  }, { type: 'runner', count: 6,  interval: 550  }],
      /* 05 */ [{ type: 'brute',  count: 2,  interval: 2500 }],
      /* 06 */ [{ type: 'grunt',  count: 18, interval: 700  }],
      /* 07 */ [{ type: 'runner', count: 15, interval: 450  }, { type: 'brute',  count: 1,  interval: 2500 }],
      /* 08 */ [{ type: 'brute',  count: 4,  interval: 1800 }],
      /* 09 */ [{ type: 'grunt',  count: 20, interval: 600  }, { type: 'runner', count: 10, interval: 450  }],
      /* 10 */ [{ type: 'runner', count: 20, interval: 380  }, { type: 'brute',  count: 3,  interval: 1800 }],
      /* 11 */ [{ type: 'grunt',  count: 25, interval: 550  }],
      /* 12 */ [{ type: 'brute',  count: 5,  interval: 1600 }, { type: 'runner', count: 15, interval: 400  }],
      /* 13 */ [{ type: 'grunt',  count: 20, interval: 500  }, { type: 'brute',  count: 4,  interval: 1600 }],
      /* 14 */ [{ type: 'runner', count: 30, interval: 280  }, { type: 'brute',  count: 5,  interval: 1500 }],
      /* 15 */ [{ type: 'grunt',  count: 25, interval: 450  }, { type: 'runner', count: 25, interval: 300  }, { type: 'brute', count: 7, interval: 1500 }],
    ]
  }

];
