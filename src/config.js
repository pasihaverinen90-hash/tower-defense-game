// ─── Grid & Canvas ───────────────────────────────────────────────────────────
const TILE_SIZE     = 48;
const COLS          = 20;
const ROWS          = 14;
const GAME_WIDTH    = COLS * TILE_SIZE;        // 960
const GAME_HEIGHT   = ROWS * TILE_SIZE;        // 672
const UI_WIDTH      = 240;
const CANVAS_WIDTH  = GAME_WIDTH + UI_WIDTH;   // 1200
const CANVAS_HEIGHT = GAME_HEIGHT;             // 672

// ─── Buff System ─────────────────────────────────────────────────────────────
const BUFF_MAX_PER_STAT = 3;
const BUFF_EFFECTS = {
  range:  0.5,   // +0.5 tiles per point
  speed:  0.12,  // -12% fire cooldown per point
  damage: 0.15,  // +15% base damage per point
  crit:   0.08,  // +8% crit chance per point
};

// ─── Path builders ────────────────────────────────────────────────────────────
// Builds a Set of "col,row" strings for a single waypoint array
function buildPathTiles(waypoints) {
  const tiles = new Set();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i], b = waypoints[i + 1];
    if (a.x === b.x) {
      for (let y = Math.min(a.y,b.y); y <= Math.max(a.y,b.y); y++)
        if (a.x >= 0 && a.x < COLS && y >= 0 && y < ROWS) tiles.add(`${a.x},${y}`);
    } else {
      for (let x = Math.min(a.x,b.x); x <= Math.max(a.x,b.x); x++)
        if (x >= 0 && x < COLS && a.y >= 0 && a.y < ROWS) tiles.add(`${x},${a.y}`);
    }
  }
  return tiles;
}

// Unions tile sets from all paths in a level def
function buildAllPathTiles(paths) {
  const tiles = new Set();
  paths.forEach(p => buildPathTiles(p.waypoints).forEach(t => tiles.add(t)));
  return tiles;
}

// ─── Tower Definitions ────────────────────────────────────────────────────────
const TOWER_DEFS = {
  archer: {
    name: 'Archer', cost: 50, color: 0x2ecc71, projColor: 0x27ae60,
    fireRate: 700, projSpeed: 360,
    upgrades: [
      { damage: 15, range: 3.0, cost: 0   },
      { damage: 28, range: 3.5, cost: 75  },
      { damage: 45, range: 4.0, cost: 125 },
    ]
  },
  cannon: {
    name: 'Cannon', cost: 100, color: 0xe74c3c, projColor: 0xc0392b,
    fireRate: 2000, projSpeed: 200, splash: 64,
    upgrades: [
      { damage: 60,  range: 2.5, cost: 0,   splash: 64 },
      { damage: 110, range: 3.0, cost: 100, splash: 80 },
      { damage: 180, range: 3.5, cost: 175, splash: 96 },
    ]
  },
  frost: {
    name: 'Frost', cost: 75, color: 0x3498db, projColor: 0x74b9ff,
    fireRate: 1000, projSpeed: 280, slow: 0.4, slowDuration: 2500,
    upgrades: [
      { damage: 8,  range: 3.0, cost: 0,   slow: 0.4 },
      { damage: 15, range: 3.5, cost: 75,  slow: 0.3 },
      { damage: 25, range: 4.0, cost: 125, slow: 0.2 },
    ]
  },
  tesla: {
    name: 'Tesla', cost: 125, color: 0xf39c12, projColor: 0xfdcb6e,
    fireRate: 1900, projSpeed: 420, chain: 2,
    upgrades: [
      { damage: 22, range: 3.0, cost: 0,   chain: 2 },
      { damage: 38, range: 3.5, cost: 125, chain: 3 },
      { damage: 58, range: 4.0, cost: 190, chain: 4 },
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
// Each level has a `paths` array. Single-path levels have one entry.
// Multi-path levels have multiple entries. Wave groups use `path: N` to assign
// enemies to a specific path index. Defaults to path 0 if omitted.
//
// MERGING PATHS: Two paths can share waypoints from a junction onward.
//   The path tiles union naturally handles duplicates.
//
// SEPARATE PATHS: Paths that never share tiles — enemies travel independently.
const LEVEL_DEFS = [

  // ══════════════════════════════════════════════════════════════════════════
  // LEVEL 1 — "The S-Bend"
  // Classic S-shape. Single path. Gentle intro.
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Level 1', subtitle: 'The S-Bend',
    startGold: 150, startLives: 20,
    paths: [{
      waypoints: [
        { x: -1, y: 2  }, { x: 5,  y: 2  }, { x: 5,  y: 11 },
        { x: 14, y: 11 }, { x: 14, y: 4  }, { x: 20, y: 4  },
      ]
    }],
    waves: [
      /* 01 */ [{ type: 'grunt',  count: 8,  interval: 1000, path: 0 }],
      /* 02 */ [{ type: 'grunt',  count: 12, interval: 900,  path: 0 }],
      /* 03 */ [{ type: 'grunt',  count: 8,  interval: 900,  path: 0 }, { type: 'runner', count: 4,  interval: 700,  path: 0 }],
      /* 04 */ [{ type: 'runner', count: 10, interval: 600,  path: 0 }],
      /* 05 */ [{ type: 'grunt',  count: 10, interval: 900,  path: 0 }, { type: 'brute',  count: 1,  interval: 3000, path: 0 }],
      /* 06 */ [{ type: 'grunt',  count: 15, interval: 800,  path: 0 }],
      /* 07 */ [{ type: 'runner', count: 12, interval: 500,  path: 0 }, { type: 'grunt',  count: 5,  interval: 900,  path: 0 }],
      /* 08 */ [{ type: 'brute',  count: 3,  interval: 2000, path: 0 }],
      /* 09 */ [{ type: 'grunt',  count: 10, interval: 700,  path: 0 }, { type: 'runner', count: 8,  interval: 500,  path: 0 }],
      /* 10 */ [{ type: 'brute',  count: 2,  interval: 3000, path: 0 }, { type: 'runner', count: 15, interval: 400,  path: 0 }],
      /* 11 */ [{ type: 'grunt',  count: 20, interval: 600,  path: 0 }],
      /* 12 */ [{ type: 'runner', count: 20, interval: 350,  path: 0 }, { type: 'brute',  count: 2,  interval: 2500, path: 0 }],
      /* 13 */ [{ type: 'grunt',  count: 15, interval: 600,  path: 0 }, { type: 'brute',  count: 3,  interval: 2000, path: 0 }],
      /* 14 */ [{ type: 'runner', count: 25, interval: 300,  path: 0 }, { type: 'brute',  count: 4,  interval: 1800, path: 0 }],
      /* 15 */ [{ type: 'grunt',  count: 20, interval: 500,  path: 0 }, { type: 'runner', count: 20, interval: 350,  path: 0 }, { type: 'brute', count: 5, interval: 2000, path: 0 }],
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LEVEL 2 — "The Gauntlet"
  // Tight zigzag. Single path with 6 turns.
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Level 2', subtitle: 'The Gauntlet',
    startGold: 175, startLives: 20,
    paths: [{
      waypoints: [
        { x: -1, y: 1  }, { x: 4,  y: 1  }, { x: 4,  y: 8  },
        { x: 10, y: 8  }, { x: 10, y: 2  }, { x: 16, y: 2  },
        { x: 16, y: 12 }, { x: 20, y: 12 },
      ]
    }],
    waves: [
      /* 01 */ [{ type: 'grunt',  count: 10, interval: 900,  path: 0 }],
      /* 02 */ [{ type: 'grunt',  count: 14, interval: 800,  path: 0 }],
      /* 03 */ [{ type: 'runner', count: 8,  interval: 550,  path: 0 }],
      /* 04 */ [{ type: 'grunt',  count: 10, interval: 800,  path: 0 }, { type: 'runner', count: 6,  interval: 550,  path: 0 }],
      /* 05 */ [{ type: 'brute',  count: 2,  interval: 2500, path: 0 }],
      /* 06 */ [{ type: 'grunt',  count: 18, interval: 700,  path: 0 }],
      /* 07 */ [{ type: 'runner', count: 15, interval: 450,  path: 0 }, { type: 'brute',  count: 1,  interval: 2500, path: 0 }],
      /* 08 */ [{ type: 'brute',  count: 4,  interval: 1800, path: 0 }],
      /* 09 */ [{ type: 'grunt',  count: 20, interval: 600,  path: 0 }, { type: 'runner', count: 10, interval: 450,  path: 0 }],
      /* 10 */ [{ type: 'runner', count: 20, interval: 380,  path: 0 }, { type: 'brute',  count: 3,  interval: 1800, path: 0 }],
      /* 11 */ [{ type: 'grunt',  count: 25, interval: 550,  path: 0 }],
      /* 12 */ [{ type: 'brute',  count: 5,  interval: 1600, path: 0 }, { type: 'runner', count: 15, interval: 400,  path: 0 }],
      /* 13 */ [{ type: 'grunt',  count: 20, interval: 500,  path: 0 }, { type: 'brute',  count: 4,  interval: 1600, path: 0 }],
      /* 14 */ [{ type: 'runner', count: 30, interval: 280,  path: 0 }, { type: 'brute',  count: 5,  interval: 1500, path: 0 }],
      /* 15 */ [{ type: 'grunt',  count: 25, interval: 450,  path: 0 }, { type: 'runner', count: 25, interval: 300,  path: 0 }, { type: 'brute', count: 7, interval: 1500, path: 0 }],
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LEVEL 3 — "The Crossroads"
  // TWO ENTRY POINTS that merge into one shared path.
  //   Path 0 (top):    ←entry — right along row 2 — down to junction at col 5
  //   Path 1 (bottom): ←entry — right along row 11 — up to junction at col 5
  //   Shared:          col 5 down to row 6 — right to col 13 — up to row 2 — exit right
  // Both paths share tiles from the junction onward.
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Level 3', subtitle: 'The Crossroads',
    startGold: 175, startLives: 20,
    paths: [
      // Path 0 — top entry
      { waypoints: [
        { x: -1, y: 2  }, { x: 5,  y: 2  }, { x: 5,  y: 6  },
        { x: 13, y: 6  }, { x: 13, y: 2  }, { x: 20, y: 2  },
      ]},
      // Path 1 — bottom entry (merges at the junction col 5 / row 6)
      { waypoints: [
        { x: -1, y: 11 }, { x: 5,  y: 11 }, { x: 5,  y: 6  },
        { x: 13, y: 6  }, { x: 13, y: 2  }, { x: 20, y: 2  },
      ]},
    ],
    waves: [
      /* 01 */ [{ type: 'grunt',  count: 6,  interval: 900,  path: 0 }, { type: 'grunt',  count: 6,  interval: 900,  path: 1 }],
      /* 02 */ [{ type: 'grunt',  count: 8,  interval: 850,  path: 0 }, { type: 'grunt',  count: 8,  interval: 850,  path: 1 }],
      /* 03 */ [{ type: 'runner', count: 6,  interval: 600,  path: 0 }, { type: 'grunt',  count: 8,  interval: 850,  path: 1 }],
      /* 04 */ [{ type: 'grunt',  count: 10, interval: 800,  path: 0 }, { type: 'runner', count: 8,  interval: 550,  path: 1 }],
      /* 05 */ [{ type: 'brute',  count: 1,  interval: 3000, path: 0 }, { type: 'brute',  count: 1,  interval: 3000, path: 1 }],
      /* 06 */ [{ type: 'grunt',  count: 12, interval: 750,  path: 0 }, { type: 'grunt',  count: 12, interval: 750,  path: 1 }],
      /* 07 */ [{ type: 'runner', count: 10, interval: 500,  path: 0 }, { type: 'runner', count: 10, interval: 500,  path: 1 }],
      /* 08 */ [{ type: 'brute',  count: 2,  interval: 2000, path: 0 }, { type: 'grunt',  count: 12, interval: 700,  path: 1 }],
      /* 09 */ [{ type: 'grunt',  count: 15, interval: 650,  path: 0 }, { type: 'runner', count: 10, interval: 500,  path: 1 }],
      /* 10 */ [{ type: 'runner', count: 12, interval: 450,  path: 0 }, { type: 'brute',  count: 2,  interval: 2000, path: 1 }],
      /* 11 */ [{ type: 'grunt',  count: 18, interval: 600,  path: 0 }, { type: 'grunt',  count: 18, interval: 600,  path: 1 }],
      /* 12 */ [{ type: 'brute',  count: 3,  interval: 1800, path: 0 }, { type: 'runner', count: 15, interval: 400,  path: 1 }],
      /* 13 */ [{ type: 'grunt',  count: 15, interval: 550,  path: 0 }, { type: 'brute',  count: 3,  interval: 1800, path: 1 }],
      /* 14 */ [{ type: 'runner', count: 18, interval: 350,  path: 0 }, { type: 'runner', count: 18, interval: 350,  path: 1 }],
      /* 15 */ [{ type: 'grunt',  count: 20, interval: 450,  path: 0 }, { type: 'runner', count: 15, interval: 350,  path: 1 }, { type: 'brute', count: 4, interval: 1600, path: 0 }, { type: 'brute', count: 4, interval: 1600, path: 1 }],
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LEVEL 4 — "Twin Serpents"
  // TWO COMPLETELY SEPARATE PATHS. Enemies travel both simultaneously.
  //   Path 0 (top snake):    ←entry row 2 — right to col 10 — down to row 6 — exit right
  //   Path 1 (bottom coil):  ←entry row 11 — right to col 3 — up to row 8 — right to col 16 — down — exit right
  // No shared tiles. You MUST cover both paths.
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Level 4', subtitle: 'Twin Serpents',
    startGold: 200, startLives: 20,
    paths: [
      // Path 0 — top
      { waypoints: [
        { x: -1, y: 2  }, { x: 10, y: 2  }, { x: 10, y: 6  }, { x: 20, y: 6  },
      ]},
      // Path 1 — bottom (separate)
      { waypoints: [
        { x: -1, y: 11 }, { x: 3,  y: 11 }, { x: 3,  y: 8  },
        { x: 16, y: 8  }, { x: 16, y: 11 }, { x: 20, y: 11 },
      ]},
    ],
    waves: [
      /* 01 */ [{ type: 'grunt',  count: 8,  interval: 900,  path: 0 }, { type: 'grunt',  count: 8,  interval: 900,  path: 1 }],
      /* 02 */ [{ type: 'grunt',  count: 10, interval: 800,  path: 0 }, { type: 'runner', count: 6,  interval: 600,  path: 1 }],
      /* 03 */ [{ type: 'runner', count: 8,  interval: 550,  path: 0 }, { type: 'grunt',  count: 10, interval: 800,  path: 1 }],
      /* 04 */ [{ type: 'grunt',  count: 12, interval: 750,  path: 0 }, { type: 'grunt',  count: 12, interval: 750,  path: 1 }],
      /* 05 */ [{ type: 'brute',  count: 2,  interval: 2200, path: 0 }, { type: 'runner', count: 10, interval: 500,  path: 1 }],
      /* 06 */ [{ type: 'runner', count: 12, interval: 500,  path: 0 }, { type: 'brute',  count: 2,  interval: 2200, path: 1 }],
      /* 07 */ [{ type: 'grunt',  count: 15, interval: 650,  path: 0 }, { type: 'grunt',  count: 15, interval: 650,  path: 1 }],
      /* 08 */ [{ type: 'brute',  count: 3,  interval: 1900, path: 0 }, { type: 'brute',  count: 3,  interval: 1900, path: 1 }],
      /* 09 */ [{ type: 'grunt',  count: 18, interval: 600,  path: 0 }, { type: 'runner', count: 14, interval: 420,  path: 1 }],
      /* 10 */ [{ type: 'runner', count: 15, interval: 400,  path: 0 }, { type: 'brute',  count: 3,  interval: 1800, path: 1 }],
      /* 11 */ [{ type: 'grunt',  count: 20, interval: 550,  path: 0 }, { type: 'grunt',  count: 20, interval: 550,  path: 1 }],
      /* 12 */ [{ type: 'brute',  count: 4,  interval: 1700, path: 0 }, { type: 'runner', count: 18, interval: 380,  path: 1 }],
      /* 13 */ [{ type: 'runner', count: 20, interval: 380,  path: 0 }, { type: 'brute',  count: 4,  interval: 1700, path: 1 }],
      /* 14 */ [{ type: 'grunt',  count: 20, interval: 500,  path: 0 }, { type: 'grunt',  count: 20, interval: 500,  path: 1 }, { type: 'brute', count: 3, interval: 1600, path: 0 }],
      /* 15 */ [{ type: 'grunt',  count: 20, interval: 450,  path: 0 }, { type: 'runner', count: 20, interval: 350,  path: 0 }, { type: 'brute', count: 5, interval: 1500, path: 1 }, { type: 'runner', count: 20, interval: 350, path: 1 }],
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LEVEL 5 — "The Labyrinth"
  // THREE PATHS: Two merging + one fully separate.
  //   Path 0 (top merge):    ←entry row 2  — right to col 2 — down — right to col 8 — up to row 1 — exit top-right
  //   Path 1 (bottom merge): ←entry row 11 — right to col 2 — up   — (shares col 2–8 with Path 0) — exit top-right
  //   Path 2 (lone wolf):    ←entry row 13 — right to col 5 — up to row 9 — right to col 14 — down — exit bottom-right
  // The final boss level. Three attack vectors. Nowhere to hide.
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Level 5', subtitle: 'The Labyrinth',
    startGold: 225, startLives: 20,
    paths: [
      // Path 0 — top merge entry
      { waypoints: [
        { x: -1, y: 2  }, { x: 2,  y: 2  }, { x: 2,  y: 6  },
        { x: 8,  y: 6  }, { x: 8,  y: 1  }, { x: 20, y: 1  },
      ]},
      // Path 1 — bottom merge entry (shares from junction col 2/row 6 onward)
      { waypoints: [
        { x: -1, y: 11 }, { x: 2,  y: 11 }, { x: 2,  y: 6  },
        { x: 8,  y: 6  }, { x: 8,  y: 1  }, { x: 20, y: 1  },
      ]},
      // Path 2 — completely separate middle-bottom corridor
      { waypoints: [
        { x: -1, y: 13 }, { x: 5,  y: 13 }, { x: 5,  y: 9  },
        { x: 14, y: 9  }, { x: 14, y: 13 }, { x: 20, y: 13 },
      ]},
    ],
    waves: [
      /* 01 */ [{ type: 'grunt',  count: 6,  interval: 900,  path: 0 }, { type: 'grunt',  count: 6,  interval: 900,  path: 1 }, { type: 'grunt',  count: 5,  interval: 900,  path: 2 }],
      /* 02 */ [{ type: 'grunt',  count: 8,  interval: 800,  path: 0 }, { type: 'grunt',  count: 8,  interval: 800,  path: 1 }, { type: 'runner', count: 5,  interval: 600,  path: 2 }],
      /* 03 */ [{ type: 'runner', count: 7,  interval: 580,  path: 0 }, { type: 'grunt',  count: 10, interval: 750,  path: 1 }, { type: 'grunt',  count: 8,  interval: 800,  path: 2 }],
      /* 04 */ [{ type: 'grunt',  count: 10, interval: 750,  path: 0 }, { type: 'runner', count: 8,  interval: 550,  path: 1 }, { type: 'runner', count: 7,  interval: 550,  path: 2 }],
      /* 05 */ [{ type: 'brute',  count: 1,  interval: 2500, path: 0 }, { type: 'brute',  count: 1,  interval: 2500, path: 1 }, { type: 'grunt',  count: 10, interval: 700,  path: 2 }],
      /* 06 */ [{ type: 'grunt',  count: 12, interval: 700,  path: 0 }, { type: 'grunt',  count: 12, interval: 700,  path: 1 }, { type: 'brute',  count: 1,  interval: 2500, path: 2 }],
      /* 07 */ [{ type: 'runner', count: 10, interval: 500,  path: 0 }, { type: 'runner', count: 10, interval: 500,  path: 1 }, { type: 'runner', count: 8,  interval: 500,  path: 2 }],
      /* 08 */ [{ type: 'brute',  count: 2,  interval: 2000, path: 0 }, { type: 'brute',  count: 2,  interval: 2000, path: 1 }, { type: 'brute',  count: 2,  interval: 2000, path: 2 }],
      /* 09 */ [{ type: 'grunt',  count: 15, interval: 620,  path: 0 }, { type: 'runner', count: 10, interval: 480,  path: 1 }, { type: 'grunt',  count: 12, interval: 650,  path: 2 }],
      /* 10 */ [{ type: 'runner', count: 12, interval: 430,  path: 0 }, { type: 'brute',  count: 2,  interval: 1900, path: 1 }, { type: 'runner', count: 12, interval: 430,  path: 2 }],
      /* 11 */ [{ type: 'grunt',  count: 18, interval: 580,  path: 0 }, { type: 'grunt',  count: 18, interval: 580,  path: 1 }, { type: 'grunt',  count: 15, interval: 600,  path: 2 }],
      /* 12 */ [{ type: 'brute',  count: 3,  interval: 1800, path: 0 }, { type: 'runner', count: 14, interval: 400,  path: 1 }, { type: 'brute',  count: 3,  interval: 1800, path: 2 }],
      /* 13 */ [{ type: 'grunt',  count: 18, interval: 520,  path: 0 }, { type: 'brute',  count: 3,  interval: 1700, path: 1 }, { type: 'runner', count: 18, interval: 380,  path: 2 }],
      /* 14 */ [{ type: 'runner', count: 20, interval: 360,  path: 0 }, { type: 'runner', count: 20, interval: 360,  path: 1 }, { type: 'brute',  count: 4,  interval: 1600, path: 2 }],
      /* 15 */ [{ type: 'grunt',  count: 20, interval: 430,  path: 0 }, { type: 'runner', count: 18, interval: 330,  path: 0 }, { type: 'grunt',  count: 20, interval: 430,  path: 1 }, { type: 'runner', count: 18, interval: 330, path: 1 }, { type: 'brute', count: 5, interval: 1500, path: 2 }, { type: 'runner', count: 15, interval: 350, path: 2 }],
    ]
  },

];
