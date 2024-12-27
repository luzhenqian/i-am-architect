import Phaser from 'phaser';

export class TowerManager {
  constructor(scene) {
    this.scene = scene;
    this.towers = [];
    this.towerTypes = this.scene.config.towerTypes;
    this.lastAttackTime = {};
  }

  createTower(type, x, y) {
    // 创建防御塔的逻辑
  }

  update(time) {
    this.towers.forEach(tower => {
      const towerType = this.towerTypes.find(t => t.key === tower.type);
      
      // 区块链节点的特殊处理
      if (towerType.attackType === 'mine') {
        if (!tower.lastMineTime || time - tower.lastMineTime >= towerType.attackSpeed) {
          this.generateGold(tower, towerType.mineAmount);
          tower.lastMineTime = time;
        }
        return;
      }

      // 调试精灵的治疗逻辑
      if (towerType.attackType === 'heal') {
        this.handleHealing(tower, time);
        return;
      }

      // 其他防御塔的攻击逻辑
      const target = this.findTarget(tower);
      if (target && (!this.lastAttackTime[tower.id] || 
          time - this.lastAttackTime[tower.id] >= towerType.attackSpeed)) {
        this.attackMonster(tower, target, time);
      }
    });
  }

  findTarget(tower) {
    const towerType = this.towerTypes.find(t => t.key === tower.type);
    const range = towerType.range * this.scene.config.cellSize;
    let nearestMonster = null;
    let shortestDistance = Infinity;

    this.scene.monsterManager.monsters.forEach(monster => {
      if (monster.isDying) return;

      const distance = Phaser.Math.Distance.Between(
        tower.sprite.x,
        tower.sprite.y,
        monster.sprite.x,
        monster.sprite.y
      );

      if (distance <= range) {
        switch (towerType.targetStrategy) {
          case 'nearest':
            if (distance < shortestDistance) {
              shortestDistance = distance;
              nearestMonster = monster;
            }
            break;

          case 'strongest':
            if (!nearestMonster || monster.health > nearestMonster.health) {
              nearestMonster = monster;
            }
            break;

          case 'weakest':
            if (!nearestMonster || monster.health < nearestMonster.health) {
              nearestMonster = monster;
            }
            break;
        }
      }
    });

    return nearestMonster;
  }

  attackMonster(tower, monster, time) {
    const towerType = this.towerTypes.find(t => t.key === tower.type);
    this.lastAttackTime[tower.id] = time;

    // 创建攻击效果
    this.createAttackEffect(tower, monster, towerType);

    // 计算伤害
    let damage = towerType.attack;

    // 处理暴击
    if (towerType.skill && towerType.skill.criticalChance) {
      if (Math.random() < towerType.skill.criticalChance) {
        damage *= towerType.skill.criticalMultiplier;
      }
    }

    // 范围攻击处理
    if (towerType.attackType === 'aoe') {
      this.handleAOEAttack(tower, monster, damage, towerType);
    } else {
      this.damageMonster(monster, damage);
    }
  }

  handleAOEAttack(tower, centerMonster, damage, towerType) {
    const aoeRadius = towerType.aoeRadius * this.scene.config.cellSize;
    
    this.scene.monsterManager.monsters.forEach(monster => {
      if (monster.isDying) return;

      const distance = Phaser.Math.Distance.Between(
        centerMonster.sprite.x,
        centerMonster.sprite.y,
        monster.sprite.x,
        monster.sprite.y
      );

      if (distance <= aoeRadius) {
        this.damageMonster(monster, damage);
        
        // 处理眩晕效果
        if (towerType.skill && towerType.skill.stunChance) {
          if (Math.random() < towerType.skill.stunChance) {
            this.applyStun(monster, towerType.skill.stunDuration);
          }
        }
      }
    });
  }

  handleHealing(tower, time) {
    const towerType = this.towerTypes.find(t => t.key === tower.type);
    if (!tower.lastHealTime || time - tower.lastHealTime >= towerType.attackSpeed) {
      tower.lastHealTime = time;
      
      // 寻找范围内血量最低的防御塔
      let lowestHealthTower = null;
      let lowestHealthPercentage = 1;

      this.towers.forEach(targetTower => {
        if (targetTower === tower) return;

        const distance = Phaser.Math.Distance.Between(
          tower.sprite.x,
          tower.sprite.y,
          targetTower.sprite.x,
          targetTower.sprite.y
        );

        if (distance <= towerType.range * this.scene.config.cellSize) {
          const healthPercentage = targetTower.health / targetTower.maxHealth;
          if (healthPercentage < 1 && healthPercentage < lowestHealthPercentage) {
            lowestHealthPercentage = healthPercentage;
            lowestHealthTower = targetTower;
          }
        }
      });

      if (lowestHealthTower) {
        this.healTower(tower, lowestHealthTower, towerType.healAmount);
      }
    }
  }

  healTower(healer, target, amount) {
    target.health = Math.min(target.maxHealth, target.health + amount);
    this.createHealEffect(healer, target);
    this.updateTowerHealthBar(target);
  }

  createAttackEffect(tower, monster, towerType) {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(2, towerType.effectColor, 1);
    graphics.lineBetween(
      tower.sprite.x,
      tower.sprite.y,
      monster.sprite.x,
      monster.sprite.y
    );

    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 200,
      onComplete: () => graphics.destroy()
    });
  }

  createHealEffect(healer, target) {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(2, 0x00ff00, 1);
    graphics.lineBetween(
      healer.sprite.x,
      healer.sprite.y,
      target.sprite.x,
      target.sprite.y
    );

    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 300,
      onComplete: () => graphics.destroy()
    });
  }

  damageMonster(monster, damage) {
    monster.health -= damage;
    const healthPercentage = monster.health / monster.maxHealth;
    this.scene.monsterManager.updateHealthBar(monster.healthBar, healthPercentage);
    
    if (monster.health <= 0) {
      this.scene.gold += monster.reward;
      this.scene.uiManager.updateGoldText();
      this.scene.monsterManager.playDeathAnimation(monster);
    }
  }

  applyStun(monster, duration) {
    monster.isStunned = true;
    monster.sprite.setTint(0x888888);
    
    this.scene.time.delayedCall(duration, () => {
      if (monster.sprite && monster.sprite.active) {
        monster.isStunned = false;
        monster.sprite.clearTint();
      }
    });
  }

  updateTowerHealthBar(tower) {
    const healthPercentage = tower.health / tower.maxHealth;
    if (tower.healthBar) {
      tower.healthBar.bar.width = tower.healthBar.width * healthPercentage;
    }
  }

  destroyTower(tower) {
    if (tower.healthBar) {
      tower.healthBar.background.destroy();
      tower.healthBar.bar.destroy();
    }
    tower.sprite.destroy();
    this.towers = this.towers.filter(t => t !== tower);
  }

  shutdown() {
    this.towers.forEach(tower => {
      if (tower.healthBar) {
        tower.healthBar.background.destroy();
        tower.healthBar.bar.destroy();
      }
      if (tower.sprite) {
        tower.sprite.destroy();
      }
    });
    this.towers = [];
    this.lastAttackTime = {};
  }
} 