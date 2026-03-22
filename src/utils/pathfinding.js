// ─── Pathfinding Utilities ────────────────────────────────────────────────────

/**
 * Converts PATH_WAYPOINTS (tile coordinates) to pixel-space coordinates
 * @param {Array} waypoints - Array of waypoints in tile coordinates
 * @returns {Array} Waypoints converted to pixel coordinates
 */
function convertPathToPixels(waypoints, tileSize) {
  return waypoints.map(wp => ({
    x: wp.x * tileSize + tileSize / 2,
    y: wp.y * tileSize + tileSize / 2,
  }));
}

/**
 * Calculates distance between two points
 * @param {Number} x1 - First x coordinate
 * @param {Number} y1 - First y coordinate
 * @param {Number} x2 - Second x coordinate
 * @param {Number} y2 - Second y coordinate
 * @returns {Number} Distance between points
 */
function distanceBetween(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Calculates the angle between two points
 * @param {Number} x1 - First x coordinate
 * @param {Number} y1 - First y coordinate
 * @param {Number} x2 - Second x coordinate
 * @param {Number} y2 - Second y coordinate
 * @returns {Number} Angle in radians
 */
function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}
