// 主要的场景类结构
src/
  scenes/
    GameScene.js         // 主场景类,负责组织和协调其他模块
    managers/         
      TowerManager.js    // 防御塔管理
      MonsterManager.js  // 怪物管理  
      UIManager.js       // UI界面管理
      EffectManager.js   // 特效管理
      CodeBlockManager.js // 代码块管理
      DialogManager.js    // 对话框管理
    
  systems/
    CombatSystem.js     // 战斗系统
    WaveSystem.js       // 波次系统
    ProgressSystem.js   // 进度系统
    
  entities/
    Tower.js            // 防御塔实体
    Monster.js          // 怪物实体
    CodeBlock.js        // 代码块实体