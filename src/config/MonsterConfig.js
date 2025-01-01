import { BaseConfig } from './BaseConfig';

export class MonsterConfig extends BaseConfig {
  constructor() {
    super();

    this.monsterTypes = [
      {
        key: 'cyber_virus',
        name: '网络病毒',
        image: 'assets/images/monsters/cyber_virus.png',
        level: 1,
        speed: 0.6,
        attack: 10,
        defense: 2,
        health: 40,
        maxHealth: 50,
        attackSpeed: 1000,
        attackRange: 1,
        reward: 10,
        experience: 25,
        description: '在计算机那看不见硝烟的战场，病毒可是头号"大反派"。这个怪物宛如一颗数字世界的定时炸弹，所到之处，程序文件纷纷"缴械投降"，数据被腐蚀得千疮百孔，安全防线在它面前就像脆弱的纸糊栅栏。',
        skill: {
          name: '病毒感染',
          description: '攻击时降低防御塔攻击力',
          effectChance: 0.15,
          attackDebuff: 3,
          duration: 3000
        }
      },
      {
        key: 'ghost_hacker',
        name: '黑客幽灵',
        image: 'assets/images/monsters/ghost_hacker.png',
        level: 1,
        speed: 0.8,
        attack: 15,
        defense: 1,
        health: 35,
        maxHealth: 40,
        attackSpeed: 800,
        attackRange: 1.5,
        reward: 15,
        experience: 30,
        description: '想象一下，有个无形无体、来无影去无踪的家伙在程序的核心地带溜达，这就是黑客幽灵。它像是精通黑暗魔法的刺客，瞅准系统最脆弱的要害，冷不丁就狠狠刺上一刀，把程序搅得天翻地覆，让人防不胜防。',
        skill: {
          name: '系统入侵',
          description: '有概率绕过防御塔',
          bypassChance: 0.2,
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
        reward: 25,
        experience: 40,
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
        reward: 30,
        experience: 50,
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
        reward: 20,
        experience: 45,
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
        reward: 35,
        experience: 60,
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
  }

  getMonsterByKey(key) {
    return this.monsterTypes.find(monster => monster.key === key);
  }
} 