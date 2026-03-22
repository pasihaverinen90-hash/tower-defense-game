// ─── Grid & Canvas ───────────────────────────────────────────────────────────
const TILE_SIZE   = 48;
const COLS        = 20;
const ROWS        = 14;
const GAME_WIDTH  = COLS * TILE_SIZE;        // 960
const GAME_HEIGHT = ROWS * TILE_SIZE;        // 672
const UI_WIDTH    = 240;
const CANVAS_WIDTH  = GAME_WIDTH + UI_WIDTH; // 1200
const CANVAS_HEIGHT = GAME_HEIGHT;           // 672

// ─── Path Waypoints (tile coords) ────────────────────────────────────────────
// Enemies travel from left to right in an S-shape
const PATH_WAYPOINTS = [
  { x: -1, y: 2  },   // spawn (off-screen left)
  { x: 5,  y: 2  },   // first corner
  { x: 5,  y: 11 },   // turn down
  { x: 14, y: 11 },   // turn right
  { x: 14, y: 4  },   // turn up
  { x: 20, y: 4  },   // exit (off-screen right)
];

// Build a Set of "col,row" strings marking path tiles (for blocking tower placement)
function buildPathTiles(waypoints) {
  const tiles = new Set();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (a.x === b.x) {
      const minY = Math.min(a.y, b.y);
      const maxY = Math.max(a.y, b.y);
      for (let y = minY; y <= maxY; y++) {
        if (a.x >= 0 && a.x < COLS && y >= 0 && y < ROWS)
          tiles.add(`${a.x},${y}`);
      }
    } else {
      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      for (let x = minX; x <= maxX; x++) {
        if (x >= 0 && x < COLS && a.y >= 0 && a.y < ROWS)
          tiles.add(`${x},${a.y}`);
      }
    }
  }
  return tiles;
}
const PATH_TILES = buildPathTiles(PATH_WAYPOINTS);

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

// ─── Enemy Definitions ────────────────────────────────────────────────────────
const ENEMY_DEFS = {
  grunt:  { name: 'Grunt',  speed: 80,  health: 80,  reward: 10, color: 0xe67e22, radius: 13 },
  runner: { name: 'Runner', speed: 160, health: 40,  reward: 15, color: 0x9b59b6, radius: 10 },
  brute:  { name: 'Brute',  speed: 50,  health: 350, reward: 30, color: 0x7f8c8d, radius: 20 },
};

// ─── Wave Definitions ─────────────────────────────────────────────────────────
// Each wave = array of { type, count, interval(ms between spawns) }
const WAVE_DEFS = [
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
];
