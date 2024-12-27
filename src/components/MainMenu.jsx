import React from 'react';

const MainMenu = ({ onStartGame, onOpenGuide }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-blue-900">
      <h1 className="text-5xl font-bold text-white mb-12 animate-pulse">
        我是架构师
      </h1>
      
      <div className="flex flex-col gap-4">
        <button
          onClick={onStartGame}
          className="px-8 py-4 text-xl text-white bg-gradient-to-r from-green-500 to-green-600 
                     rounded-lg shadow-lg hover:shadow-green-500/50 
                     transform hover:-translate-y-1 transition-all duration-200 
                     min-w-[200px] font-medium"
        >
          进入游戏
        </button>
        
        <button
          onClick={onOpenGuide}
          className="px-8 py-4 text-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 
                     rounded-lg shadow-lg hover:shadow-blue-500/50 
                     transform hover:-translate-y-1 transition-all duration-200 
                     min-w-[200px] font-medium"
        >
          游戏图鉴
        </button>
      </div>
    </div>
  );
};

export default MainMenu;