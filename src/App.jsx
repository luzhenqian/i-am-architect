import React, { useState } from 'react';
import MainMenu from './components/MainMenu';
import Game from './components/Game';
import Guide from './components/Guide';

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

  return (
    <div className="min-h-screen bg-gray-900">
      {currentScreen === 'menu' && (
        <MainMenu 
          onStartGame={handleStartGame}
          onOpenGuide={handleOpenGuide}
        />
      )}
      {currentScreen === 'game' && (
        <Game onBack={handleBackToMenu} />
      )}
      {currentScreen === 'guide' && (
        <Guide onBack={handleBackToMenu} />
      )}
    </div>
  );
};

export default App; 