export class GameConfig {
  constructor() {
    this.initialGold = 200;
    this.initialHealth = 100;
    this.cellSize = 64;
    this.monsterSpawnInterval = 2500;
    this.gridSize = { rows: 7, cols: 6 };
    this.towerTypes = [
      { 
        key: 'code_warrior',
        name: '代码战士',
        image: 'assets/images/towers/code_warrior.png',
        level: 1,
        attack: 20,
        defense: 15,
        health: 100,
        maxHealth: 100,
        attackSpeed: 1,
        range: 3,
        cost: 50,
        attackType: 'single',
        effectColor: 0x00ff00,
        description: '代码战士是程序世界的基础防线"小卫士"。它像个认真负责的战士，手握简单却实用的"验证枪"，但凡有Bug冒头，立马开枪清除，守护程序初始的纯净与顺畅。',
        skill: {
          name: '代码优化',
          description: '暴击时造成双倍伤害',
          criticalChance: 0.2,
          criticalMultiplier: 2
        },
        targetStrategy: 'nearest'
      },
      { 
        key: 'algo_cannon',
        name: '算法炮台',
        image: 'assets/images/towers/algo_cannon.png',
        level: 1,
        attack: 15,
        defense: 20,
        health: 150,
        maxHealth: 150,
        attackSpeed: 0.8,
        range: 2.5,
        cost: 75,
        attackType: 'aoe',
        aoeRadius: 1.5,
        effectColor: 0xff0000,
        description: '算法炮台可是重型火力担当。算法赋予它看穿复杂难题的"火眼金睛"，面对那些棘手强大的怪物，它能精准计算、火力全开，轰碎威胁，彰显算法在守护程序安全时的超强战斗力。',
        skill: {
          name: '算法爆炸',
          description: '范围攻击时有概率眩晕敌人',
          stunChance: 0.15,
          stunDuration: 1000
        },
        targetStrategy: 'nearest'
      },
      { 
        key: 'firewall',
        name: '防火墙',
        image: 'assets/images/towers/firewall.png',
        level: 1,
        attack: 0,
        defense: 50,
        health: 300,
        maxHealth: 300,
        attackSpeed: 0,
        range: 1,
        cost: 100,
        attackType: 'none',
        description: '防火墙矗立在计算机系统的边境，犹如一座坚不可摧的钢铁堡垒。不管是来势汹汹的黑客，还是其他高级别的恶意攻击，只要撞上这堵墙，统统被挡在门外，是程序安全的定海神针。',
        skill: {
          name: '防火屏障',
          description: '阻挡敌人前进并反弹伤害',
          reflectDamage: 0.3
        },
        targetStrategy: 'nearest'
      },
      { 
        key: 'debug_fairy',
        name: '调试精灵',
        image: 'assets/images/towers/debug_fairy.png',
        level: 1,
        attack: 10,
        defense: 10,
        health: 80,
        maxHealth: 80,
        attackSpeed: 0.7,
        range: 3,
        cost: 125,
        attackType: 'heal',
        healAmount: 15,
        effectColor: 0x00ffff,
        description: '调试精灵恰似灵动的程序小天使，手持神奇"修复魔杖"。一旦发现防御系统哪里出了岔子，立马施展魔法修复程序，让整个系统稳稳当当。',
        skill: {
          name: '代码修复',
          description: '攻击敌人的同时治疗周围防御塔',
          healRadius: 3,
          healBonus: 1.5
        },
        targetStrategy: 'nearest'
      },
      { 
        key: 'ai_sniper',
        name: 'AI狙击手',
        image: 'assets/images/towers/ai_sniper.png',
        level: 1,
        attack: 50,
        defense: 8,
        health: 60,
        maxHealth: 60,
        attackSpeed: 0.4,
        range: 5,
        cost: 150,
        attackType: 'single',
        effectColor: 0xffff00,
        description: 'AI狙击手有着超敏锐的"数字直觉"，藏身于程序暗处，时刻锁定那些试图蒙混过关的新型威胁。一旦目标现身，它瞬间出击，凭借AI的智慧一击必杀，绝不让危险分子有可乘之机。',
        skill: {
          name: '精准打击',
          description: '攻击必定暴击，但攻速较慢',
          criticalMultiplier: 2.5
        },
        targetStrategy: 'strongest'
      },
      { 
        key: 'blockchain_node',
        name: '区块链节点',
        image: 'assets/images/towers/blockchain_node.png',
        level: 1,
        attack: 0,
        defense: 15,
        health: 100,
        maxHealth: 100,
        attackSpeed: 0.3,
        range: 2,
        cost: 150,
        attackType: 'mine',
        mineAmount: 10,
        effectColor: 0xffd700,
        description: '区块链节点宛如一座隐匿于数字世界的金矿开采站，它通过复杂的算法和技术，在区块链的网络中挖掘金币。',
        skill: {
          name: '区块挖矿',
          description: '定期产生金币，金币数量随等级提升',
          mineBonus: 1.2
        },
        targetStrategy: 'none'
      }
    ];
    
    this.monsterTypes = [
      {
        key: 'cyber_virus',
        name: '网络病毒',
        image: 'assets/images/monsters/cyber_virus.png',
        level: 1,
        speed: 0.5,
        attack: 15,
        defense: 2,
        health: 50,
        maxHealth: 50,
        attackSpeed: 1000,
        attackRange: 1,
        reward: 25,
        experience: 20,
        description: '在计算机那看不见硝烟的战场，病毒可是头号"大反派"。这个怪物宛如一颗数字世界的定时炸弹，所到之处，程序文件纷纷"缴械投降"，数据被腐蚀得千疮百孔，安全防线在它面前就像脆弱的纸糊栅栏。',
        skill: {
          name: '病毒感染',
          description: '攻击时降低防御塔攻击力',
          effectChance: 0.2,
          attackDebuff: 5,
          duration: 3000
        }
      },
      {
        key: 'ghost_hacker',
        name: '黑客幽灵',
        image: 'assets/images/monsters/ghost_hacker.png',
        level: 1,
        speed: 0.7,
        attack: 20,
        defense: 1,
        health: 40,
        maxHealth: 40,
        attackSpeed: 800,
        attackRange: 1.5,
        reward: 30,
        experience: 25,
        description: '想象一下，有个无形无体、来无影去无踪的家伙在程序的核心地带溜达，这就是黑客幽灵。它像是精通黑暗魔法的刺客，瞅准系统最脆弱的要害，冷不丁就狠狠刺上一刀，把程序搅得天翻���覆，让人防不胜防。',
        skill: {
          name: '系统入侵',
          description: '有概率绕过防御塔',
          bypassChance: 0.3,
          duration: 1000
        }
      },
      {
        key: 'memory_leaker',
        name: '内存泄露怪',
        image: 'assets/images/monsters/memory_leaker.png',
        level: 1,
        speed: 0.4,
        attack: 18,
        defense: 5,
        health: 75,
        maxHealth: 75,
        attackSpeed: 1200,
        attackRange: 1,
        reward: 35,
        experience: 30,
        description: '内存泄露怪就像是程序里的"慢性毒药"。它悄无声息地潜伏着，一点一滴地漏掉宝贵的内存资源，一开始没啥感觉，等回过神来，程序已经被拖得气喘吁吁、摇摇欲坠，随时面临崩溃死机的厄运。',
        skill: {
          name: '内存消耗',
          description: '降低周围防御塔的攻击速度',
          slowEffect: 0.2,
          slowRadius: 2,
          duration: 4000
        }
      },
      {
        key: 'trojan_demon',
        name: '木马恶魔',
        image: 'assets/images/monsters/trojan_demon.png',
        level: 1,
        speed: 0.6,
        attack: 25,
        defense: 3,
        health: 90,
        maxHealth: 90,
        attackSpeed: 1500,
        attackRange: 1,
        reward: 45,
        experience: 40,
        description: '木马恶魔可是伪装大师，表面人畜无害，扮成正常程序的模样，实则怀揣祸心。一旦被它蒙混过关，就会在系统内部大开杀戒，偷数据、搞破坏，把程序世界搅成混乱不堪的魔域。',
        skill: {
          name: '木马复制',
          description: '死亡时分裂成两个小木马',
          spawnHealth: 25,
          spawnAttack: 4,
          spawnSpeed: 1.4
        }
      },
      {
        key: 'web_spider',
        name: '网络爬虫',
        image: 'assets/images/monsters/web_spider.png',
        level: 1,
        speed: 0.45,
        attack: 16,
        defense: 3,
        health: 60,
        maxHealth: 60,
        attackSpeed: 900,
        attackRange: 2,
        reward: 30,
        experience: 35,
        description: '这只网络爬虫宛如盘踞在网络暗巷的"蜘蛛精"。它顺着网线，凭借对网络环境的熟稔，到处织网下套，抓取关键信息、篡改网页，把原本畅通无阻的网络世界，搅和得危机四伏。',
        skill: {
          name: '蛛网陷阱',
          description: '在防御塔之间织网，减缓攻击速度',
          webSlowEffect: 0.3,
          webDuration: 5000,
          webRadius: 2
        }
      },
      {
        key: 'binary_wizard',
        name: '01混乱巫师',
        image: 'assets/images/monsters/binary_wizard.png',
        level: 1,
        speed: 0.35,
        attack: 30,
        defense: 4,
        health: 85,
        maxHealth: 85,
        attackSpeed: 2000,
        attackRange: 3,
        reward: 50,
        experience: 50,
        description: '01混乱巫师精通诡异的二进制魔法，只需挥动手中那闪烁着0和1光芒的魔杖，就能把有序的程序代码变成一锅乱炖，让数据错乱、指令失效，让程序陷入一片混沌迷雾。',
        skill: {
          name: '二进制混乱',
          description: '使防御塔随机切换攻击目标',
          confusionChance: 0.25,
          confusionDuration: 3000,
          confusionRadius: 2.5
        }
      }
    ];

    this.levelExperience = {
      1: 100,    // 1级升2级需要100经验
      2: 200,    // 2级升3级需要200经验
      3: 350,
      4: 550,
      5: 800,
      6: 1100,
      7: 1450,
      8: 1850,
      9: 2300,
      10: 2800,
      11: 3350,
      12: 3950,
      13: 4600,
      14: 5300,
      15: 6050,   // 15级升16级需要6050经验
      // 15级之后每级所需经验增加800
      getNextLevelExp: function(currentLevel) {
        if (currentLevel <= 15) {
          return this[currentLevel] || 100;
        }
        return this[15] + (currentLevel - 15) * 800;
      }
    };
  }
} 