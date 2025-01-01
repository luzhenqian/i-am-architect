import { BaseConfig } from './BaseConfig';

export class PlayerSkillConfig extends BaseConfig {
  constructor(towerTypes) {
    super();
    this.towerTypes = towerTypes;
    this.rarities = {
      JUNIOR: {
        key: 'JUNIOR',
        name: '初级工程师',
        color: '#A0A0A0',
        multiplier: 1,
        probability: 0.4
      },
      INTERMEDIATE: {
        key: 'INTERMEDIATE',
        name: '中级工程师',
        color: '#4CAF50',
        multiplier: 1.2,
        probability: 0.3
      },
      SENIOR: {
        key: 'SENIOR',
        name: '高级工程师',
        color: '#2196F3',
        multiplier: 1.5,
        probability: 0.15
      },
      EXPERT: {
        key: 'EXPERT',
        name: '技术专家',
        color: '#9C27B0',
        multiplier: 2,
        probability: 0.1
      },
      ARCHITECT: {
        key: 'ARCHITECT',
        name: '架构师',
        color: '#FFD700',
        multiplier: 3,
        probability: 0.05
      }
    };
    this.playerSkills = [];
    this.initializeSkills();
  }

  initializeSkills() {
    // 基础属性提升技能
    this.generateAttributeSkills();
    // 特殊效果技能
    this.generateSpecialSkills();
  }

  generateAttributeSkills() {
    const attributes = [
      {
        key: 'attack',
        name: '执行效率',
        baseIncrement: 5,
        description: '提升防御塔的基础伤害，就像优化代码执行效率一样',
        rarity: 'JUNIOR',
        icon: 'assets/images/skills/attributes/execution_efficiency.png'
      },
      {
        key: 'defense',
        name: '异常处理',
        baseIncrement: 3,
        description: '提升防御塔的抗伤能力，像完善的try-catch机制',
        rarity: 'INTERMEDIATE',
        icon: 'assets/images/skills/attributes/exception_handling.png'
      },
      {
        key: 'health',
        name: '内存容量',
        baseIncrement: 20,
        description: '提升防御塔的生命值，就像扩展程序的内存空间',
        rarity: 'JUNIOR',
        icon: 'assets/images/skills/attributes/memory_capacity.png'
      },
      {
        key: 'attackSpeed',
        name: '处理频率',
        baseIncrement: 0.1,
        description: '提升防御塔的攻击速度，如同提高CPU时钟频率',
        rarity: 'SENIOR',
        icon: 'assets/images/skills/attributes/processing_frequency.png'
      },
      {
        key: 'range',
        name: '作用域',
        baseIncrement: 0.2,
        description: '扩大防御塔的攻击范围，像扩展变量的作用域',
        rarity: 'EXPERT',
        icon: 'assets/images/skills/attributes/scope_range.png'
      },
      {
        key: 'criticalChance',
        name: '优化命中',
        baseIncrement: 0.05,
        description: '提升防御塔的暴击概率，就像代码优化带来的性能提升',
        rarity: 'ARCHITECT',
        icon: 'assets/images/skills/attributes/optimization_hit.png'
      }
    ];

    // 为每个防御塔生成属性提升技能
    this.towerTypes.forEach(tower => {
      attributes.forEach(attr => {
        this.playerSkills.push({
          key: `${tower.key}_${attr.key}_boost`,
          name: `${tower.name} ${attr.name}升级`,
          description: `${attr.description}`,
          type: 'attribute',
          targetTower: tower.key,
          attribute: attr.key,
          rarity: attr.rarity,
          icon: attr.icon,
          maxLevel: 5,
          levelStats: Array(5).fill(0).map((_, index) => ({
            level: index + 1,
            increment: attr.baseIncrement * (index + 1) * this.rarities[attr.rarity].multiplier,
            description: `第${index + 1}次迭代优化`
          }))
        });
      });
    });
  }

  generateSpecialSkills() {
    const specialSkills = [
      {
        key: 'code_optimization',
        name: '性能优化',
        description: '重构代码架构，所有防御塔的建造成本永久降低',
        type: 'global',
        rarity: 'EXPERT',
        icon: 'assets/images/skills/special/code_optimization.png',
        maxLevel: 3,
        levelStats: [
          { 
            level: 1, 
            effect: 0.9,
            description: '初步优化 (降低10%建造成本)' 
          },
          { 
            level: 2, 
            effect: 0.8,
            description: '深度优化 (降低20%建造成本)' 
          },
          { 
            level: 3, 
            effect: 0.7,
            description: '极致优化 (降低30%建造成本)' 
          }
        ]
      },
      {
        key: 'multi_threading',
        name: '并行计算',
        description: '启用多线程处理，所有防御塔概率触发并行攻击',
        type: 'global',
        rarity: 'ARCHITECT',
        icon: 'assets/images/skills/special/multi_threading.png',
        maxLevel: 3,
        levelStats: [
          { level: 1, effect: 0.15, description: '双线程' },
          { level: 2, effect: 0.25, description: '四线程' },
          { level: 3, effect: 0.35, description: '八线程' }
        ]
      }
    ];

    // 为每个防御塔生成特殊技能
    this.towerTypes.forEach(tower => {
      if (tower.attackType === 'single') {
        this.playerSkills.push({
          key: `${tower.key}_double_shot`,
          name: `${tower.name}异步处理`,
          description: `启用异步操作，使${tower.name}能够同时处理两个目标`,
          type: 'special',
          rarity: 'SENIOR',
          targetTower: tower.key,
          maxLevel: 1,
          levelStats: [
            { level: 1, effect: true, description: '异步升级完成' }
          ]
        });
      }

      if (tower.attackType === 'aoe') {
        this.playerSkills.push({
          key: `${tower.key}_aoe_enhance`,
          name: `${tower.name}广播增强`,
          description: `增强广播消息的传播范围，提升${tower.name}的AOE效果`,
          type: 'special',
          rarity: 'ARCHITECT',
          targetTower: tower.key,
          maxLevel: 3,
          levelStats: [
            { level: 1, effect: 0.2, description: '本地广播' },
            { level: 2, effect: 0.4, description: '区域广播' },
            { level: 3, effect: 0.6, description: '全局广播' }
          ]
        });
      }
    });

    this.playerSkills.push(...specialSkills);
  }

  getSkillByKey(key) {
    return this.playerSkills.find(skill => skill.key === key);
  }

  getSkillEffect(key, level) {
    const skill = this.getSkillByKey(key);
    if (!skill) return null;
    const levelStat = skill.levelStats.find(stat => stat.level === level);
    return levelStat ? levelStat.effect : null;
  }

  getRarityInfo(rarityKey) {
    return this.rarities[rarityKey];
  }

  drawRandomSkill(count = 1, guaranteedRarity = null) {
    let results = [];
    
    for (let i = 0; i < count; i++) {
      if (guaranteedRarity) {
        const raritySkills = this.playerSkills.filter(skill => skill.rarity === guaranteedRarity);
        if (raritySkills.length > 0) {
          const randomIndex = Math.floor(Math.random() * raritySkills.length);
          results.push(raritySkills[randomIndex]);
        }
        continue;
      }

      const rarity = this.drawRarity();
      const raritySkills = this.playerSkills.filter(skill => skill.rarity === rarity);
      
      if (raritySkills.length > 0) {
        const randomIndex = Math.floor(Math.random() * raritySkills.length);
        results.push(raritySkills[randomIndex]);
      }
    }

    return count === 1 ? results[0] : results;
  }

  drawRarity() {
    const random = Math.random();
    let probabilitySum = 0;

    for (const [rarity, info] of Object.entries(this.rarities)) {
      probabilitySum += info.probability;
      if (random <= probabilitySum) {
        return rarity;
      }
    }

    return 'JUNIOR';
  }

  getRarityProbability(rarity) {
    return this.rarities[rarity]?.probability || 0;
  }

  drawUniqueSkills(count = 3) {
    let availableSkills = [...this.playerSkills];
    let results = [];

    count = Math.min(count, availableSkills.length);

    for (let i = 0; i < count; i++) {
      const rarity = this.drawRarity();
      const raritySkills = availableSkills.filter(skill => skill.rarity === rarity);
      
      if (raritySkills.length > 0) {
        const randomIndex = Math.floor(Math.random() * raritySkills.length);
        const selectedSkill = raritySkills[randomIndex];
        
        availableSkills = availableSkills.filter(skill => skill !== selectedSkill);
        results.push(selectedSkill);
      }
    }

    return results;
  }

  drawTenSkills() {
    let results = [];
    
    results = results.concat(this.drawRandomSkill(9));
    
    const guaranteedRarities = ['SENIOR', 'EXPERT', 'ARCHITECT'];
    const guaranteedRarity = guaranteedRarities[Math.floor(Math.random() * guaranteedRarities.length)];
    results.push(this.drawRandomSkill(1, guaranteedRarity));
    
    return results;
  }

  getSkillIcon(skill) {
    return skill.icon || this.getDefaultIconByRarity(skill.rarity);
  }

  getDefaultIconByRarity(rarity) {
    const defaultIcons = {
      JUNIOR: 'assets/images/skills/rarity/junior_default.png',
      INTERMEDIATE: 'assets/images/skills/rarity/intermediate_default.png',
      SENIOR: 'assets/images/skills/rarity/senior_default.png',
      EXPERT: 'assets/images/skills/rarity/expert_default.png',
      ARCHITECT: 'assets/images/skills/rarity/architect_default.png'
    };
    return defaultIcons[rarity] || defaultIcons.JUNIOR;
  }
} 