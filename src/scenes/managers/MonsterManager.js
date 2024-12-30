import Phaser from 'phaser';
import { scaleToDPR } from '../../shared/utils';

export class MonsterManager {
  constructor(scene) {
    this.scene = scene;
    this.monsters = [];
  }

  update(time, delta) {
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

        this.attackTower(monster);
        // 即使在攻击时也要更新血条位置
        this.updateMonsterHealthBarPosition(monster);
      } else {
        // 正常移动
        monster.sprite.y += monster.speed;
        monster.attackingTower = null;

        // 更新血条位置
        this.updateMonsterHealthBarPosition(monster);

        // 首检查是否有任何finally代码块被触碰
        const finallyBlocks = this.scene.codeBlocks?.filter(block => block.type === 'finally') || [];
        for (const finallyBlock of finallyBlocks) {
          if (Math.abs(monster.sprite.y - finallyBlock.sprite.y) < this.scene.cellSize * 0.5 &&
            Math.abs(monster.sprite.x - finallyBlock.sprite.x) < this.scene.cellSize * 0.5) {
            // 如果碰到任何finally代码块，直接结束游戏
            this.scene.handleGameOver();
            this.scene.playDeathAnimation(monster);
            return;
          }
        }

        // 检查是否与机器核心或catch代块碰撞
        const machineCore = this.scene.machineCores[monster.column];
        const codeBlock = this.scene.findCodeBlockInColumn(monster.column);

        if (machineCore && !machineCore.isDestroyed &&
          Math.abs(monster.sprite.y - machineCore.y) < this.scene.cellSize * 0.5) {
          // 与机器核心碰撞
          this.scene.destroyMachineCore(monster.column);
          this.scene.createCodeBlock(monster.column, 'catch');
          this.scene.playDeathAnimation(monster);
        } else if (codeBlock && codeBlock.type === 'catch' &&
          Math.abs(monster.sprite.y - codeBlock.sprite.y) < this.scene.cellSize * 0.5) {
          // 与catch代码块碰撞
          this.scene.triggerCodeBlockExplosion(codeBlock);
          this.scene.createCodeBlock(monster.column, 'finally');
          this.scene.playDeathAnimation(monster);
        }
      }
    }

  }

  // 检查与防御塔的碰撞
  checkTowerCollision(monster) {
    return this.scene.towerManager.towers.find(tower => {
      const distance = Phaser.Math.Distance.Between(
        monster.sprite.x,
        monster.sprite.y,
        tower.sprite.x,
        tower.sprite.y
      );
      return distance < this.scene.cellSize * 0.6;
    });
  }

  // 怪物攻击防御塔
  attackTower(monster) {
    const currentTime = this.scene.time.now;

    if (!monster.lastAttackTime ||
      currentTime - monster.lastAttackTime >= monster.attackSpeed) {

      monster.lastAttackTime = currentTime;
      const tower = monster.attackingTower;

      // 创建攻击特效
      this.createMonsterAttackEffect(monster, tower);

      // 调计算公式
      const baseDamage = monster.attack * 2; // 增加基础伤害
      const defense = tower.defense || 0;
      const damage = Math.max(5, baseDamage - defense); // 确最小伤害为5

      // 应伤害
      tower.health -= damage;

      // 更新血条
      const healthPercentage = Math.max(0, tower.health / tower.maxHealth);
      this.scene.updateHealthBar(tower.healthBar, healthPercentage);

      // 显示伤害数字
      this.scene.showDamageNumber(tower.sprite.x, tower.sprite.y, damage);

      // 检查防御塔是否被摧毁
      if (tower.health <= 0) {
        // this.destroyTower(tower);
        this.scene.towerManager.destroy(tower);
      }
    }
  }

  // 更新怪物血条位置
  updateMonsterHealthBarPosition(monster) {
    if (monster.healthBar) {
      monster.healthBar.background.x = monster.sprite.x;
      monster.healthBar.background.y = monster.sprite.y - scaleToDPR(25); // 保持相同的偏移值
      monster.healthBar.bar.x = monster.sprite.x - monster.healthBar.width / 2;
      monster.healthBar.bar.y = monster.sprite.y - scaleToDPR(25); // 保持相同的偏移值
    }
  }

  // 创建怪物攻击特效
  createMonsterAttackEffect(monster, tower) {
    // 创建攻击线
    const line = this.scene.add.graphics();
    line.lineStyle(2, 0xff0000, 1);
    line.beginPath();
    line.moveTo(monster.sprite.x, monster.sprite.y);
    line.lineTo(tower.sprite.x, tower.sprite.y);
    line.strokePath();

    // 创建攻击波
    const impact = this.scene.add.circle(tower.sprite.x, tower.sprite.y, 10, 0xff0000, 0.7);

    // 动画效果
    this.scene.tweens.add({
      targets: [line, impact],
      alpha: 0,
      scale: { value: 1.5, ease: 'Power2' },
      duration: 200,
      onComplete: () => {
        line.destroy();
        impact.destroy();
      }
    });
  }

  // 销毁所有怪物
  destroyAll() {
    this.monsters.forEach(monster => {
      if (monster.sprite) {
        monster.sprite.destroy();
        if (monster.healthBar) {
          monster.healthBar.background.destroy();
          monster.healthBar.bar.destroy();
        }
      }
    });
    this.monsters = [];
  }
}
