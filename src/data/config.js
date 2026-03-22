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
