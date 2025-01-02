import React, { useState } from 'react';

const Settings = ({ onBack }) => {
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [language, setLanguage] = useState('zh');
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [isChattyMode, setIsChattyMode] = useState(false);
  const [isDevMode, setIsDevMode] = useState(true);

  return (
    <div className="fixed inset-0 bg-gray-900 text-white overflow-y-auto">
      <div className="relative min-h-full p-8">
        <button
          onClick={onBack}
          className="fixed top-4 left-4 z-50 p-2 text-white hover:text-green-500 transition-colors"
        >
          <svg
            className="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="max-w-2xl mx-auto pt-16">
          <h1 className="text-4xl font-bold mb-8 text-center">游戏设置</h1>

          <div className="space-y-8 bg-gray-800 p-6 rounded-xl">
            {/* 声音设置 */}
            <div className="flex items-center justify-between">
              <label className="text-xl">游戏音效</label>
              <button
                onClick={() => setIsSoundOn(!isSoundOn)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                           ${isSoundOn ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                             ${isSoundOn ? 'translate-x-7' : 'translate-x-1'}`}
                />
              </button>
            </div>

            {/* 音乐设置 */}
            <div className="flex items-center justify-between">
              <label className="text-xl">游戏音乐</label>
              <button
                onClick={() => setIsMusicOn(!isMusicOn)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                           ${isMusicOn ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                             ${isMusicOn ? 'translate-x-7' : 'translate-x-1'}`}
                />
              </button>
            </div>

            {/* 话唠模式 */}
            <div className="flex items-center justify-between">
              <label className="text-xl">话唠模式</label>
              <button
                onClick={() => setIsChattyMode(!isChattyMode)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                           ${isChattyMode ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                             ${isChattyMode ? 'translate-x-7' : 'translate-x-1'}`}
                />
              </button>
            </div>

            {/* 程序员模式 */}
            <div className="flex items-center justify-between">
              <label className="text-xl">程序员模式</label>
              <button
                onClick={() => setIsDevMode(!isDevMode)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                           ${isDevMode ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                             ${isDevMode ? 'translate-x-7' : 'translate-x-1'}`}
                />
              </button>
            </div>

            {/* 语言设置 */}
            <div className="flex items-center justify-between">
              <label className="text-xl">游戏语言</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="zh">简体中文</option>
                <option value="en">English</option>
                <option value="jp">日本語</option>
                <option value="ko">한국어</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 