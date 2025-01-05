import Phaser from 'phaser';
import { DisplayUtils, scaleToDPR } from '../../shared/utils/DisplayUtils';

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

      // 当前缩放
      if (collidingTower) {
        // 如果碰到防御塔，停止移动动画
        monster.sprite.setAngle(0);
        // 恢复缩放
        monster.sprite.setScale((this.scene.cellSize / monster.sprite.width) * 0.8);

        if (!monster.attackingTower) {
          monster.attackingTower = collidingTower;
          monster.lastAttackTime = 0;
        }

        this.attackTower(monster);
        // 即使在攻击时也要更新血条位置
        this.updateMonsterHealthBarPosition(monster);
      } else {
        // 正常移动时添加动画效果
        monster.sprite.y += monster.speed;
        monster.attackingTower = null;

        // 添加摆动效果
        const swingAngle = Math.sin(time / 100) * 0.3; // 每200ms完成一次摆动，最大角度为5度
        monster.sprite.setAngle(swingAngle);

        // 基于当前缩放比例添加呼吸效果
        const breathScale = 0.3 * (1 + Math.sin(time / 300) * 0.05); // 每600ms完成一次呼吸,振幅为0.05
        monster.sprite.setScale(breathScale);

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
      const damage = Math.max(5, baseDamage - defense); // 确保最小伤害为5

      // 计算防御塔实际受到的伤害
      tower.health -= damage;

      // 更新血条
      const healthPercentage = Math.max(0, tower.health / tower.maxHealth);
      this.scene.updateHealthBar(tower.healthBar, healthPercentage);

      // 显示伤害数字
      DisplayUtils.createDamageNumber(this.scene, tower.sprite.x, tower.sprite.y, damage, 0xff4400);

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
      monster.healthBar.border.x = monster.sprite.x;
      monster.healthBar.border.y = monster.sprite.y - scaleToDPR(25); // 保持相同的偏移值
    }
  }

  // 创建怪物攻击特效
  createMonsterAttackEffect(monster, tower) {
    // 创建能量球起始点
    const energyBall = this.scene.add.circle(
      monster.sprite.x,
      monster.sprite.y,
      10,
      0xff0000,
      1
    );

    // 创建能量球的外发光
    const outerGlow = this.scene.add.circle(
      monster.sprite.x,
      monster.sprite.y,
      15,
      0xff3333,
      0.5
    );

    // 创建能量球的内核
    const core = this.scene.add.circle(
      monster.sprite.x,
      monster.sprite.y,
      5,
      0xffff00,
      1
    );

    // 能量球发射动画
    this.scene.tweens.add({
      targets: [energyBall, outerGlow, core],
      x: tower.sprite.x,
      y: tower.sprite.y,
      duration: 300,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // 能量球到达目标后的爆炸效果
        this.createImpactEffect(tower.sprite.x, tower.sprite.y);
        energyBall.destroy();
        outerGlow.destroy();
        core.destroy();
      }
    });

    // 能量球飞行过程中的缩放动画
    this.scene.tweens.add({
      targets: [energyBall, outerGlow],
      scale: { from: 1, to: 1.2 },
      yoyo: true,
      repeat: -1,
      duration: 100
    });
  }

  // 创建冲击效果
  createImpactEffect(x, y) {
    // 创建爆炸中心点
    const impactCore = this.scene.add.circle(x, y, 5, 0xffffff, 1);
    
    // 创建多层冲击波
    const shockwaves = [];
    const colors = [0xff0000, 0xff3333, 0xff6666];
    
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(x, y, 10, colors[i], 0.8);
      shockwaves.push(ring);
    }

    // 创建能量碎片
    const fragments = [];
    const fragmentCount = 8;
    for (let i = 0; i < fragmentCount; i++) {
      const angle = (i / fragmentCount) * Math.PI * 2;
      const fragment = this.scene.add.rectangle(x, y, 4, 12, 0xff3333);
      fragment.setRotation(angle);
      fragments.push(fragment);
    }

    // 爆炸核心动画
    this.scene.tweens.add({
      targets: impactCore,
      scale: 2,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => impactCore.destroy()
    });

    // 冲击波动画
    shockwaves.forEach((ring, i) => {
      this.scene.tweens.add({
        targets: ring,
        scale: 4,
        alpha: 0,
        duration: 400,
        delay: i * 100,
        ease: 'Power2',
        onComplete: () => ring.destroy()
      });
    });

    // 能量碎片动画
    fragments.forEach((fragment, i) => {
      const angle = (i / fragmentCount) * Math.PI * 2;
      this.scene.tweens.add({
        targets: fragment,
        x: x + Math.cos(angle) * 50,
        y: y + Math.sin(angle) * 50,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => fragment.destroy()
      });
    });

    // 添加闪光效果
    const flash = this.scene.add.circle(x, y, 40, 0xffffff, 0.5);
    this.scene.tweens.add({
      targets: flash,
      scale: 0.1,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => flash.destroy()
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
          monster.healthBar.border.destroy();
        }
      }
    });
    this.monsters = [];
  }

  // 受到伤害
  damage(monster, damage) {
    if (!monster || monster.isDying) return false;
    // 确保damage是数字
    const damageAmount = Number(damage) || 0;
    // 计算实际伤害（考虑防御力）
    const actualDamage = Math.max(1, Math.floor(damageAmount - monster.defense));
    monster.health = Math.max(0, monster.health - actualDamage);
    // 更新血条
    const healthPercentage = Math.max(0, monster.health / monster.maxHealth);
    this.scene.updateHealthBar(monster.healthBar, healthPercentage);
    // 显示伤害数字
    DisplayUtils.createDamageNumber(this.scene, monster.sprite.x, monster.sprite.y, actualDamage, 0xff4400);

    // 检查是否死亡
    if (monster.health <= 0 && !monster.isDying) {
      monster.isDying = true;
      // 获得经验值
      const expGain = monster.experience || 10; // 默认经验值为10
      this.scene.addExperience(expGain);
      // 显示获得的经验值
      DisplayUtils.showExpGain(this.scene, monster.sprite.x, monster.sprite.y, expGain);
      // 显示奖励
      this.showRewardGold(monster.sprite.x, monster.sprite.y, monster.reward);
      // 清理该怪物的连击记录
      this.scene.towerManager.clearConsecutiveHits(monster.id);
      this.scene.playDeathAnimation(monster);
      // 清除怪物
      this.destroy(monster);
      return true; // 返回true表示怪物已死亡
    }
    return false; // 返回false表示物存活
  }

  // 显示奖励金币
  showRewardGold(x, y, amount) {
    // 创建金币图标
    const coinIcon = this.scene.add.circle(
      x,
      y,
      scaleToDPR(12),
      0xffd700
    );

    // 创建金币符号
    const coinSymbol = this.scene.add.text(
      x,
      y,
      '₿',
      {
        fontSize: `${scaleToDPR(16)}px`,
        fontFamily: 'Arial',
        color: '#000000'
      }
    ).setOrigin(0.5);

    // 创建金币数量文本
    const amountText = this.scene.add.text(
      x + scaleToDPR(20),
      y,
      `+${amount}`,
      {
        fontSize: `${scaleToDPR(16)}px`,
        fontFamily: 'Arial',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: scaleToDPR(2)
      }
    ).setOrigin(0, 0.5);

    // 金币上升动画
    this.scene.tweens.add({
      targets: [coinIcon, coinSymbol, amountText],
      y: y - scaleToDPR(40),
      alpha: { from: 1, to: 0 },
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        coinIcon.destroy();
        coinSymbol.destroy();
        amountText.destroy();
      }
    });
  }

  // 销毁怪物
  destroy(monster) {
    // 清除血条
    if (monster.healthBar) {
      monster.healthBar.background.destroy();
      monster.healthBar.bar.destroy();
      monster.healthBar.border.destroy();
    }
    this.monsters = this.monsters.filter(m => m !== monster);
  }
}
