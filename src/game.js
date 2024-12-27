import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';

let game = null;

const initGame = (container) => {
  console.log('Initializing game with container:', container);

  if (game) {
    console.log('Game already initialized');
    return game;
  }

  if (!container) {
    throw new Error('Container element is required');
  }

  const config = {
    type: Phaser.CANVAS,
    parent: container,
    width: window.innerWidth * window.devicePixelRatio,
    height: window.innerHeight * window.devicePixelRatio,
    zoom: 1 / window.devicePixelRatio,
    backgroundColor: '#2d2d2d',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    scene: [BootScene, GameScene],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: true
      }
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: true
    },
    callbacks: {
      postBoot: (game) => {
        console.log('Game post boot callback');
        console.log('Canvas created:', game.canvas);
      }
    }
  };

  try {
    game = new Phaser.Game(config);

    if (!game.canvas) {
      throw new Error('Canvas not created');
    }

    console.log('Game instance created successfully');
    console.log('Canvas element:', game.canvas);

    game.events.on('ready', () => {
      console.log('Game ready event fired');
      console.log('Current canvas:', game.canvas);
      console.log('Canvas parent:', game.canvas.parentElement);
    });

    return game;
  } catch (error) {
    console.error('Error creating game instance:', error);
    throw error;
  }
};

console.log('Phaser version:', Phaser.VERSION);

export default initGame;