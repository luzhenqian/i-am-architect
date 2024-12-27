import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { scaleToDPR } from '../shared/utils';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.config = new GameConfig();
    this.gridSize = { rows: 8, cols: 6 };
    this.cellSize = this.config.cellSize;
    this.gold = 1000;
    this.playerHealth = 100;
    this.towers = [];
    this.monsters = [];
    this.wave = 1;
    this.countdown = 3;
    this.isWaveActive = false;
    this.monsterReward = 25;
    this.monsterSpawnInterval = 2500;
    this.monsterTypes = this.config.monsterTypes;
    this.towerTypes = this.config.towerTypes;
    this.lastAttackTime = {};
  }

  preload() {
    // 加载资源
    this.load.setBaseURL('/');

    // 加载防御塔图片
    this.config.towerTypes.forEach(tower => {
      this.load.image(tower.key, tower.image);
    });

    // 加载怪物图片
    this.config.monsterTypes.forEach(monster => {
      this.load.image(monster.key, monster.image);
    });

    // 加载UI元素
    // this.load.image('grid', 'assets/ui/grid.png');
    // this.load.image('tower_base', 'assets/ui/tower_base.png');
  }

  create() {
    console.log('GameScene create started');

    // 创建游戏背景
    this.add.rectangle(0, 0, this.game.config.width, this.game.config.height, 0x1a1a1a)
      .setOrigin(0, 0);

    // 创建网格
    this.createGrid();

    // 创建UI
    // this.createUI();

    // 创建塔防选择面板
    this.createTowerPanel();

    // 创建顶部信息栏背景
    const topBarHeight = scaleToDPR(60);
    const topBar = this.add.rectangle(0, 0, this.game.config.width, topBarHeight, 0x333333)
      .setOrigin(0, 0)
      .setAlpha(0.8);

    // 创建分隔线
    const separator = this.add.graphics();
    separator.lineStyle(scaleToDPR(2), 0x666666, 1);
    separator.lineBetween(0, topBarHeight, this.game.config.width, topBarHeight);

    // 左侧：生命值
    const healthIcon = this.add.circle(scaleToDPR(30), topBarHeight / 2, scaleToDPR(12), 0xff0000);
    this.healthText = this.add.text(scaleToDPR(50), topBarHeight / 2, `生命值: ${this.playerHealth}`, {
      fontSize: `${scaleToDPR(20)}px`,
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    // 中间：金币
    const coinX = this.game.config.width / 2;
    const coinIcon = this.add.circle(coinX - scaleToDPR(60), topBarHeight / 2, scaleToDPR(12), 0xffd700);
    const coinSymbol = this.add.text(coinX - scaleToDPR(60), topBarHeight / 2, '₿', {
      fontSize: `${scaleToDPR(16)}px`,
      fontFamily: 'Arial',
      color: '#000000'
    }).setOrigin(0.5);

    this.goldText = this.add.text(coinX - scaleToDPR(40), topBarHeight / 2, `金币: ${this.gold}`, {
      fontSize: `${scaleToDPR(20)}px`,
      fontFamily: 'Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    // 右侧：暂停和退出按钮
    const buttonY = topBarHeight / 2;
    const buttonSpacing = scaleToDPR(20);
    const buttonHeight = scaleToDPR(30);
    const buttonWidth = scaleToDPR(80);

    // 暂停按钮
    const pauseX = this.game.config.width - scaleToDPR(200);
    const pauseButton = this.add.rectangle(pauseX, buttonY, buttonWidth, buttonHeight, 0x4CAF50)
      .setInteractive();

    this.pauseText = this.add.text(pauseX, buttonY, '暂停', {
      fontSize: `${scaleToDPR(16)}px`,
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 退出按钮
    const exitX = this.game.config.width - scaleToDPR(100);
    const exitButton = this.add.rectangle(exitX, buttonY, buttonWidth, buttonHeight, 0xff4444)
      .setInteractive();

    const exitText = this.add.text(exitX, buttonY, '退出', {
      fontSize: `${scaleToDPR(16)}px`,
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 暂停按钮交互
    pauseButton.on('pointerover', () => {
      pauseButton.setFillStyle(0x45a049);
      this.input.setDefaultCursor('pointer');
    });

    pauseButton.on('pointerout', () => {
      pauseButton.setFillStyle(0x4CAF50);
      this.input.setDefaultCursor('default');
    });

    pauseButton.on('pointerdown', () => {
      this.togglePause();
    });

    // 退出按钮交互
    exitButton.on('pointerover', () => {
      exitButton.setFillStyle(0xe03939);
      this.input.setDefaultCursor('pointer');
    });

    exitButton.on('pointerout', () => {
      exitButton.setFillStyle(0xff4444);
      this.input.setDefaultCursor('default');
    });

    exitButton.on('pointerdown', () => {
      this.showExitConfirmation();
    });

    // 创建暂停菜单
    this.createPauseMenu();

    // 创建退出确认对话框
    this.createExitConfirm();

    // 添加键盘ESC键暂停/继续功能
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.exitConfirm.visible) {
        this.exitConfirm.setVisible(false);
        if (!this.pauseMenu.visible) {
          this.scene.resume();
        }
      } else {
        this.togglePause();
      }
    });

    // 确保暂停菜单和退出确认框在场景暂停时仍然可以交互
    this.pauseMenu.setDepth(2000);
    this.exitConfirm.setDepth(2000);

    // 添加波次进度指示器
    this.waveProgress = this.add.text(this.game.config.width - scaleToDPR(30), topBarHeight - scaleToDPR(10), '', {
      fontSize: `${scaleToDPR(14)}px`,
      fontFamily: 'Arial',
      color: '#aaaaaa'
    }).setOrigin(1, 1);

    // 更新波次进度显示
    this.updateWaveProgress = () => {
      if (this.isWaveActive && this.monstersRemaining > 0) {
        this.waveProgress.setText(`剩余: ${this.monstersRemaining}`);
      } else {
        this.waveProgress.setText('准备就绪');
      }
    };

    // 添加倒计时文本
    this.countdownText = this.add.text(
      this.game.config.width / 2,
      this.game.config.height / 2,
      '',
      {
        fontSize: `${scaleToDPR(64)}px`,
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: scaleToDPR(4),
        shadow: { blur: scaleToDPR(10), color: '#000000', fill: true }
      }
    ).setOrigin(0.5).setDepth(1000).setVisible(false);

    // 开始游戏倒计时
    this.startCountdown();

    // 添加
    this.time.addEvent({
      delay: 1000,
      callback: this.spawnMonster,
      callbackScope: this,
      loop: true
    });

    // 定义怪物路径
    this.monsterPath = this.createMonsterPath();

    // 创建单的粒子纹理
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(scaleToDPR(4), scaleToDPR(4), scaleToDPR(4));
    graphics.generateTexture('particle', 8, 8);
    graphics.destroy();

    // 保存波次计时器引用
    this.waveTimer = null;
    this.monsterSpawnEvent = null;
  }

  update(time, delta) {
    this.updateMonsters();
    this.updateTowers(time, delta);

    // 更新所有防御塔的血条位置
    this.towers.forEach(tower => {
      this.updateTowerHealthBarPosition(tower);
    });

    // 更新波次进度
    this.updateWaveProgress();
  }

  // 添加防御塔攻击更新
  updateTowers(time, delta) {
    this.towers.forEach(tower => {
      const currentTime = time;
      
      // 使用转换后的攻击间隔
      if (!tower.lastAttackTime || (currentTime - tower.lastAttackTime) >= tower.attackInterval) {
        const target = this.findTarget(tower);
        
        if (target) {
          this.attackMonster(tower, target);
          tower.lastAttackTime = currentTime;
        }
      }
    });
  }

  // 在防御塔范围内寻找目标
  findTargetInRange(tower) {
    const towerX = tower.sprite.x;
    const towerY = tower.sprite.y;
    const rangeInPixels = tower.range * this.cellSize;

    // 找到最近的怪物
    return this.monsters.find(monster => {
      const distance = Phaser.Math.Distance.Between(
        towerX,
        towerY,
        monster.sprite.x,
        monster.sprite.y
      );
      return distance <= rangeInPixels;
    });
  }

  // 防御塔攻击怪物
  attackMonster(tower, monster) {
    if (!tower || !monster || monster.isDying) return;

    const towerType = this.towerTypes.find(t => t.key === tower.type);
    
    // 清理旧特效
    if (tower.currentEffect) {
      this.clearTowerEffects(tower);
    }

    // 创建新的攻击特效
    tower.currentEffect = this.createAttackEffect(tower, monster, tower.attackColor || 0x00ff00);

    if (towerType.key === 'algo_cannon') {
      // 算法炮台的范围伤害
      const aoeRadius = this.cellSize * 1.5;
      
      // 找出范围内的所有怪物
      this.monsters.forEach(targetMonster => {
        if (targetMonster.isDying) return;

        const distance = Phaser.Math.Distance.Between(
          monster.sprite.x,
          monster.sprite.y,
          targetMonster.sprite.x,
          targetMonster.sprite.y
        );

        // 如果在爆炸范围内
        if (distance <= aoeRadius) {
          // 计算伤害衰减（距离中心越远伤害越低）
          const damageRatio = Math.max(0.5, 1 - (distance / aoeRadius));
          // 确保基础伤害值存在
          const baseDamage = tower.attack || towerType.attack || 15;
          // 计算最终伤害
          const damage = Math.max(1, Math.floor(baseDamage * damageRatio));
          
          console.log('AOE Damage:', {
            baseDamage,
            damageRatio,
            finalDamage: damage,
            monsterDefense: targetMonster.defense
          });
          
          // 对范围内的怪物造成伤害
          this.damageMonster(targetMonster, damage);

          // 显示伤害数字
          this.showDamageNumber(
            targetMonster.sprite.x,
            targetMonster.sprite.y,
            damage,
            0xff4400
          );
        }
      });

      // 显示范围指示器
      this.showAOEIndicator(monster.sprite.x, monster.sprite.y, aoeRadius);

      return true;
    } else {
      // 其他防御塔的单体伤害
      // 确保使用正确的攻击力值
      const baseDamage = tower.attack || towerType.attack || 10;
      const monsterDefense = monster.defense || 0;
      const damage = Math.max(1, Math.floor(baseDamage - monsterDefense));
      
      console.log('Single Target Damage:', {
        baseDamage,
        monsterDefense,
        finalDamage: damage
      });

      return this.damageMonster(monster, damage);
    }
  }

  // 创建范围攻击效果
  createAOEEffect(x, y, radius, color) {
    // 创建爆炸圆圈
    const circle = this.add.circle(x, y, radius, color, 0.2);

    // 创建外圈
    const ring = this.add.circle(x, y, radius, color, 0);
    ring.setStrokeStyle(scaleToDPR(2), color, 1);

    // 创建粒子效果
    const particles = this.add.particles(0, 0, 'particle', {
      x: x,
      y: y,
      speed: { min: scaleToDPR(30), max: scaleToDPR(100) },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      lifespan: 600,
      quantity: 15,
      tint: color
    });

    // 动画效果
    this.tweens.add({
      targets: [circle, ring],
      scale: { from: 0.2, to: 1 },
      alpha: { from: 0.6, to: 0 },
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        circle.destroy();
        ring.destroy();
        particles.destroy();
      }
    });

    // 波纹效果
    for (let i = 0; i < 2; i++) {
      const ripple = this.add.circle(x, y, radius, color, 0);
      ripple.setStrokeStyle(scaleToDPR(2), color, 1);

      this.tweens.add({
        targets: ripple,
        scale: { from: 0.3, to: 1 },
        alpha: { from: 0.5, to: 0 },
        delay: i * 200,
        duration: 800,
        ease: 'Power2',
        onComplete: () => ripple.destroy()
      });
    }

    // 添加闪光效果
    const flash = this.add.circle(x, y, radius * 0.3, color, 1);
    this.tweens.add({
      targets: flash,
      scale: { from: 0.5, to: 2 },
      alpha: { from: 1, to: 0 },
      duration: 300,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    });
  }

  // 更新攻击效果创建方法
  createAttackEffect(tower, monster, color) {
    const towerType = this.towerTypes.find(t => t.key === tower.type);
    
    if (towerType.key === 'ai_sniper') {
      // AI狙击手的特殊攻击效果
      // 1. 创建瞄准线效果
      const aimLine = this.add.graphics();
      aimLine.lineStyle(scaleToDPR(1), 0xff0000, 0.3);
      aimLine.beginPath();
      aimLine.moveTo(tower.sprite.x, tower.sprite.y);
      aimLine.lineTo(monster.sprite.x, monster.sprite.y);
      aimLine.strokePath();

      // 2. 创建瞄准点效果
      const targetCircle = this.add.circle(monster.sprite.x, monster.sprite.y, scaleToDPR(12), 0xff0000, 0.2);
      const innerCircle = this.add.circle(monster.sprite.x, monster.sprite.y, scaleToDPR(8), 0xff0000, 0.3);
      const centerDot = this.add.circle(monster.sprite.x, monster.sprite.y, scaleToDPR(2), 0xff0000, 1);

      // 3. 创建射击光束
      const beam = this.add.graphics();
      beam.lineStyle(scaleToDPR(3), 0xffff00, 1);
      beam.beginPath();
      beam.moveTo(tower.sprite.x, tower.sprite.y);
      beam.lineTo(monster.sprite.x, monster.sprite.y);
      beam.strokePath();

      // 4. 创建射击闪光
      const muzzleFlash = this.add.circle(tower.sprite.x, tower.sprite.y, scaleToDPR(8), 0xffffff, 1);
      const impactFlash = this.add.circle(monster.sprite.x, monster.sprite.y, scaleToDPR(10), 0xffffff, 1);

      // 5. 创建高级粒子效果
      const particles = this.add.particles(tower.sprite.x, tower.sprite.y, 'particle', {
        speed: { min: scaleToDPR(200), max: scaleToDPR(400) },
        angle: Phaser.Math.Angle.Between(
          tower.sprite.x, 
          tower.sprite.y, 
          monster.sprite.x, 
          monster.sprite.y
        ) * 180 / Math.PI,
        scale: { start: 0.6, end: 0 },
        blendMode: 'ADD',
        lifespan: 200,
        quantity: 2,
        frequency: 10,
        tint: [0xffff00, 0xff8800, 0xff4400]
      });

      // 6. 动画序列
      this.tweens.add({
        targets: [targetCircle, innerCircle],
        scale: { from: 0.5, to: 1 },
        alpha: { from: 0, to: 1 },
        duration: 200,
        ease: 'Sine.easeOut'
      });

      this.tweens.add({
        targets: [muzzleFlash, impactFlash],
        scale: { from: 0.5, to: 2 },
        alpha: { from: 1, to: 0 },
        duration: 200,
        ease: 'Power2'
      });

      this.tweens.add({
        targets: beam,
        alpha: { from: 1, to: 0 },
        duration: 150,
        ease: 'Power2'
      });

      // 设置清理定时器
      this.time.delayedCall(300, () => {
        aimLine.destroy();
        targetCircle.destroy();
        innerCircle.destroy();
        centerDot.destroy();
        beam.destroy();
        muzzleFlash.destroy();
        impactFlash.destroy();
        particles.destroy();
      });

      return {
        aimLine,
        targetCircle,
        innerCircle,
        centerDot,
        beam,
        muzzleFlash,
        impactFlash,
        particles
      };
    } else if (towerType.key === 'algo_cannon') {
      // 算法炮台的特殊攻击效果
      const startPos = { x: tower.sprite.x, y: tower.sprite.y };
      const endPos = { x: monster.sprite.x, y: monster.sprite.y };
      
      // 创建椭圆形炮弹
      const shell = this.add.ellipse(startPos.x, startPos.y, scaleToDPR(12), scaleToDPR(8), 0x333333);
      shell.setStrokeStyle(scaleToDPR(1), 0x666666);
      
      // 直线弹道动画
      this.tweens.add({
        targets: shell,
        x: endPos.x,
        y: endPos.y,
        duration: 400,
        ease: 'Linear',
        onComplete: () => {
          shell.destroy();
          
          // 创建爆炸中心闪光
          const flash = this.add.circle(endPos.x, endPos.y, scaleToDPR(30), 0xffaa00, 1);
          
          // 创建爆炸波纹
          const rings = [];
          for (let i = 0; i < 3; i++) {
            const ring = this.add.circle(endPos.x, endPos.y, scaleToDPR(20), 0x666666, 0.6);
            rings.push(ring);
            
            this.tweens.add({
              targets: ring,
              scale: { from: 0.5, to: 2.5 },
              alpha: { from: 0.6, to: 0 },
              duration: 800,
              delay: i * 200,
              ease: 'Sine.easeOut',
              onComplete: () => ring.destroy()
            });
          }

          // 创建灰色蘑菇云效果
          const mushroomCloud = this.add.particles(endPos.x, endPos.y, 'particle', {
            speed: { min: scaleToDPR(50), max: scaleToDPR(150) },
            scale: { start: 1, end: 0 },
            alpha: { start: 0.8, end: 0 },
            tint: [0x666666, 0x888888, 0x999999],
            blendMode: 'SCREEN',
            emitting: false,
            lifespan: 1000,
            quantity: 50,
            angle: { min: 250, max: 290 },
            gravityY: scaleToDPR(-50)
          });

          // 创建火花粒子
          const sparks = this.add.particles(endPos.x, endPos.y, 'particle', {
            speed: { min: scaleToDPR(200), max: scaleToDPR(400) },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: 0xffaa00,
            blendMode: 'ADD',
            emitting: false,
            lifespan: 500,
            quantity: 30,
            angle: { min: 0, max: 360 }
          });

          // 创建冲击波粒子
          const shockwave = this.add.particles(endPos.x, endPos.y, 'particle', {
            speed: { min: scaleToDPR(100), max: scaleToDPR(200) },
            scale: { start: 0.2, end: 0 },
            alpha: { start: 0.6, end: 0 },
            tint: 0x888888,
            blendMode: 'SCREEN',
            emitting: false,
            lifespan: 600,
            quantity: 40,
            angle: { min: 0, max: 360 }
          });

          // 触发粒子爆发
          mushroomCloud.explode();
          sparks.explode();
          shockwave.explode();

          // 闪光动画
          this.tweens.add({
            targets: flash,
            scale: { from: 0.5, to: 2 },
            alpha: { from: 1, to: 0 },
            duration: 300,
            ease: 'Power2',
            onComplete: () => flash.destroy()
          });

          // 清理所有效果
          this.time.delayedCall(1000, () => {
            mushroomCloud.destroy();
            sparks.destroy();
            shockwave.destroy();
          });
        }
      });

      return { shell };
    } else {
      // 其他防御塔的默认效果
      const line = this.add.graphics();
      line.lineStyle(scaleToDPR(2), color, 1);
      line.beginPath();
      line.moveTo(tower.sprite.x, tower.sprite.y);
      line.lineTo(monster.sprite.x, monster.sprite.y);
      line.strokePath();

      const startPoint = this.add.circle(tower.sprite.x, tower.sprite.y, scaleToDPR(5), color, 1);
      const endPoint = this.add.circle(monster.sprite.x, monster.sprite.y, scaleToDPR(5), color, 1);

      const particles = this.add.particles(tower.sprite.x, tower.sprite.y, 'particle', {
        speed: { min: scaleToDPR(100), max: scaleToDPR(200) },
        angle: Phaser.Math.Angle.Between(
          tower.sprite.x, 
          tower.sprite.y, 
          monster.sprite.x, 
          monster.sprite.y
        ) * 180 / Math.PI,
        scale: { start: 0.4, end: 0 },
        blendMode: 'ADD',
        lifespan: 300,
        quantity: 1,
        frequency: 20,
        tint: color
      });

      this.time.delayedCall(300, () => {
        line.destroy();
        startPoint.destroy();
        endPoint.destroy();
        particles.destroy();
      });

      return {
        line,
        startPoint,
        endPoint,
        particles
      };
    }
  }

  // 更新放置防御塔的方法，添加唯一ID
  placeTower(row, col, towerType) {
    if (!this.canPlaceTower(row, col)) return;

    const tower = this.towerTypes.find(t => t.key === towerType);
    if (!tower || this.gold < tower.cost) return;

    const x = this.grid[row][col].x;
    const y = this.grid[row][col].y;

    // 创建防御塔
    const towerSprite = this.add.image(x, y, towerType)
      .setDisplaySize(this.cellSize * 0.8, this.cellSize * 0.8);

    // 创建血条
    const healthBar = this.createHealthBar(
      x,
      y - this.cellSize / 2,
      scaleToDPR(40),
      scaleToDPR(4),
      false
    );

    // 存储防御塔信息
    const towerId = Date.now().toString();
    const newTower = {
      id: towerId,
      sprite: towerSprite,
      type: towerType,
      row,
      col,
      health: tower.health,
      maxHealth: tower.health,
      healthBar: healthBar,
      range: tower.range,
      damage: tower.attack,
      defense: tower.defense,
      attackSpeed: tower.attackSpeed,
      lastAttackTime: 0
    };

    // 将每秒攻击次数转换为毫秒间隔
    const towerConfig = this.config.towerTypes.find(t => t.key === towerType);
    newTower.attackInterval = Math.floor(1000 / towerConfig.attackSpeed); // 转换为毫秒

    this.towers.push(newTower);

    // 创建范围指示器
    const rangeIndicator = this.add.graphics();
    rangeIndicator.lineStyle(2, 0x6a0dad);
    rangeIndicator.fillStyle(0x9370db, 0.1);
    rangeIndicator.beginPath();
    rangeIndicator.arc(x, y, tower.range * this.cellSize, 0, Math.PI * 2);
    rangeIndicator.closePath();
    rangeIndicator.fillPath();
    rangeIndicator.strokePath();
    rangeIndicator.setVisible(false);

    // 添加鼠标悬停效果
    towerSprite.setInteractive();
    towerSprite.on('pointerover', () => {
      rangeIndicator.setVisible(true);
    });
    towerSprite.on('pointerout', () => {
      rangeIndicator.setVisible(false);
    });

    return newTower;
  }

  // 更新怪物
  updateMonsters() {
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
        // 即使在攻击时也要更新血条位置
        this.updateMonsterHealthBarPosition(monster);
      } else {
        // 正常移动
        monster.sprite.y += monster.speed;
        monster.attackingTower = null;

        // 更新血条位置
        this.updateMonsterHealthBarPosition(monster);

        // 检查是否到达底部
        if (monster.sprite.y >= this.game.config.height - 160) {
          this.playerHealth -= 10;
          this.healthText.setText(`生命值: ${this.playerHealth}`);
          this.playDeathAnimation(monster);
        }
      }
    }
  }

  // 检查与防御塔的碰撞
  checkTowerCollision(monster) {
    return this.towers.find(tower => {
      const distance = Phaser.Math.Distance.Between(
        monster.sprite.x,
        monster.sprite.y,
        tower.sprite.x,
        tower.sprite.y
      );
      return distance < this.cellSize * 0.6;
    });
  }

  // 怪物攻击防御塔
  monsterAttackTower(monster) {
    const currentTime = this.time.now;

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

      // 应用伤害
      tower.health -= damage;

      // 更新血条
      const healthPercentage = Math.max(0, tower.health / tower.maxHealth);
      this.updateHealthBar(tower.healthBar, healthPercentage);

      // 显示伤害数字
      this.showDamageNumber(tower.sprite.x, tower.sprite.y, damage);

      // 检查防御塔是否被摧毁
      if (tower.health <= 0) {
        this.destroyTower(tower);
      }
    }
  }

  // 创建怪物攻击特效
  createMonsterAttackEffect(monster, tower) {
    // 创建攻击线
    const line = this.add.graphics();
    line.lineStyle(2, 0xff0000, 1);
    line.beginPath();
    line.moveTo(monster.sprite.x, monster.sprite.y);
    line.lineTo(tower.sprite.x, tower.sprite.y);
    line.strokePath();

    // 创建攻击波
    const impact = this.add.circle(tower.sprite.x, tower.sprite.y, 10, 0xff0000, 0.7);

    // 动画效果
    this.tweens.add({
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

  // 防御塔摧毁效果
  destroyTower(tower) {
    // 创建爆炸效果
    const explosion = this.add.particles(0, 0, 'particle', {
      x: tower.sprite.x,
      y: tower.sprite.y,
      speed: { min: 100, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 800,
      quantity: 30,
      tint: [0xff9900, 0xff6600, 0xff3300]
    });

    // 播放爆炸动画
    this.tweens.add({
      targets: tower.sprite,
      alpha: 0,
      scale: 1.4,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        // 清理资源
        explosion.destroy();
        tower.healthBar.background.destroy();
        tower.healthBar.bar.destroy();
        tower.sprite.destroy();

        // 从数组中移除防御塔
        const index = this.towers.indexOf(tower);
        if (index > -1) {
          this.towers.splice(index, 1);
        }

        // 清除网格占用
        this.grid[tower.row][tower.col].occupied = false;
      }
    });

    // 血条淡出
    this.tweens.add({
      targets: [tower.healthBar.background, tower.healthBar.bar],
      alpha: 0,
      duration: 500
    });
  }

  // 寻找塔的击目标
  findTargetForTower(tower) {
    if (!this.monsters || this.monsters.length === 0) return null;

    return this.monsters.find(monster => {
      if (!monster || !monster.sprite) return false;

      const dx = monster.sprite.x - tower.sprite.x;
      const dy = monster.sprite.y - tower.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      return distance <= (tower.range * this.cellSize);
    });
  }

  // 创建子弹
  createBullet(tower, target) {
    const bullet = this.add.circle(
      tower.sprite.x,
      tower.sprite.y,
      3,
      0xff0000
    );

    this.bullets.push({
      sprite: bullet,
      target: target.sprite,
      damage: tower.damage || 10
    });
  }

  // 处理击中怪物
  hitMonster(monster, damage) {
    const monsterData = this.monsters.find(m => m.sprite === monster);
    if (!monsterData) return;

    monsterData.health -= damage;
    if (monsterData.health <= 0) {
      this.gold += monsterData.reward || 10;
      this.goldText.setText(`金: ${this.gold}`);
      monster.destroy();
      this.monsters = this.monsters.filter(m => m.sprite !== monster);
    }
  }

  // 游戏结束
  gameOver() {
    this.scene.pause();
    const width = this.game.config.width;
    const height = this.game.config.height;

    this.add.rectangle(0, 0, width, height, 0x000000, 0.8)
      .setOrigin(0, 0);

    // 游戏结束文本
    this.add.text(width / 2, height / 2, '游戏结束', {
      fontSize: '64px',
      fontFamily: 'Arial, sans-serif',
      color: '#ff5555',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    // 新开始按钮
    const restartButton = this.add.text(width / 2, height / 2 + 80, '重新开始', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      backgroundColor: '#444444',
      padding: { x: 20, y: 10 },
      resolution: 2
    })
      .setOrigin(0.5)
      .setInteractive()
      .setFontStyle('bold');

    restartButton.on('pointerdown', () => {
      this.scene.restart();
    });
  }

  createGrid() {
    const topBarHeight = scaleToDPR(60);
    const bottomPanelHeight = scaleToDPR(160);

    // 计算可用的游戏区高度
    const availableHeight = this.game.config.height - topBarHeight - bottomPanelHeight;

    // 计算90%的屏幕宽度
    const maxGridWidth = this.game.config.width * 0.9;

    // 计算单个格子的理想大小
    const idealCellWidth = maxGridWidth / this.gridSize.cols;
    const idealCellHeight = availableHeight / this.gridSize.rows;

    // 使用较小的作为实际格子大小
    this.cellSize = Math.min(idealCellWidth, idealCellHeight);

    // 计算实际的网格尺寸
    const gridWidth = this.cellSize * this.gridSize.cols;
    const gridHeight = this.cellSize * this.gridSize.rows;

    // 计算网格的起始位置（水平和垂直中）
    const offsetX = (this.game.config.width - gridWidth) / 2;
    const offsetY = topBarHeight + (availableHeight - gridHeight) / 2;

    // 存储网格的全局位置信息
    this.gridOffset = { x: offsetX, y: offsetY };

    // 创建网格背景
    this.add.rectangle(
      offsetX,
      offsetY,
      gridWidth,
      gridHeight,
      0x222222
    ).setOrigin(0, 0);

    // 创建网格
    this.grid = [];
    for (let row = 0; row < this.gridSize.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.gridSize.cols; col++) {
        const x = offsetX + col * this.cellSize;
        const y = offsetY + row * this.cellSize;

        // 创建单元格背景
        const cell = this.add.rectangle(
          x,
          y,
          this.cellSize - scaleToDPR(2),
          this.cellSize - scaleToDPR(2),
          0x333333
        )
          .setOrigin(0, 0)
          .setStrokeStyle(scaleToDPR(1), 0x444444)
          .setInteractive();

        // 存储单元格信息
        this.grid[row][col] = {
          cell,
          x: x + this.cellSize / 2,
          y: y + this.cellSize / 2,
          occupied: false
        };

        // 添加单元格交互
        cell.on('pointerover', () => {
          if (!this.grid[row][col].occupied) {
            cell.setFillStyle(0x444444);
          }
        });

        cell.on('pointerout', () => {
          if (!this.grid[row][col].occupied) {
            cell.setFillStyle(0x333333);
          }
        });
      }
    }
  }

  createUI() {
    // 顶部状态栏背景
    this.add.rectangle(0, 0, this.game.config.width, 60, 0x000000, 0.7)
      .setOrigin(0, 0);

    // 设置文本配置
    const textConfig = {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      resolution: 2 // 提高文本渲染分辨率
    };

    // 生命值显示
    this.healthText = this.add.text(20, 20, `生命值: ${this.playerHealth}`, {
      ...textConfig,
      color: '#ff5555'
    }).setFontStyle('bold');

    // 金币显示
    this.goldText = this.add.text(200, 20, `金币: ${this.gold}`, {
      ...textConfig,
      color: '#ffdd55'
    }).setFontStyle('bold');

    // 波次示
    this.waveText = this.add.text(400, 20, `第 ${this.wave} 波`, {
      ...textConfig,
      color: '#55ffff'
    }).setFontStyle('bold');
  }

  createTowerPanel() {
    const towerTypes = this.towerTypes;

    const panelHeight = scaleToDPR(160);
    const panelY = this.game.config.height - panelHeight;

    // 创建滚动面容器
    const scrollPanel = this.add.container(0, panelY);

    // 添加底部面板背景
    const panelBg = this.add.rectangle(
      0,
      0,
      this.game.config.width,
      panelHeight,
      0x000000,
      0.8
    ).setOrigin(0, 0);
    scrollPanel.add(panelBg);

    // 创建一个容器来放置所有塔
    const towersContainer = this.add.container(0, 0);
    scrollPanel.add(towersContainer);

    // 调整间距和大小
    const spacing = scaleToDPR(130);
    const totalWidth = towerTypes.length * spacing;
    const startX = spacing / 2;

    // 创建滚动条背景和滚动条
    const scrollBarHeight = scaleToDPR(8);
    const scrollBarBg = this.add.rectangle(
      0,
      panelHeight - scrollBarHeight - scaleToDPR(8),
      this.game.config.width,
      scrollBarHeight,
      0x444444,
      0.6
    ).setOrigin(0, 0);
    scrollPanel.add(scrollBarBg);

    const scrollBarWidth = (this.game.config.width / totalWidth) * this.game.config.width;
    const scrollBar = this.add.rectangle(
      0,
      panelHeight - scrollBarHeight - scaleToDPR(8),
      scrollBarWidth,
      scrollBarHeight,
      0x00ff00,
      0.8
    ).setOrigin(0, 0);
    scrollPanel.add(scrollBar);

    // 定义新动条位置函数
    const updateScrollBar = (x) => {
      const scrollPercent = Math.abs(x) / maxScroll;
      const maxScrollBarX = this.game.config.width - scrollBarWidth;
      scrollBar.x = scrollPercent * maxScrollBarX;
    };

    // 滑动逻辑
    let isDragging = false;
    let dragStartX = 0;
    let scrollX = 0;
    let lastPointerX = 0;
    let dragThreshold = 10;
    let isDragThresholdMet = false;
    let initialPointerX = 0;
    let isTowerDrag = false;
    const maxScroll = Math.max(0, totalWidth - this.game.config.width);

    panelBg.setInteractive();

    panelBg.on('pointerdown', (pointer) => {
      isDragging = true;
      initialPointerX = pointer.x;
      lastPointerX = pointer.x;
      dragStartX = pointer.x - scrollX;
      isDragThresholdMet = false;
    });

    this.input.on('pointermove', (pointer) => {
      if (!isDragging || isTowerDrag) return;

      const deltaX = Math.abs(pointer.x - initialPointerX);

      // 如果还没有确定是否为面板滑动，检查移动距离
      if (!isDragThresholdMet) {
        if (deltaX > dragThreshold) {
          isDragThresholdMet = true;
        } else {
          return; // 等待确定用户意图
        }
      }

      const newX = pointer.x - dragStartX;
      const moveX = pointer.x - lastPointerX;
      lastPointerX = pointer.x;

      if (newX > 0 || newX < -maxScroll) {
        scrollX += moveX * 0.5;
      } else {
        scrollX = newX;
      }

      scrollX = Math.max(-maxScroll, Math.min(0, scrollX));
      towersContainer.x = scrollX;

      // 更新滚动条位置
      updateScrollBar(scrollX);
    });

    this.input.on('pointerup', () => {
      isDragging = false;
      isDragThresholdMet = false;
      isTowerDrag = false;
    });

    // 修改防御塔拖拽逻辑
    towerTypes.forEach((tower, index) => {
      const x = startX + spacing * index;
      const y = panelHeight / 2;

      const towerContainer = this.add.container(x, y);
      towersContainer.add(towerContainer);

      // 塔的卡片背景
      const cardBg = this.add.rectangle(0, 0, scaleToDPR(110), scaleToDPR(120), 0x333333, 0.8)
        .setStrokeStyle(scaleToDPR(1), 0x666666)
        .setOrigin(0.5)
        .setInteractive();
      towerContainer.add(cardBg);

      // 塔的图标背景
      const iconBg = this.add.circle(0, scaleToDPR(-30), scaleToDPR(32), 0x444444);
      towerContainer.add(iconBg);

      // 塔的图标
      const towerIcon = this.add.image(0, scaleToDPR(-30), tower.key)
        .setDisplaySize(scaleToDPR(50), scaleToDPR(50));
      towerContainer.add(towerIcon);

      // 塔的名称
      const nameText = this.add.text(0, scaleToDPR(10), tower.name, {
        fontSize: `${scaleToDPR(16)}px`,
        fontFamily: 'Arial',
        color: '#ffffff',
        resolution: 2,
        fontStyle: 'bold'
      }).setOrigin(0.5, 0);
      towerContainer.add(nameText);

      // 金币图标和成本
      const costContainer = this.add.container(0, scaleToDPR(35));
      towerContainer.add(costContainer);

      const coinIcon = this.add.circle(scaleToDPR(-28), 0, scaleToDPR(12), 0xffd700);
      costContainer.add(coinIcon);

      const costText = this.add.text(0, 0, tower.cost.toString(), {
        fontSize: `${scaleToDPR(20)}px`,
        fontFamily: 'Arial',
        color: '#ffd700',
        resolution: 2,
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      costContainer.add(costText);

      // 设置拖拽
      this.input.setDraggable(cardBg);

      // 添加互效果
      cardBg.on('pointerover', () => {
        cardBg.setFillStyle(0x444444, 0.8);
      });

      cardBg.on('pointerout', () => {
        cardBg.setFillStyle(0x333333, 0.8);
      });

      // 启用拖拽插件（如果还没有启用）
      if (!this.input.draggable) {
        this.input.dragDistanceThreshold = 0;
        this.input.setDraggable(cardBg);
      }

      cardBg.on('dragstart', (pointer, dragX, dragY) => {
        if (isDragThresholdMet) return;

        if (this.gold < tower.cost) {
          this.showInsufficientFundsHint(pointer.x, pointer.y);
          return;
        }

        isTowerDrag = true;
        isDragging = false;

        this.dragTower = {
          type: tower.key,
          cost: tower.cost,
          range: tower.range,
          sprite: this.add.image(pointer.x, pointer.y, tower.key)
            .setDisplaySize(this.cellSize * 0.8, this.cellSize * 0.8)
            .setAlpha(0.8)
        };

        this.createRangePreview(pointer.x, pointer.y, tower.range);
      });

      cardBg.on('drag', (pointer, dragX, dragY) => {
        if (!this.dragTower) return;

        this.dragTower.sprite.x = pointer.x;
        this.dragTower.sprite.y = pointer.y;

        const cellCoords = this.screenToGrid(pointer.x, pointer.y);

        if (this.isValidGridPosition(cellCoords.row, cellCoords.col)) {
          const centerX = this.grid[cellCoords.row][cellCoords.col].x;
          const centerY = this.grid[cellCoords.row][cellCoords.col].y;
          this.createRangePreview(centerX, centerY, this.dragTower.range);
          this.highlightValidCell(cellCoords.row, cellCoords.col);
        } else {
          this.createRangePreview(pointer.x, pointer.y, this.dragTower.range);
        }
      });

      cardBg.on('dragend', (pointer) => {
        if (!this.dragTower) return;

        const cellCoords = this.screenToGrid(pointer.x, pointer.y);
        if (this.canPlaceTower(cellCoords.row, cellCoords.col)) {
          this.placeTower(cellCoords.row, cellCoords.col, this.dragTower.type);
        }

        this.clearHighlight();
        if (this.rangePreview) {
          this.rangePreview.destroy();
          this.rangePreview = null;
        }
        this.dragTower.sprite.destroy();
        this.dragTower = null;
      });
    });

    // 添加触摸滑动惯性
    let velocity = 0;

    this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (!isDragging && !isTowerDrag && Math.abs(velocity) > 0.1) {
          scrollX += velocity;
          scrollX = Math.max(-maxScroll, Math.min(0, scrollX));
          towersContainer.x = scrollX;
          updateScrollBar(scrollX);
          velocity *= 0.95;
        }
      }
    });
  }

  screenToGrid(x, y) {
    const relativeX = x - this.gridOffset.x;
    const relativeY = y - this.gridOffset.y;

    const col = Math.floor(relativeX / this.cellSize);
    const row = Math.floor(relativeY / this.cellSize);

    // 确保返回的坐标在有效范围内
    return {
      row: Math.max(0, Math.min(row, this.gridSize.rows - 1)),
      col: Math.max(0, Math.min(col, this.gridSize.cols - 1))
    };
  }

  canPlaceTower(row, col) {
    return row >= 0 && row < this.gridSize.rows &&
      col >= 0 && col < this.gridSize.cols &&
      this.grid[row] &&
      this.grid[row][col] &&
      !this.grid[row][col].occupied;
  }

  startCountdown() {
    let count = 3;

    // 显示倒计时文本
    this.countdownText.setVisible(true);

    // 创建倒计时定时器
    const countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (count > 0) {
          // 更新倒计时文本
          this.countdownText.setText(count.toString());

          // 添加缩放动画
          this.tweens.add({
            targets: this.countdownText,
            scale: { from: 1.5, to: 1 },
            duration: 500,
            ease: 'Cubic.out'
          });

          count--;
        } else {
          // 显示开始文本
          this.countdownText.setText('开始!');

          // 添加消失动画
          this.tweens.add({
            targets: this.countdownText,
            scale: { from: 1, to: 2 },
            alpha: { from: 1, to: 0 },
            duration: 800,
            ease: 'Cubic.out',
            onComplete: () => {
              this.countdownText.setVisible(false);
              this.countdownText.setScale(1);
              this.countdownText.setAlpha(1);

              // 开始第一波
              this.startWave();
            }
          });

          // 停止定时器
          countdownTimer.destroy();
        }
      },
      callbackScope: this,
      loop: true
    });
  }

  startWave() {
    if (this.isWaveActive) return;

    this.isWaveActive = true;
    this.monstersRemaining = 5 + Math.floor(this.wave * 1.5);

    // 更新波次进度显示
    this.updateWaveProgress();

    // 创建并保存定时生成怪物的事件引用
    this.monsterSpawnEvent = this.time.addEvent({
      delay: this.monsterSpawnInterval,
      callback: this.spawnMonster,
      callbackScope: this,
      repeat: this.monstersRemaining - 1
    });
  }

  startNextWave() {
    this.wave++;
    this.waveText.setText(`波次: ${this.wave}`);

    // 保存波次计时器引用
    this.waveTimer = this.time.delayedCall(3000, () => {
      this.startWave();
    });
  }

  spawnMonster() {
    const type = Phaser.Utils.Array.GetRandom(this.monsterTypes);
    const randomCol = Math.floor(Math.random() * this.gridSize.cols);
    const x = this.gridOffset.x + (randomCol + 0.5) * this.cellSize;

    const waveMultiplier = 1 + (this.wave - 1) * 0.08;

    const monster = {
      sprite: this.add.image(x, -30, type.key),
      type: type.key,
      column: randomCol,
      level: Number(type.level),
      speed: Number(type.speed) * (1 + (this.wave - 1) * 0.05),
      attack: Number(type.attack) * waveMultiplier,
      defense: Number(type.defense) * waveMultiplier,
      health: type.health * waveMultiplier,
      maxHealth: type.health * waveMultiplier,
      attackSpeed: Number(type.attackSpeed) * waveMultiplier,
      attackRange: Number(type.attackRange) * waveMultiplier,
      reward: Number(type.reward) * waveMultiplier,
      skill: type.skill,
      effects: [],
      lastSkillUse: 0,
      isDying: false
    };

    // 设置怪物图片大小
    monster.sprite.setDisplaySize(scaleToDPR(40), scaleToDPR(40));

    // 创建血条 - 调整Y轴位置，使其紧贴怪物上方
    monster.healthBar = this.createHealthBar(
      x,
      x - scaleToDPR(25), // 调整为更小的偏移值使血条更贴近怪物
      scaleToDPR(40),
      scaleToDPR(4),
      true
    );

    // 添加到怪物数组
    this.monsters.push(monster);

    return monster;
  }

  // 添加高亮方法
  highlightValidCell(row, col) {
    this.clearHighlight();

    // 检查坐标是否有
    if (row >= 0 && row < this.gridSize.rows &&
      col >= 0 && col < this.gridSize.cols) {
      if (this.canPlaceTower(row, col)) {
        this.grid[row][col].cell.setStrokeStyle(2, 0x00ff00);
      } else {
        this.grid[row][col].cell.setStrokeStyle(2, 0xff0000);
      }
    }
  }

  // 清除高亮
  clearHighlight() {
    if (!this.grid) return;

    for (let row = 0; row < this.gridSize.rows; row++) {
      for (let col = 0; col < this.gridSize.cols; col++) {
        if (this.grid[row] && this.grid[row][col]) {
          this.grid[row][col].cell.setStrokeStyle(1, 0x444444);
        }
      }
    }
  }

  // 添加金币不足提示
  showInsufficientFundsHint(x, y) {
    const text = this.add.text(x, y - 30, '金币不足!', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ff0000',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 },
      resolution: 2
    }).setOrigin(0.5);

    // 添加动画效果
    this.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  // 添加���建范围预览的方法
  createRangePreview(x, y, range) {
    // 如果已存在范围预览，先销毁它
    if (this.rangePreview) {
      this.rangePreview.destroy();
    }

    // 计算范围圆形的半径格子数 * 格子大小
    const radius = range * this.cellSize;

    // 创建个图形对象
    this.rangePreview = this.add.graphics();

    // 设置紫色边框
    this.rangePreview.lineStyle(2, 0x6a0dad);

    // 设置半透明紫色填充
    this.rangePreview.fillStyle(0x9370db, 0.3);

    // 绘制圆形
    this.rangePreview.beginPath();
    this.rangePreview.arc(x, y, radius, 0, Math.PI * 2);
    this.rangePreview.closePath();
    this.rangePreview.fillPath();
    this.rangePreview.strokePath();
  }

  // 添加位置验证法
  isValidGridPosition(row, col) {
    return row >= 0 && row < this.gridSize.rows &&
      col >= 0 && col < this.gridSize.cols;
  }

  // 添加创建血条方法
  createHealthBar(x, y, width, height, isMonster = false) {
    const background = this.add.rectangle(x, y, width, height, 0x000000);
    background.setOrigin(0.5, 0.5);

    const bar = this.add.rectangle(
      x - width / 2,
      y,
      width,
      height,
      isMonster ? 0xff0000 : 0x00ff00
    );
    bar.setOrigin(0, 0.5);

    return {
      background: background,
      bar: bar,
      width: width,
      height: height,
      isMonster: isMonster
    };
  }

  // 更新血条的方法
  updateHealthBar(healthBar, percentage) {
    if (healthBar && healthBar.bar) {
      healthBar.bar.scaleX = Math.max(0, percentage);

      if (healthBar.isMonster) {
        // 怪物血条：红色渐变
        let color;
        if (percentage > 0.6) {
          color = 0xff0000; // 深红
        } else if (percentage > 0.3) {
          color = 0xff3333; // 中红
        } else {
          color = 0xff6666; // 浅红
        }
        healthBar.bar.setFillStyle(color);
      } else {
        // 防御塔血条：绿色渐变
        let color;
        if (percentage > 0.6) {
          color = 0x00ff00; // 深绿
        } else if (percentage > 0.3) {
          color = 0xffff00; // 黄色
        } else {
          color = 0xff6600; // 橙色
        }
        healthBar.bar.setFillStyle(color);
      }
    }
  }

  // 在创建怪物时添加血
  createMonster(type, path) {
    const monster = {
      sprite: this.add.image(path[0].x, path[0].y, type),
      currentPoint: 0,
      path: path,
      health: 100, // 设置初始命值
      maxHealth: 100, // 设置大生命值
      speed: 1
    };

    // 设置怪物图片大小
    monster.sprite.setDisplaySize(scaleToDPR(40), scaleToDPR(40));

    // 创建血条并定位到怪物上方
    monster.healthBar = this.createHealthBar(
      path[0].x,
      path[0].y - 25, // 位于怪物上方
      scaleToDPR(40), // 血条宽度
      scaleToDPR(4)   // 血条高度
    );

    // 将怪物添加到数组中
    this.monsters.push(monster);

    return monster;
  }

  // 在怪物受到伤害时更新血条
  damageMonster(monster, damage) {
    // 确保damage是数字
    const damageAmount = Number(damage) || 0;

    // 计算实际伤害（考虑防御力）
    const actualDamage = Math.max(1, Math.floor(damageAmount - monster.defense));
    monster.health = Math.max(0, monster.health - actualDamage);

    // 更新血条
    const healthPercentage = Math.max(0, monster.health / monster.maxHealth);
    this.updateHealthBar(monster.healthBar, healthPercentage);

    // 显示伤害数字
    this.showDamageNumber(monster.sprite.x, monster.sprite.y, actualDamage);

    // 检查是否死亡
    if (monster.health <= 0 && !monster.isDying) {
      this.playDeathAnimation(monster);
      return true; // 返回true表示怪物已死亡
    }
    return false; // 返回false表示物存活
  }

  // 显示伤害数字
  showDamageNumber(x, y, damage) {
    const damageText = this.add.text(x, y - scaleToDPR(20), `-${damage}`, {
      fontSize: `${scaleToDPR(20)}px`,
      fontFamily: 'Arial',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: scaleToDPR(2)
    }).setOrigin(0.5);

    this.tweens.add({
      targets: damageText,
      y: y - scaleToDPR(50),
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => damageText.destroy()
    });
  }

  // 播放死亡动画
  playDeathAnimation(monster) {
    monster.isDying = true;

    // 使用粒子系统
    const emitter = this.add.particles(0, 0, 'particle', {
      x: monster.sprite.x,
      y: monster.sprite.y,
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },    // 稍微调小粒子大小
      blendMode: 'ADD',
      lifespan: 600,                    // 缩短粒子持续时间
      quantity: 15,                     // 少粒子数量
      tint: [0xff0000, 0xff6666, 0xffcccc]
    });

    // 整死亡动画
    this.tweens.add({
      targets: monster.sprite,
      alpha: 0,
      scale: 1.2,                      // 减小放大比例，从1.5改为1.2
      duration: 600,                   // 缩短动画时间从800改为600
      ease: 'Power2',
      onComplete: () => {
        // 清理资源
        emitter.destroy();
        monster.healthBar.background.destroy();
        monster.healthBar.bar.destroy();
        monster.sprite.destroy();

        // 给予奖励
        this.gold += monster.reward;
        this.goldText.setText(`金币: ${this.gold}`);

        // 显示奖励文本
        this.showRewardText(monster.sprite.x, monster.sprite.y, monster.reward);

        // 从数组中移除怪物
        const index = this.monsters.indexOf(monster);
        if (index > -1) {
          this.monsters.splice(index, 1);
        }
      }
    });

    // 血条淡出
    this.tweens.add({
      targets: [monster.healthBar.background, monster.healthBar.bar],
      alpha: 0,
      duration: 600                    // 同步血条淡出时间
    });
  }

  // 显示奖励文本
  showRewardText(x, y, amount) {
    const rewardText = this.add.text(x, y, `+${amount}`, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: rewardText,
      y: y - 40,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => rewardText.destroy()
    });
  }

  // 添加销方法
  destroy() {
    if (this.monsters) {
      this.monsters.forEach(monster => {
        if (monster.healthBar) {
          monster.healthBar.background.destroy();
          monster.healthBar.bar.destroy();
        }
        if (monster.sprite) {
          monster.sprite.destroy();
        }
      });
    }
    this.monsters = [];
  }

  // 创建怪物路径
  createMonsterPath() {
    return null;
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

  // 更新防御塔血条位置
  updateTowerHealthBarPosition(tower) {
    if (tower.healthBar) {
      tower.healthBar.background.x = tower.sprite.x;
      tower.healthBar.background.y = tower.sprite.y - this.cellSize / 2;
      tower.healthBar.bar.x = tower.sprite.x - tower.healthBar.background.width / 2;
      tower.healthBar.bar.y = tower.sprite.y - this.cellSize / 2;
    }
  }

  // 添加调试精灵的治疗功能
  healNearbyTowers(sourceTower, healAmount) {
    const healRadius = sourceTower.range * this.cellSize;

    this.towers.forEach(tower => {
      if (tower.id !== sourceTower.id) { // 不治疗自己
        const distance = Phaser.Math.Distance.Between(
          sourceTower.sprite.x,
          sourceTower.sprite.y,
          tower.sprite.x,
          tower.sprite.y
        );

        if (distance <= healRadius) {
          // 计算治疗量
          const healing = healAmount;
          tower.health = Math.min(tower.maxHealth, tower.health + healing);

          // 更新血条
          const healthPercentage = tower.health / tower.maxHealth;
          this.updateHealthBar(tower.healthBar, healthPercentage);

          // 显示治疗数字
          this.showHealNumber(tower.sprite.x, tower.sprite.y, healing);

          // 创建治疗特效
          this.createHealEffect(sourceTower, tower);
        }
      }
    });
  }

  // 显示治疗数字
  showHealNumber(x, y, amount) {
    const healText = this.add.text(x, y - 20, `+${amount}`, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: healText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => healText.destroy()
    });
  }

  // 创建治疗特效
  createHealEffect(sourceTower, targetTower) {
    // 创建治疗光
    const line = this.add.graphics();
    line.lineStyle(2, 0x00ffff, 1);
    line.beginPath();
    line.moveTo(sourceTower.sprite.x, sourceTower.sprite.y);
    line.lineTo(targetTower.sprite.x, targetTower.sprite.y);
    line.strokePath();

    // 创建治疗粒子
    const particles = this.add.particles(0, 0, 'particle', {
      x: targetTower.sprite.x,
      y: targetTower.sprite.y,
      speed: { min: 30, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 500,
      quantity: 8,
      tint: 0x00ffff
    });

    // 动画效果
    this.tweens.add({
      targets: line,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        line.destroy();
        particles.destroy();
      }
    });
  }

  // 添加产生金币的功能
  generateGold(tower, amount) {
    // 创建金币图标位置（在防御塔稍微上方）
    const coinX = tower.sprite.x;
    const coinY = tower.sprite.y - 30;

    // 创建金币图标
    const coinIcon = this.add.circle(
      coinX,
      coinY,
      12,
      0xffd700
    );

    // 创建金币符号
    const coinSymbol = this.add.text(
      coinX,
      coinY,
      '₿',
      {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#000000'
      }
    ).setOrigin(0.5);

    // 创建金币数量文本
    const amountText = this.add.text(
      coinX + 20,
      coinY,
      `+${amount}`,
      {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0, 0.5);

    // 简单的淡出动画
    this.tweens.add({
      targets: [coinIcon, coinSymbol, amountText],
      alpha: 0,
      y: coinY - 20,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        coinIcon.destroy();
        coinSymbol.destroy();
        amountText.destroy();
      }
    });

    // 立即更金币数量
    this.gold += amount;
    this.goldText.setText(`金币: ${this.gold}`);

    // 简单的闪光效果
    const flash = this.add.circle(tower.sprite.x, tower.sprite.y, 25, 0xffd700, 0.3);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.2,
      duration: 500,
      onComplete: () => flash.destroy()
    });

    // 添加金币数字跳动效果
    this.tweens.add({
      targets: this.goldText,
      scale: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Quad.out',
      onComplete: () => {
        this.goldText.setScale(1);
      }
    });
  }

  // 添加查找目标的函数
  findTarget(tower) {
    const towerType = this.towerTypes.find(t => t.key === tower.type);
    const range = towerType.range * this.cellSize;
    let nearestMonster = null;
    let shortestDistance = Infinity;

    // 遍历所有怪物
    this.monsters.forEach(monster => {
      // 跳过正在死亡的怪物
      if (monster.isDying) return;

      // 计算与防御塔的距离
      const distance = Phaser.Math.Distance.Between(
        tower.sprite.x,
        tower.sprite.y,
        monster.sprite.x,
        monster.sprite.y
      );

      // 检查是否在攻击范围内
      if (distance <= range) {
        // 根据防御塔类型选择目标
        switch (towerType.targetStrategy) {
          case 'nearest':
            // 选择最近的目标
            if (distance < shortestDistance) {
              shortestDistance = distance;
              nearestMonster = monster;
            }
            break;

          case 'strongest':
            // 选择血量最高的目标
            if (!nearestMonster || monster.health > nearestMonster.health) {
              if (distance <= range) {
                nearestMonster = monster;
              }
            }
            break;

          case 'weakest':
            // 选择血量最低的目标
            if (!nearestMonster || monster.health < nearestMonster.health) {
              if (distance <= range) {
                nearestMonster = monster;
              }
            }
            break;

          default:
            // 默认选择最近的目标
            if (distance < shortestDistance) {
              shortestDistance = distance;
              nearestMonster = monster;
            }
            break;
        }
      }
    });

    return nearestMonster;
  }

  // 更新波次进度显示
  updateWaveProgress() {
    if (this.isWaveActive && this.monstersRemaining > 0) {
      this.waveProgress.setText(`剩余: ${this.monstersRemaining}`);
    } else {
      this.waveProgress.setText('准备就绪');
    }
  }

  // 修改暂停/继续功能
  togglePause() {
    if (this.scene.isPaused()) {
      // 继续游戏
      this.scene.resume();
      this.pauseMenu.setVisible(false);
      this.pauseText.setText('暂停');

      // 恢复所有计时器事件
      if (this.monsterSpawnEvent) {
        this.monsterSpawnEvent.paused = false;
      }

      // 恢复所有动画
      this.tweens.resumeAll();

      // 恢复游速度
      this.game.loop.wake();
    } else {
      // 暂停游戏
      this.scene.pause();
      this.pauseMenu.setVisible(true);
      this.pauseText.setText('已暂停');

      // 暂停所有计时器事件
      if (this.monsterSpawnEvent) {
        this.monsterSpawnEvent.paused = true;
      }

      // 暂停所有动画
      this.tweens.pauseAll();

      // 暂停游戏速度
      this.game.loop.sleep();
    }
  }

  // 创建暂停菜单
  createPauseMenu() {
    this.pauseMenu = this.add.container(this.game.config.width / 2, this.game.config.height / 2);
    this.pauseMenu.setDepth(2000);
    this.pauseMenu.setVisible(false);

    // 创建暂停菜单背景
    const menuBg = this.add.rectangle(0, 0, scaleToDPR(300), scaleToDPR(400), 0x000000, 0.8);

    // 创建暂停标题
    const pauseTitle = this.add.text(0, scaleToDPR(-150), '游戏暂停', {
      fontSize: `${scaleToDPR(32)}px`,
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 继续按钮
    const resumeButton = this.add.rectangle(0, 0, scaleToDPR(200), scaleToDPR(40), 0x4CAF50)
      .setInteractive();
    const resumeText = this.add.text(0, 0, '继续游戏', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 添加按钮悬停效果
    resumeButton.on('pointerover', () => {
      resumeButton.setFillStyle(0x45a049);
      this.input.setDefaultCursor('pointer');
    });

    resumeButton.on('pointerout', () => {
      resumeButton.setFillStyle(0x4CAF50);
      this.input.setDefaultCursor('default');
    });

    resumeButton.on('pointerup', () => {
      this.togglePause();
    });

    this.pauseMenu.add([menuBg, pauseTitle, resumeButton, resumeText]);
  }

  // 创建退出确认对话框
  createExitConfirm() {
    this.exitConfirm = this.add.container(this.game.config.width / 2, this.game.config.height / 2);
    this.exitConfirm.setDepth(2000);
    this.exitConfirm.setVisible(false);

    // 创建半透明背景
    const exitBg = this.add.rectangle(0, 0, scaleToDPR(400), scaleToDPR(200), 0x000000, 0.8);
    
    // 创建标题文本
    const exitTitle = this.add.text(0, scaleToDPR(-50), '确定要退出游戏吗？', {
      fontSize: `${scaleToDPR(24)}px`,
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 创建确认按钮组
    const confirmGroup = this.add.container(scaleToDPR(-80), scaleToDPR(30));
    const confirmButton = this.add.rectangle(0, 0, scaleToDPR(120), scaleToDPR(40), 0xff4444);
    const confirmText = this.add.text(0, 0, '确认', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    confirmGroup.add([confirmButton, confirmText]);

    // 创建取消按钮组
    const cancelGroup = this.add.container(scaleToDPR(80), scaleToDPR(30));
    const cancelButton = this.add.rectangle(0, 0, scaleToDPR(120), scaleToDPR(40), 0x4CAF50);
    const cancelText = this.add.text(0, 0, '取消', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    cancelGroup.add([cancelButton, cancelText]);

    // 设置按钮交互
    confirmButton.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        confirmButton.setFillStyle(0xe03939);
        this.input.setDefaultCursor('pointer');
        console.log('确认按钮悬停');
      })
      .on('pointerout', () => {
        confirmButton.setFillStyle(0xff4444);
        this.input.setDefaultCursor('default');
      })
      .on('pointerdown', () => {
        console.log('确认按钮点击');
        this.shutdown();
        this.scene.stop();
        this.scene.start('MenuScene');
      });

    cancelButton.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        cancelButton.setFillStyle(0x45a049);
        this.input.setDefaultCursor('pointer');
        console.log('取消按钮悬停');
      })
      .on('pointerout', () => {
        cancelButton.setFillStyle(0x4CAF50);
        this.input.setDefaultCursor('default');
      })
      .on('pointerdown', () => {
        console.log('取消按钮点击');
        this.exitConfirm.setVisible(false);
        if (this.scene.isPaused()) {
          this.scene.resume();
        }
      });

    // 将所有元素添加到主容器
    this.exitConfirm.add([
      exitBg,
      exitTitle,
      confirmGroup,
      cancelGroup
    ]);

    // 确保整个对话框区域可以接收输入
    exitBg.setInteractive();

    // 添加到场景
    this.add.existing(this.exitConfirm);
  }

  // 显示退出确认对话框
  showExitConfirmation() {
    console.log('显示退出确认对话框');
    this.exitConfirm.setVisible(true);
    this.exitConfirm.setActive(true);
    
    if (!this.scene.isPaused()) {
      console.log('暂停游戏');
      this.scene.pause();
    }
  }

  // 添加场景恢复方法
  resume() {
    // 确保所有UI元素状态正确
    this.pauseMenu.setVisible(false);
    this.exitConfirm.setVisible(false);
    this.pauseText.setText('暂停');

    // 恢复游戏循环
    this.game.loop.wake();

    // 恢复计时器
    if (this.monsterSpawnEvent) {
      this.monsterSpawnEvent.paused = false;
    }

    // 恢复动画
    this.tweens.resumeAll();
  }

  // 添加场景清理方法
  shutdown() {
    // 清理计时器
    if (this.monsterSpawnEvent) {
      this.monsterSpawnEvent.destroy();
    }
    if (this.waveTimer) {
      this.waveTimer.destroy();
    }

    // 清理动画
    this.tweens.killAll();

    // 移盘事件监听
    this.input.keyboard.off('keydown-ESC');
  }

  // 在塔的攻击方法中使用
  attackMonster(tower, monster) {
    if (!tower || !monster || monster.isDying) return;

    const towerType = this.towerTypes.find(t => t.key === tower.type);
    
    // 清理旧特效
    if (tower.currentEffect) {
      this.clearTowerEffects(tower);
    }

    // 创建新的攻击特效
    tower.currentEffect = this.createAttackEffect(tower, monster, tower.attackColor || 0x00ff00);

    if (towerType.key === 'algo_cannon') {
      // 算法炮台的范围伤害
      const aoeRadius = this.cellSize * 1.5;
      
      // 找出范围内的所有怪物
      this.monsters.forEach(targetMonster => {
        if (targetMonster.isDying) return;

        const distance = Phaser.Math.Distance.Between(
          monster.sprite.x,
          monster.sprite.y,
          targetMonster.sprite.x,
          targetMonster.sprite.y
        );

        // 如果在爆炸范围内
        if (distance <= aoeRadius) {
          // 计算伤害衰减（距离中心越远伤害越低）
          const damageRatio = Math.max(0.5, 1 - (distance / aoeRadius));
          // 确保基础伤害值存在
          const baseDamage = tower.attack || towerType.attack || 15;
          // 计算最终伤害
          const damage = Math.max(1, Math.floor(baseDamage * damageRatio));
          
          console.log('AOE Damage:', {
            baseDamage,
            damageRatio,
            finalDamage: damage,
            monsterDefense: targetMonster.defense
          });
          
          // 对范围内的怪物造成伤害
          this.damageMonster(targetMonster, damage);

          // 显示伤害数字
          this.showDamageNumber(
            targetMonster.sprite.x,
            targetMonster.sprite.y,
            damage,
            0xff4400
          );
        }
      });

      // 显示范围指示器
      this.showAOEIndicator(monster.sprite.x, monster.sprite.y, aoeRadius);

      return true;
    } else {
      // 其他防御塔的单体伤害
      // 确保使用正确的攻击力值
      const baseDamage = tower.attack || towerType.attack || 10;
      const monsterDefense = monster.defense || 0;
      const damage = Math.max(1, Math.floor(baseDamage - monsterDefense));
      
      console.log('Single Target Damage:', {
        baseDamage,
        monsterDefense,
        finalDamage: damage
      });

      return this.damageMonster(monster, damage);
    }
  }

  // 添加范围指示器显示方法
  showAOEIndicator(x, y, radius) {
    const indicator = this.add.circle(x, y, radius, 0xff0000, 0.2);
    
    this.tweens.add({
      targets: indicator,
      alpha: 0,
      scale: 1.2,
      duration: 500,
      ease: 'Power2',
      onComplete: () => indicator.destroy()
    });
  }

  // 修改伤害数字显示方法，添加颜色参数
  showDamageNumber(x, y, amount, color = 0xff0000) {
    const damageText = this.add.text(x, y - scaleToDPR(20), amount.toString(), {
      fontSize: `${scaleToDPR(20)}px`,
      fontFamily: 'Arial',
      color: `#${color.toString(16)}`,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: damageText,
      y: y - scaleToDPR(50),
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => damageText.destroy()
    });
  }

  // 在怪物死亡或离开攻击范围时也要清理特效
  clearTowerEffects(tower) {
    if (tower.currentEffect) {
      tower.currentEffect.line?.destroy();
      tower.currentEffect.startPoint?.destroy();
      tower.currentEffect.endPoint?.destroy();
      tower.currentEffect.particles?.destroy();
      tower.currentEffect = null;
    }
  }
} 