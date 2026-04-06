const config = {
  type: Phaser.CANVAS,
  width:  CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: '#0d1117',
  scene: [MenuScene, BuffScene, GameScene, UIScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  fps: {
    target: 60,
    forceSetTimeOut: true,
  },
};

new Phaser.Game(config);
