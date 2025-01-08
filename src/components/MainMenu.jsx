import React, { useEffect, useState } from 'react';

const MainMenu = ({ onStartGame, onOpenGuide, onOpenSettings, onOpenLeaderboard, isLoading }) => {
  const buttonBaseClass = `
    px-6 py-4 text-lg text-white font-medium
    rounded-xl min-w-[160px]
    shadow-[0_4px_0_0] 
    active:shadow-[0_0px_0_0] active:translate-y-[4px]
    transition-all duration-100
    border border-white/20
    backdrop-blur-sm
  `;

  return (
    <>
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
          <img
            src="/assets/images/game-title.png"
            alt="我是架构师"
            className="mb-40 w-72 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
          />

          {/* 只在非加载状态下显示按钮 */}
          {!isLoading && (
            <div className="flex flex-col gap-6">
              <button
                onClick={onStartGame}
                className={`
                  ${buttonBaseClass}
                  bg-gradient-to-r from-green-500 to-emerald-600
                  shadow-green-700/50
                  active:from-green-600 active:to-emerald-700
                  glow-green-500/30
                `}
              >
                进入游戏
              </button>

              <button
                onClick={onOpenLeaderboard}
                className={`
                  ${buttonBaseClass}
                  bg-gradient-to-r from-yellow-500 to-amber-600
                  shadow-yellow-700/50
                  active:from-yellow-600 active:to-amber-700
                  glow-yellow-500/30
                `}
              >
                排行榜
              </button>

              <button
                onClick={onOpenGuide}
                className={`
                  ${buttonBaseClass}
                  bg-gradient-to-r from-blue-500 to-cyan-600
                  shadow-blue-700/50
                  active:from-blue-600 active:to-cyan-700
                  glow-blue-500/30
                `}
              >
                游戏图鉴
              </button>

              <button
                onClick={onOpenSettings}
                className={`
                  ${buttonBaseClass}
                  bg-gradient-to-r from-purple-500 to-fuchsia-600
                  shadow-purple-700/50
                  active:from-purple-600 active:to-fuchsia-700
                  glow-purple-500/30
                `}
              >
                设置
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MainMenu;