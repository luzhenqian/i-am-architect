import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import GameScene from '../scenes/GameScene';

const Game = ({ onBack }) => {
  const gameRef = useRef(null);

  useEffect(() => {
    // 创建场景类
    class CustomGameScene extends GameScene {
      constructor() {
        super();
        this.onBack = onBack;
      }
    }

    // 游戏配置
    const config = {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: window.innerWidth * window.devicePixelRatio,
      height: window.innerHeight * window.devicePixelRatio,
      backgroundColor: '#1a1a1a',
      scene: CustomGameScene,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      }
    };

    // 创建游戏实例
    const game = new Phaser.Game(config);
    gameRef.current = game;

    // 清理函数
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, [onBack]);

  return (
    <div id="game-container" className="w-full h-screen bg-gray-900">
      {/* Phaser 将在这里渲染游戏 */}
    </div>
  );
};

export default Game; 