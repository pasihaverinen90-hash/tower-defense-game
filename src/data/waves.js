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
