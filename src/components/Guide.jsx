import React, { useState } from 'react';
import { GameConfig } from '../config/GameConfig';

const Guide = ({ onBack }) => {
  const config = new GameConfig();
  const [activeTab, setActiveTab] = useState('towers');
  const [selectedTower, setSelectedTower] = useState(null);
  const [selectedMonster, setSelectedMonster] = useState(null);

  const getColorStyle = (color) => {
    if (typeof color === 'number') {
      return { backgroundColor: `#${color.toString(16)}` };
    } else if (typeof color === 'string') {
      return { backgroundColor: color.startsWith('#') ? color : `#${color}` };
    }
    return { backgroundColor: '#666666' };
  };

  return (
    <div className="fixed inset-0 bg-gray-900 text-white overflow-y-auto overscroll-y-auto">
      <div className="relative min-h-full p-8">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 bg-green-500 hover:bg-green-600 
                     rounded-lg transition-colors duration-200 
                     flex items-center gap-2 fixed top-4 left-4 z-50"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          返回主菜单
        </button>

        <div className="max-w-6xl mx-auto pt-16">
          <h1 className="text-4xl font-bold mb-8 text-center">架构师手册</h1>

          {/* 标签切换 - 固定在顶部 */}
          <div className="sticky top-0 z-40 py-4 bg-gray-900 mb-8">
            <div className="flex justify-center">
              <button
                onClick={() => setActiveTab('towers')}
                className={`px-6 py-3 text-lg font-medium rounded-l-lg transition-colors
                          ${activeTab === 'towers'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                防御系统
              </button>
              <button
                onClick={() => setActiveTab('monsters')}
                className={`px-6 py-3 text-lg font-medium rounded-r-lg transition-colors
                          ${activeTab === 'monsters'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                威胁单位
              </button>
            </div>
          </div>

          {/* 防御塔内容 */}
          {activeTab === 'towers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {config.towerTypes.map((tower, index) => (
                <div key={index}
                  className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 
                              transition-all duration-300 transform hover:-translate-y-1
                              border border-gray-700 hover:border-green-500"
                  onClick={() => setSelectedTower(tower)}
                  onTouchStart={() => setSelectedTower(tower)}
                  onTouchEnd={() => setSelectedTower(null)}
                >
                  <div className="relative mb-4">
                    <img
                      src={tower.image}
                      alt={tower.name}
                      className="w-32 h-32 mx-auto object-contain"
                    />
                    {(!selectedTower || selectedTower.key !== tower.key) &&
                      (
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-gray-800 
                                 to-transparent"
                        ></div>
                      )}
                  </div>
                  <h3 className="text-2xl font-bold text-center mb-4">{tower.name}</h3>
                  <div className="space-y-2 text-gray-300">
                    <p className="flex justify-between">
                      <span>建造成本</span>
                      <span className="text-yellow-400">{tower.cost} 金币</span>
                    </p>
                    <p className="flex justify-between">
                      <span>攻击力</span>
                      <span className="text-red-400">{tower.attack}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>攻击速度</span>
                      <span className="text-blue-400">{tower.attackSpeed / 1000}秒</span>
                    </p>
                    <p className="flex justify-between">
                      <span>攻击范围</span>
                      <span className="text-green-400">{tower.range} 格</span>
                    </p>
                    <p className="flex justify-between">
                      <span>生命值</span>
                      <span className="text-pink-400">{tower.health}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>防御力</span>
                      <span className="text-purple-400">{tower.defense}</span>
                    </p>
                  </div>
                  <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-400">{tower.description || '暂无描述'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 怪物内容 */}
          {activeTab === 'monsters' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {config.monsterTypes.map((monster, index) => (
                <div key={index}
                  className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 
                              transition-all duration-300 transform hover:-translate-y-1
                              border border-gray-700 hover:border-red-500"
                  onClick={() => setSelectedMonster(monster)}
                  onTouchStart={() => setSelectedMonster(monster)}
                  onTouchEnd={() => setSelectedMonster(null)}
                >
                  <div className="relative mb-4">
                    <img
                      src={monster.image}
                      alt={monster.name}
                      className="w-32 h-32 mx-auto object-contain"
                    />
                    {(!selectedMonster || selectedMonster.key !== monster.key) && (
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-gray-800 to-transparent"
                      ></div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-center mb-4">{monster.name}</h3>
                  <div className="space-y-2 text-gray-300">
                    <p className="flex justify-between">
                      <span>等级</span>
                      <span className="text-yellow-400">{monster.level}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>生命值</span>
                      <span className="text-green-400">{monster.health}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>移动速度</span>
                      <span className="text-blue-400">{monster.speed}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>攻击力</span>
                      <span className="text-red-400">{monster.attack}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>防御力</span>
                      <span className="text-purple-400">{monster.defense}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>攻击速度</span>
                      <span className="text-blue-400">{monster.attackSpeed / 1000}秒</span>
                    </p>
                    <p className="flex justify-between">
                      <span>击杀奖励</span>
                      <span className="text-yellow-400">{monster.reward} 金币</span>
                    </p>
                  </div>
                  <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-400">{monster.description || '暂无描述'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Guide; 