import React, { useState, useEffect } from 'react';
import MainMenu from './components/MainMenu';
import Game from './components/Game';
import Guide from './components/Guide';
import Settings from './components/Settings';
import Leaderboard from './components/Leaderboard';
import CodeFixScreen from './components/CodeFixScreen';
import * as FingerprintJS from '@fingerprintjs/fingerprintjs';
import { Toaster, toast } from 'react-hot-toast';
import api from './api';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('menu');

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const autoLogin = async () => {
      // 显示优雅的加载 toast
      const loadingToast = toast.loading(
        '正在登录...',
        {
          position: 'top-center',
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }
      );

      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const visitorId = result.visitorId;

        const response = await api.autoLogin({
          fingerprint: visitorId
        });

        // 成功提示
        toast.success(
          '欢迎回来!',
          {
            id: loadingToast,
            position: 'top-center',
            duration: 2000,
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
            icon: '👋',
          }
        );

        // 登录成功后设置 loading 为 false
        setIsLoading(false);

      } catch (error) {
        // 错误提示
        toast.error(
          '进入游戏失败,请刷新重试',
          {
            id: loadingToast,
            position: 'top-center',
            duration: 3000,
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }
        );
        console.error('Auto login failed:', error);
        setIsLoading(false); // 错误时也要设置 loading 为 false
      }
    };
    autoLogin();
  }, []);

  const handleStartGame = () => {
    setCurrentScreen('game');
  };

  const handleOpenGuide = () => {
    setCurrentScreen('guide');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
  };

  const handleOpenSettings = () => {
    setCurrentScreen('settings');
  };

  const handleOpenLeaderboard = () => {
    setCurrentScreen('leaderboard');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* <CodeFixScreen
        gameState={{ difficulty: 1 }}
      /> */}
      <Toaster />

      {currentScreen === 'menu' && (
        <MainMenu
          onStartGame={handleStartGame}
          onOpenGuide={handleOpenGuide}
          onOpenSettings={handleOpenSettings}
          onOpenLeaderboard={handleOpenLeaderboard}
          isLoading={isLoading}
        />
      )}
      {currentScreen === 'game' && (
        <Game onBack={handleBackToMenu} />
      )}
      {currentScreen === 'guide' && (
        <Guide onBack={handleBackToMenu} />
      )}
      {currentScreen === 'settings' && (
        <Settings onBack={handleBackToMenu} />
      )}
      {currentScreen === 'leaderboard' && (
        <Leaderboard onBack={handleBackToMenu} />
      )}
    </div>
  );
};

export default App; 