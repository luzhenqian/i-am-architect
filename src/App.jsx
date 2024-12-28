import React, { useState } from 'react';
import MainMenu from './components/MainMenu';
import Game from './components/Game';
import Guide from './components/Guide';
import Settings from './components/Settings';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('menu');

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

  return (
    <div className="min-h-screen bg-gray-900">
      {currentScreen === 'menu' && (
        <MainMenu 
          onStartGame={handleStartGame}
          onOpenGuide={handleOpenGuide}
          onOpenSettings={handleOpenSettings}
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
    </div>
  );
};

export default App; 