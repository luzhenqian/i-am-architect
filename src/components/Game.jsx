import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import GameScene from '../scenes/GameScene';

const Game = ({ onBack }) => {
  const gameRef = useRef(null);

  useEffect(() => {
    // 获取实际可见视口的大小
    const getViewportSize = () => {
      // 使用 visualViewport API 获取实际可见区域大小
      if (window.visualViewport) {
        return {
          width: window.visualViewport.width * window.devicePixelRatio,
          height: window.visualViewport.height * window.devicePixelRatio
        };
      }
      
      // 回退方案：使用 clientWidth/clientHeight
      return {
        width: document.documentElement.clientWidth * window.devicePixelRatio,
        height: document.documentElement.clientHeight * window.devicePixelRatio
      };
    };

    const viewport = getViewportSize();

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
      width: viewport.width,
      height: viewport.height,
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