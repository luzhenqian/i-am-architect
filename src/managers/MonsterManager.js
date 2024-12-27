import Phaser from 'phaser';

export class MonsterManager {
  constructor(scene) {
    this.scene = scene;
    this.monsters = [];
    this.monsterTypes = this.scene.config.monsterTypes;
  }

  update() {
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      
      if (monster.isDying) continue;

      // 检查是否与防御塔碰撞
      const collidingTower = this.checkTowerCollision(monster);
      
      if (collidingTower) {
        // 如果碰到防御塔，停止移动并攻击
        if (!monster.attackingTower) {
          monster.attackingTower = collidingTower;
          monster.lastAttackTime = 0;
        }
        
        this.monsterAttackTower(monster);
        this.updateMonsterHealthBarPosition(monster);
      } else {
        // 正常移动
        monster.sprite.y += monster.speed;
        monster.attackingTower = null;
        
        this.updateMonsterHealthBarPosition(monster);

        // 检查是否到达底部
        if (monster.sprite.y >= this.scene.game.config.height - 160) {
          this.scene.playerHealth -= 10;
          this.scene.uiManager.updateHealthText();
          this.playDeathAnimation(monster);
        }
      }
    }
  }

  checkTowerCollision(monster) {
    return this.scene.towerManager.towers.find(tower => {
      const distance = Phaser.Math.Distance.Between(
        monster.sprite.x,
        monster.sprite.y,
        tower.sprite.x,
        tower.sprite.y
      );
      return distance < this.scene.config.cellSize * 0.6;
    });
  }

  monsterAttackTower(monster) {
    const currentTime = this.scene.time.now;
    
    if (!monster.lastAttackTime || 
        currentTime - monster.lastAttackTime >= monster.attackSpeed) {
      
      monster.lastAttackTime = currentTime;
      const tower = monster.attackingTower;
      
      this.createMonsterAttackEffect(monster, tower);
      
      const baseDamage = monster.attack * 2;
      const defense = tower.defense || 0;
      const damage = Math.max(5, baseDamage - defense);
      
      tower.health -= damage;
      
      const healthPercentage = Math.max(0, tower.health / tower.maxHealth);
      this.updateHealthBar(tower.healthBar, healthPercentage);
      
      this.showDamageNumber(tower.sprite.x, tower.sprite.y, damage);
      
      if (tower.health <= 0) {
        this.scene.towerManager.destroyTower(tower);
      }
    }
  }

  createMonsterAttackEffect(monster, tower) {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(2, 0xff0000, 1);
    graphics.lineBetween(
      monster.sprite.x,
      monster.sprite.y,
      tower.sprite.x,
      tower.sprite.y
    );

    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 200,
      onComplete: () => graphics.destroy()
    });
  }

  updateMonsterHealthBarPosition(monster) {
    if (monster.healthBar) {
      monster.healthBar.background.x = monster.sprite.x;
      monster.healthBar.background.y = monster.sprite.y - 25;
      monster.healthBar.bar.x = monster.sprite.x - monster.healthBar.background.width/2;
      monster.healthBar.bar.y = monster.sprite.y - 25;
    }
  }

  showDamageNumber(x, y, amount) {
    const text = this.scene.add.text(x, y, `-${amount}`, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  updateHealthBar(healthBar, percentage) {
    healthBar.bar.width = healthBar.width * percentage;
    
    // 根据血量百分比改变颜色
    if (percentage > 0.6) {
      healthBar.bar.setFillStyle(0x00ff00);
    } else if (percentage > 0.3) {
      healthBar.bar.setFillStyle(0xffff00);
    } else {
      healthBar.bar.setFillStyle(0xff0000);
    }
  }

  playDeathAnimation(monster) {
    monster.isDying = true;
    
    this.scene.tweens.add({
      targets: monster.sprite,
      alpha: 0,
      scale: 0.5,
      duration: 500,
      onComplete: () => {
        if (monster.healthBar) {
          monster.healthBar.background.destroy();
          monster.healthBar.bar.destroy();
        }
        monster.sprite.destroy();
        this.monsters = this.monsters.filter(m => m !== monster);
      }
    });
  }

  shutdown() {
    this.monsters.forEach(monster => {
      if (monster.healthBar) {
        monster.healthBar.background.destroy();
        monster.healthBar.bar.destroy();
      }
      if (monster.sprite) {
        monster.sprite.destroy();
      }
    });
    this.monsters = [];
  }
} 