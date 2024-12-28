import React from 'react';

const MainMenu = ({ onStartGame, onOpenGuide, onOpenSettings }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen 
                    bg-gradient-to-br from-gray-900/90 to-blue-900/90
                    relative">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/assets/images/cover.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <h1 className="text-6xl font-bold text-white text-center mb-16">
          我是架构师
        </h1>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={onStartGame}
            className="px-5 py-2.5 text-base text-white bg-green-500 
                     rounded shadow-[0_6px_0_0] shadow-green-700
                     hover:shadow-[0_0px_0_0] hover:translate-y-[6px]
                     transition-all duration-150 ease-in-out
                     min-w-[140px] font-medium"
          >
            进入游戏
          </button>
          
          <button
            onClick={onOpenGuide}
            className="px-5 py-2.5 text-base text-white bg-blue-500 
                     rounded shadow-[0_6px_0_0] shadow-blue-700
                     hover:shadow-[0_0px_0_0] hover:translate-y-[6px]
                     transition-all duration-150 ease-in-out
                     min-w-[140px] font-medium"
          >
            游戏图鉴
          </button>
          
          <button
            onClick={onOpenSettings}
            className="px-5 py-2.5 text-base text-white bg-purple-500 
                     rounded shadow-[0_6px_0_0] shadow-purple-700
                     hover:shadow-[0_0px_0_0] hover:translate-y-[6px]
                     transition-all duration-150 ease-in-out
                     min-w-[140px] font-medium"
          >
            设置
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;