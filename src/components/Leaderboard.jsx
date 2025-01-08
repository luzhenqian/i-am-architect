import React, { useState } from 'react';

const Leaderboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('weekly');
  
  // 生成随机头像URL的辅助函数
  const getRandomAvatar = (seed) => {
    const randomColor = Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}&backgroundColor=${randomColor}`;
  };

  // 随机昵称生成辅助函数
  const getRandomName = () => {
    const chineseFirstNames = ['小', '大', '老', '阿', '天', '云', '风', '火', '水', '地'];
    const chineseLastNames = ['白', '黑', '红', '黄', '张', '王', '李', '刘', '陈', '杨'];
    const chineseTitles = ['架构师', '程序员', '工程师', '攻城狮', '大神', '高手', '专家', '大佬', '菜鸟', '小白'];
    
    const englishPrefixes = ['Pro', 'Cool', 'Super', 'Mega', 'Ultra', 'Epic', 'Elite', 'Master', 'Expert', 'Noob'];
    const englishWords = ['Coder', 'Dev', 'Hacker', 'Ninja', 'Wizard', 'Guru', 'Boss', 'King', 'Lord', 'Hero'];
    
    // 50% 概率生成中文昵称，50% 概率生成英文昵称
    if (Math.random() < 0.5) {
      // 生成中文昵称
      const patterns = [
        // 模式1：小张架构师
        () => chineseFirstNames[Math.floor(Math.random() * chineseFirstNames.length)] +
              chineseLastNames[Math.floor(Math.random() * chineseLastNames.length)] +
              chineseTitles[Math.floor(Math.random() * chineseTitles.length)],
        // 模式2：架构师小张
        () => chineseTitles[Math.floor(Math.random() * chineseTitles.length)] +
              chineseFirstNames[Math.floor(Math.random() * chineseFirstNames.length)] +
              chineseLastNames[Math.floor(Math.random() * chineseLastNames.length)],
        // 模式3：小张_架构师
        () => chineseFirstNames[Math.floor(Math.random() * chineseFirstNames.length)] +
              chineseLastNames[Math.floor(Math.random() * chineseLastNames.length)] +
              '_' +
              chineseTitles[Math.floor(Math.random() * chineseTitles.length)]
      ];
      return patterns[Math.floor(Math.random() * patterns.length)]();
    } else {
      // 生成英文昵称
      const patterns = [
        // 模式1：ProCoder
        () => englishPrefixes[Math.floor(Math.random() * englishPrefixes.length)] +
              englishWords[Math.floor(Math.random() * englishWords.length)],
        // 模式2：Pro_Coder
        () => englishPrefixes[Math.floor(Math.random() * englishPrefixes.length)] +
              '_' +
              englishWords[Math.floor(Math.random() * englishWords.length)],
        // 模式3：Pro.Coder
        () => englishPrefixes[Math.floor(Math.random() * englishPrefixes.length)] +
              '.' +
              englishWords[Math.floor(Math.random() * englishWords.length)]
      ];
      return patterns[Math.floor(Math.random() * patterns.length)]();
    }
  };
  
  // 生成模拟数据的辅助函数
  const generateMockData = (count, isWeekly) => {
    // 先生成未排序的数据
    const data = Array.from({ length: count }, (_, i) => ({
      name: getRandomName(),
      waves: Math.floor(isWeekly ? 
        (50 - i * 0.3 + Math.random() * 2) : 
        (100 - i * 0.5 + Math.random() * 3)
      ),
      level: Math.floor(isWeekly ? 
        (50 - i * 0.2 + Math.random() * 5) : 
        (100 - i * 0.5 + Math.random() * 10)
      ),
      avatar: getRandomAvatar(`${isWeekly ? 'weekly' : 'alltime'}-${i}`)
    }));

    // 根据波数排序并添加排名
    return data
      .sort((a, b) => b.waves - a.waves)  // 波数降序排序
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));
  };

  // 模拟排行榜数据
  const leaderboardData = {
    weekly: generateMockData(100, true),
    allTime: generateMockData(100, false)
  };

  return (
    <div className="fixed inset-0 bg-gray-900 text-white overflow-hidden flex flex-col">
      {/* 返回按钮和标题区域 */}
      <div className="flex-none p-4 border-b border-gray-800">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-50 p-2 text-white hover:text-green-500 transition-colors"
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
        <h1 className="text-4xl font-bold text-center py-2">排行榜</h1>
      </div>

      {/* 标签切换 */}
      <div className="flex-none sticky top-0 z-40 bg-gray-900 border-b border-gray-800">
        <div className="flex justify-center p-4">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-6 py-3 text-lg font-medium rounded-l-lg transition-colors
                      ${activeTab === 'weekly'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            本周榜单
          </button>
          <button
            onClick={() => setActiveTab('allTime')}
            className={`px-6 py-3 text-lg font-medium rounded-r-lg transition-colors
                      ${activeTab === 'allTime'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            总榜
          </button>
        </div>
      </div>

      {/* 排行榜列表 */}
      <div className="flex-grow overflow-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-3">
          {leaderboardData[activeTab].map((player, index) => (
            <div
              key={index}
              className={`bg-gray-800 rounded-xl p-4 flex items-center space-x-4
                         transform transition-all duration-300 hover:-translate-y-1 hover:bg-gray-750
                         ${index < 3 ? 'border-2 border-yellow-500/50' : 'border border-gray-700'}`}
            >
              <div className={`text-2xl font-bold w-12 text-center
                            ${index === 0 ? 'text-yellow-400' :
                  index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                #{player.rank}
              </div>
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                <img
                  src={player.avatar}
                  alt={player.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex-grow min-w-0">
                <div className="font-bold truncate">{player.name}</div>
                <div className="text-sm text-gray-400">等级 {player.level}</div>
              </div>
              <div className="text-xl font-bold text-yellow-400 flex-shrink-0">
                第 {player.waves} 波
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard; 