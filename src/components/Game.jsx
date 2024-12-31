import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import GameScene from '../scenes/GameScene';

const Game = ({ onBack }) => {
  const gameRef = useRef(null);

  useEffect(() => {
    // 获取实际可见视口的大小
    const getViewportSize = () => {
      // 使用 window.innerHeight 来获取实际可见高度
      const height = window.innerHeight * window.devicePixelRatio;
      const width = (window.visualViewport?.width || document.documentElement.clientWidth) * window.devicePixelRatio;

      return { width, height };
    };

    const viewport = getViewportSize();

    // 创建场景类
    class CustomGameScene extends GameScene {
      constructor() {
        super();
      }

      init() {
        this.onBack = onBack;
      }
    }

    // 游戏配置
    const config = {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: viewport.width,
      height: viewport.height,
      backgroundColor: '#1a1a1a',
      scene: [CustomGameScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
    };

    // 创建游戏实例
    const game = new Phaser.Game(config);
    gameRef.current = game;

    // 处理屏幕旋转或视口大小变化
    const handleResize = () => {
      const newSize = getViewportSize();
      game.scale.resize(newSize.width, newSize.height);
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
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