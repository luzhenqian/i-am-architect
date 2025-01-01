import { BaseConfig } from './BaseConfig';

export class TowerConfig extends BaseConfig {
  constructor() {
    super();
    this.towerTypes = [
      {
        key: 'code_warrior',
        name: '代码战士',
        image: 'assets/images/towers/code_warrior.png',
        level: 1,
        attack: 15,
        defense: 15,
        health: 100,
        maxHealth: 100,
        attackSpeed: 0.8,
        range: 2,
        cost: 70,
        attackType: 'single',
        effectColor: 0x00ff00,
        description: '代码战士是程序世界的基础防线"小卫士"。它像个认真负责的战士，手握简单却实用的"验证枪"，但凡有Bug冒头，立马开枪清除，守护程序初始的纯净与顺畅。',
        criticalChance: 0.15,
        criticalMultiplier: 1.5,
        skill: {
          name: '代码重构',
          description: '连续攻击同一目标时，伤害增加。',
          damageIncrement: 5
        },
        targetStrategy: 'nearest'
      },
      {
        key: 'algo_cannon',
        name: '算法炮台',
        image: 'assets/images/towers/algo_cannon.png',
        level: 1,
        attack: 25,
        defense: 20,
        health: 150,
        maxHealth: 150,
        attackSpeed: 0.5,
        range: 2.5,
        cost: 150,
        attackType: 'aoe',
        aoeRadius: 1.5,
        effectColor: 0xff0000,
        description: '算法炮台可是重型火力担当。算法赋予它看穿复杂难题的"火眼金睛"，面对那些棘手强大的怪物，它能精准计算、火力全开，轰碎威胁，彰显算法在守护程序安全时的超强战斗力。',
        criticalChance: 0.1,
        criticalMultiplier: 2,
        skill: {
          name: '递归轰炸',
          description: '范围攻击时，对每个目标进行多次攻击，每次攻击伤害递减。',
          spreadRange: 1.2,
          spreadTimes: 3,
          damageDecay: 0.7
        },
        targetStrategy: 'nearest'
      },
      {
        key: 'firewall',
        name: '防火墙卫士',
        image: 'assets/images/towers/firewall.png',
        level: 1,
        attack: 0,
        defense: 40,
        health: 300,
        maxHealth: 300,
        attackSpeed: 0,
        range: 1,
        cost: 100,
        attackType: 'none',
        description: '防火墙矗立在计算机系统的边境，犹如一座坚不可摧的钢铁堡垒。不管是来势汹汹的黑客，还是其他高级别的恶意攻击，只要撞上这堵墙，统统被挡在门外，是程序安全的定海神针。',
        criticalChance: 0.05,
        criticalMultiplier: 1.3,
        skill: {
          name: '安全协议',
          description: '被动技能：损失一定比例的生命值后，开启反伤护盾，反弹伤害。',
          shieldRatio: 0.5,
          reflectDamage: 0.4
        },
        targetStrategy: 'nearest'
      },
      {
        key: 'debug_fairy',
        name: '调试精灵',
        image: 'assets/images/towers/debug_fairy.png',
        level: 1,
        attack: 15,
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
        criticalChance: 0.2,
        criticalMultiplier: 1.8,
        skill: {
          name: '系统修复',
          description: '治疗周围防御塔。',
          healCount: 1
        },
        targetStrategy: 'nearest'
      },
      {
        key: 'ai_sniper',
        name: 'AI狙击手',
        image: 'assets/images/towers/ai_sniper.png',
        level: 1,
        attack: 40,
        defense: 8,
        health: 60,
        maxHealth: 60,
        attackSpeed: 0.15,
        range: 5,
        cost: 150,
        attackType: 'single',
        effectColor: 0xffff00,
        description: 'AI狙击手有着超敏锐的"数字直觉"，藏身于程序暗处，时刻锁定那些试图蒙混过关的新型威胁。一旦目标现身，它瞬间出击，凭借AI的智慧一击必杀，绝不让危险分子有可乘之机。',
        criticalChance: 0.25,
        criticalMultiplier: 2.5,
        skill: {
          name: '精准狙击',
          description: '攻击时获得 1 层"狙击"效果，5 层后的下一次攻击造成 2 倍伤害。',
          damageIncrementRatio: 2,// 伤害增加倍数
          maxShots: 5, // 最大层数
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
        criticalChance: 0.12,
        criticalMultiplier: 1.6,
        skill: {
          name: '智能挖矿',
          description: '持续产生金币，场上区块节点越多，金币产生速度越快。',
          mineSpeed: 1.2,
          mineCount: 1
        },
        targetStrategy: 'none'
      },
      {
        key: 'syntax_parser',
        name: '语法解析器',
        image: 'assets/images/towers/syntax_parser.png',
        level: 1,
        attack: 20,
        defense: 12,
        health: 90,
        maxHealth: 90,
        attackSpeed: 0.3,
        range: 3,
        cost: 175,
        attackType: 'syntax',
        effectColor: 0x4B0082,
        description: '语法解析器是代码世界的语法守护者，能识别并纠正各种语法错误。它使用不同的编程符号进行攻击：{}进行代码块包围，()捕获目标，减速敌人;终止进程，//注释掉bug，=赋予减益效果。',
        criticalChance: 0.18,
        criticalMultiplier: 1.7,
        skill: {
          name: '语法检查器',
          description: '使用语法符号对目标进行攻击，不同符号产生不同效果。',
          syntaxEffects: {
            '{}': {
              type: 'block',
              // 伤害倍数
              damageRatio: 0.5,
              radius: 1.5, // 范围
            },     // 代码块包围，造成范围伤害
            '()': {
              type: 'catch',
              duration: 2, // 减速时间，单位秒
              speedRatio: 0.6, // 减速比例
            },    // 减速敌人
            ';': {
              type: 'terminate',
              damageRatio: 2, // 伤害倍数
            },// 进程终止，高额单体伤害
            '//': {
              type: 'comment',
              // 概率
              probability: 0.01,
            },   // 注释，直接秒杀
            '=': {
              type: 'assign',
              defenseRatio: 0.6, //  减少防御比例
              duration: 2, // 持续时间，单位秒
            },     // 赋值，施加持续减益
            // 每个符号的概率
            probabilitys: {
              '{}': 0.4,
              '()': 0.2,
              ';': 0.2,
              '//': 0.19,
              '=': 0.01,
            }
          },
          maxSyntax: 3,
          compileBonus: 1.5  // 语法组合时效果提升50%
        },
        targetStrategy: 'highest_error'  // 优先攻击最危险的目标
      }
    ];
  }

  getTowerByKey(key) {
    return this.towerTypes.find(tower => tower.key === key);
  }

  getTowerCost(key) {
    const tower = this.getTowerByKey(key);
    return tower ? tower.cost : 0;
  }
} 