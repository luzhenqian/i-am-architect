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
  }

  getTowerByKey(key) {
    return this.towerTypes.find(tower => tower.key === key);
  }

  getTowerCost(key) {
    const tower = this.getTowerByKey(key);
    return tower ? tower.cost : 0;
  }
} 