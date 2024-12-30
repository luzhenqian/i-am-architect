import Phaser from 'phaser';
import { scaleToDPR } from '../shared/utils';
import { TowerManager } from './managers/TowerManager';
import { MonsterManager } from './managers/MonsterManager';
import { ConfigManager } from '../config/ConfigManager';

export default class GameScene extends Phaser.Scene {
  constructor(data) {
    super({ key: 'GameScene' });
    this.config = ConfigManager.getInstance();
    this.gridSize = this.config.gameConfig.gridSize;
    this.cellSize = this.config.gameConfig.cellSize;
    this.initialGold = this.config.gameConfig.initialGold;
    this.gold = this.config.gameConfig.initialGold;
    this.playerHealth = this.config.gameConfig.initialHealth;
    this.wave = 1;
    this.countdown = 3;
    this.isWaveActive = false;
    this.monsterReward = 25;
    this.monsterSpawnInterval = 2500;
    this.monsterTypes = this.config.monsterConfig.monsterTypes;
    this.towerTypes = this.config.towerConfig.towerTypes;
    this.lastAttackTime = {};
    this.codeBlocks = [];
    this.isGameOver = false;
    this.onBack = data?.onBack; // 保存回调函数
    this.level = 1;
    this.experience = 0;
    this.nextLevelExp = this.config.levelConfig.getNextLevelExp(this.level);

    this.towerManager = new TowerManager(this);
    this.monsterManager = new MonsterManager(this);
  }

  init(data) {
    // 在 init 方法中获取回调函数
    this.onBack = data?.onBack;
  }

  preload() {
    // 加载资源
    this.load.setBaseURL('/');

    // 加载防御塔图片
    this.config.towerConfig.towerTypes.forEach(tower => {
      this.load.image(tower.key, tower.image);
    });

    // 加载怪物图片
    this.config.monsterConfig.monsterTypes.forEach(monster => {
      this.load.image(monster.key, monster.image);
    });

    // 加载UI元素
    // 传送门
    this.load.image('portal', 'assets/images/portal.png');
    // 机器核心
    this.load.image('core', 'assets/images/core.png');
    this.load.image('level', 'assets/images/level.png');
    this.load.image('coin', 'assets/images/coin.png');
    this.load.image('pause', 'assets/images/pause.png');
    // this.load.image('grid', 'assets/ui/grid.png');
    // this.load.image('tower_base', 'assets/ui/tower_base.png');
    // 背景
    this.load.image('bg', 'assets/images/bg.png');
    this.config.towerConfig.towerTypes.forEach(tower => {
      // 只为有攻击能力的防御塔加载音效
      if (!['blockchain_node', 'firewall'].includes(tower.key)) {
        try {
          this.load.audio(`${tower.key}_attack`, `assets/effects/attack/${tower.key}.wav`);
        } catch (error) {
          console.warn(`Warning: Attack sound effect not found for tower: ${tower.key}`);
        }
      }
      // 加载防御塔摧毁音效
      this.load.audio(`${tower.key}_die`, `assets/effects/die/${tower.key}.wav`);
    });

    // 加载背景乐
    this.load.audio('bgm', `assets/music/bg.mp3`);
  }

  create() {
    console.log('GameScene create started');

    // 在create方法开始处添加背景音乐播放
    this.bgMusic = this.sound.add('bgm', {
      volume: 0.3,
      loop: true
    });
    this.bgMusic.play();

    // 添加背景图
    this.add.image(0, 0, 'bg')
      .setOrigin(0)
      .setDisplaySize(this.game.config.width, this.game.config.height)
      .setDepth(-1)
      .setAlpha(1); // 降低不透明度让背景不那么显眼

    // 创建游戏背景
    this.add.rectangle(0, 0, this.game.config.width, this.game.config.height, 0x1a1a1a)
      .setOrigin(0, 0)
      .setDepth(-2);

    // 计算适配尺寸
    const { width, height } = this.calculateGameDimensions();

    // 设置游戏区域
    this.gridOffset = {
      x: (this.game.config.width - width) / 2,
      y: this.topBarHeight + (height - this.topBarHeight - this.bottomPanelHeight - width) / 2
    };

    // 计算单个格子大小
    this.cellSize = width / this.gridSize.cols;

    // 创建网格
    this.createGrid();

    // 创建塔防选择面板
    this.createTowerPanel();

    // 创建顶部信息栏背景
    this.createTopBar();

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

  // 计算游戏尺寸
  calculateGameDimensions() {
    const screenWidth = this.game.config.width;
    const screenHeight = this.game.config.height;
    const availableHeight = screenHeight - this.topBarHeight - this.bottomPanelHeight;

    // 计算最大可用宽度和高度
    const maxWidth = screenWidth;
    const maxHeight = availableHeight;

    // 选择较小的尺寸作为游戏区域大小
    const gameSize = Math.min(maxWidth, maxHeight);

    return {
      width: gameSize,
      height: screenHeight
    };
  }

  // 创建底部面板
  createBottomPanel() {
    const panelHeight = scaleToDPR(120);
    const scrollPanel = this.add.container(
      0,
      this.game.config.height - panelHeight
    );
    scrollPanel.setDepth(1000);

    // 面板背景
    const panelBg = this.add.rectangle(
      0,
      0,
      this.game.config.width,
      panelHeight,
      0x000000,
      0.8  // 设置半透明
    ).setOrigin(0);
  }

  update(time, delta) {
    // 只在非拖拽状态下更新游戏逻辑
    if (!this.isDragging) {
      this.monsterManager.update(time, delta);
      this.towerManager.update(time, delta);

      // 更新所有防御塔的血条位置
      this.towerManager.towers.forEach(tower => {
        this.towerManager.updateTowerHealthBarPosition(tower);
      });

      // 更新波次进度
      this.updateWaveProgress();
    }
  }

  // 创建顶部信息栏背景
  createTopBar() {
    const topBarHeight = scaleToDPR(60);
    const depth = 2000;

    // 创建顶部栏背景并设置深度和半透明
    const topBar = this.add.rectangle(0, 0, this.game.config.width, topBarHeight, 0x333333)
      .setOrigin(0, 0)
      .setAlpha(0.1) // 降低不透明度
      .setDepth(depth)
      .setScrollFactor(0);

    // 第一行 Y 坐标
    const firstRowY = topBarHeight / 3;

    // 左侧: 等级和经验条
    const levelStartX = scaleToDPR(20);
    const levelIcon = this.add.image(levelStartX, firstRowY, 'level')
      .setDisplaySize(scaleToDPR(48), scaleToDPR(48))
      .setDepth(depth + 5);

    // 等级文字添加黑色描边以增加可读性
    this.levelText = this.add.text(levelStartX, firstRowY, `${this.level || 1}`, {
      fontSize: `${scaleToDPR(14)}px`,
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',      // 添加黑色描边
      strokeThickness: 2      // 设置描边宽度
    }).setOrigin(0.5).setDepth(depth + 6);

    // 经验条背景
    const expBarX = levelStartX + scaleToDPR(0);
    const expBarBg = this.add.rectangle(
      expBarX,
      firstRowY,
      scaleToDPR(100),
      scaleToDPR(6),
      0x333333,
      0.8 // 设置半透明
    ).setOrigin(0, 0.5).setDepth(depth + 1);

    // 经验条
    this.expBar = this.add.rectangle(
      expBarX,
      firstRowY,
      scaleToDPR(100) * ((this.experience || 0) / (this.nextLevelExp || 100)),
      scaleToDPR(6),
      0x00ff00,
      1 // 略微半透明
    ).setOrigin(0, 0.5).setDepth(depth + 2);

    // 中间: 金币
    const coinX = this.game.config.width / 2 - scaleToDPR(0);
    const coinIcon = this.add.image(coinX, firstRowY, 'coin')
      .setDisplaySize(scaleToDPR(34), scaleToDPR(34))
      .setDepth(depth);

    // 增加金币文字的阴影以提高可读性
    this.goldText = this.add.text(coinX + scaleToDPR(20), firstRowY, `${this.gold}`, {
      fontSize: `${scaleToDPR(16)}px`,
      fontFamily: 'Arial',
      color: '#ffd700',
      stroke: '#000000', // 添加描边
      strokeThickness: 2 // 描边宽度
    }).setOrigin(0, 0.5).setDepth(depth);

    // 右侧: 波次文本
    const waveX = this.game.config.width - scaleToDPR(20); // 改为距离右边20像素
    this.waveText = this.add.text(waveX, firstRowY, `第 ${this.wave} 波`, {
      fontSize: `${scaleToDPR(14)}px`,
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000', // 添加描边
      strokeThickness: 1 // 描边宽度
    }).setOrigin(1, 0.5).setDepth(depth); // 改为右对齐(1, 0.5)

    // 第二行只有暂停按钮 (右侧)
    const secondRowY = topBarHeight * 2 / 3 + scaleToDPR(4);
    const pauseButton = this.add.image(
      this.game.config.width - scaleToDPR(30),
      secondRowY,
      'pause'
    )
      .setDisplaySize(scaleToDPR(32), scaleToDPR(32))
      .setInteractive()
      .setDepth(depth);

    // 暂停按钮交互
    pauseButton.on('pointerover', () => {
      this.input.setDefaultCursor('pointer');
    });

    pauseButton.on('pointerout', () => {
      this.input.setDefaultCursor('default');
    });

    pauseButton.on('pointerdown', () => {
      this.showPauseDialog();
    });

    // 添加键盘ESC键暂停/继续功能
    this.input.keyboard.on('keydown-ESC', () => {
      this.showPauseDialog();
    });

    // 创建暂停菜单
    this.createPauseMenu();

    // 创建退出确认对话框
    this.createExitConfirm();

    // 确保暂停菜单和退出确认框在场景暂停时仍然可以交互
    this.pauseMenu.setDepth(2000);
    this.exitConfirm.setDepth(2000);

    // 添加波次进度指示器
    this.waveProgress = this.add.text(this.game.config.width - scaleToDPR(30), topBarHeight - scaleToDPR(10), '', {
      fontSize: `${scaleToDPR(14)}px`,
      fontFamily: 'Arial',
      color: '#aaaaaa'
    }).setOrigin(1, 1);

    // 更新波次进度显示方法
    this.updateWaveProgress = () => {
      if (this.isWaveActive && this.monstersRemaining > 0) {
        this.waveText.setText(`第 ${this.wave} 波 (${this.monstersRemaining})`);
      } else {
        this.waveText.setText(`第 ${this.wave} 波`);
      }
    };
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

  // 显示治疗数字
  showHealNumber(x, y, amount) {
    const healText = this.add.text(x, y - scaleToDPR(20), `+${amount}`, {
      fontSize: `${scaleToDPR(20)}px`,
      fontFamily: 'Arial',
      color: '#00ff88',
      stroke: '#003311',
      strokeThickness: scaleToDPR(3),
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#003311',
        blur: 3,
        fill: true
      }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: healText,
      y: y - scaleToDPR(50),
      alpha: 0,
      scale: { from: 1, to: 1.2 },
      duration: 1000,
      ease: 'Quad.out',
      onComplete: () => healText.destroy()
    });
  }

  // 寻找塔的目标
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
      this.updateGold(this.gold + monsterData.reward);
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
      this.cleanupGameData();
      this.scene.restart();
    });
  }


  // 添加清理游戏数据的方法
  cleanupGameData() {
    // 清除所有防御塔
    if (this.towerManager.towers) {
      this.towerManager.towers.forEach(tower => {
        if (tower.sprite) tower.sprite.destroy();
        if (tower.healthBar) {
          tower.healthBar.background.destroy();
          tower.healthBar.bar.destroy();
        }
        // 清除特殊防御塔的定时器
        if (tower.goldGenerationEvent) tower.goldGenerationEvent.destroy();
        if (tower.healingEvent) tower.healingEvent.destroy();
      });
      this.towerManager.towers = [];
    }

    // 清除所有怪物
    if (this.monsters) {
      this.monsters.forEach(monster => {
        if (monster.sprite) monster.sprite.destroy();
        if (monster.healthBar) {
          monster.healthBar.background.destroy();
          monster.healthBar.bar.destroy();
        }
      });
      this.monsters = [];
    }

    // 清除所有波次相关的定时器
    if (this.monsterSpawnEvent) this.monsterSpawnEvent.destroy();
    if (this.waveTimer) this.waveTimer.destroy();

    // 重置游戏状态
    this.wave = 1;
    this.gold = this.initialGold;
    this.isWaveActive = false;
    this.monstersRemaining = 0;

    // 清除网格占用状态
    if (this.grid) {
      for (let row = 0; row < this.gridSize.rows; row++) {
        for (let col = 0; col < this.gridSize.cols; col++) {
          if (this.grid[row] && this.grid[row][col]) {
            this.grid[row][col].occupied = false;
            this.grid[row][col].cell.setFillStyle(0x333333);
            this.grid[row][col].cell.setStrokeStyle(1, 0x444444);
          }
        }
      }
    }
  }

  createGrid() {
    const topBarHeight = scaleToDPR(60);
    const bottomPanelHeight = scaleToDPR(120); // 从160改为120

    // 计算可用的游戏区高度
    const availableHeight = this.game.config.height - topBarHeight - bottomPanelHeight;

    // 计算90%的屏幕宽度
    const maxGridWidth = this.game.config.width * 0.9;

    // 计算传送门和核心各自需要的高度
    const portalHeight = this.cellSize || scaleToDPR(40); // 传送门高度
    const coreHeight = this.cellSize || scaleToDPR(40);   // 核心高度

    // 计算网格实际可用高度(减去传送门和核心的高度)
    const gridAvailableHeight = availableHeight - portalHeight - coreHeight;

    // 计算单个格子的理想大小
    const idealCellWidth = maxGridWidth / this.gridSize.cols;
    const idealCellHeight = gridAvailableHeight / this.gridSize.rows;

    // 使用较小的作为实际格子大小
    this.cellSize = Math.min(idealCellWidth, idealCellHeight);

    // 计算实际的网格尺寸
    const gridWidth = this.cellSize * this.gridSize.cols;
    const gridHeight = this.cellSize * this.gridSize.rows;

    // 计算整个游戏区域的起始位置（水平和垂直中心）
    const offsetX = (this.game.config.width - gridWidth) / 2;
    const offsetY = topBarHeight + (availableHeight - (gridHeight + portalHeight + coreHeight)) / 2;

    // 存储网格的全局位置信息
    this.gridOffset = { x: offsetX, y: offsetY + portalHeight };

    // 创建传送门 (在网格上方)
    this.createPortals(offsetX, offsetY, gridWidth);
    // 创建网格区域的整体背景
    const gridBg = this.add.rectangle(
      offsetX,
      this.gridOffset.y,
      gridWidth,
      gridHeight,
      0x000000
    )
      .setOrigin(0, 0)
      .setAlpha(0.3);

    // 添加战争迷雾效果
    this.createFogOfWar(offsetX, this.gridOffset.y, gridWidth, gridHeight);

    // 删除原有的绿色网格线，改用更柔和的颜色
    const gridLines = this.add.graphics();
    gridLines.lineStyle(1, 0x333333, 0.1); // 使用深灰色的网格线

    // 绘制横向网格线
    for (let row = 0; row <= this.gridSize.rows; row++) {
      const y = this.gridOffset.y + row * this.cellSize;
      gridLines.lineBetween(offsetX, y, offsetX + gridWidth, y);
    }

    // 绘制纵向网格线
    for (let col = 0; col <= this.gridSize.cols; col++) {
      const x = offsetX + col * this.cellSize;
      gridLines.lineBetween(x, this.gridOffset.y, x, this.gridOffset.y + gridHeight);
    }

    // 创建网格
    this.grid = [];
    for (let row = 0; row < this.gridSize.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.gridSize.cols; col++) {
        const x = this.gridOffset.x + col * this.cellSize;
        const y = this.gridOffset.y + row * this.cellSize;

        // 创建单元格，使用更现代的样式
        const cell = this.add.rectangle(
          x,
          y,
          this.cellSize - scaleToDPR(2),
          this.cellSize - scaleToDPR(2),
          0x000000,
          0 // 完全透明的背景
        )
          .setOrigin(0, 0)
          .setInteractive();

        // 创建单元格悬停效果
        const hoverEffect = this.add.rectangle(
          x,
          y,
          this.cellSize - scaleToDPR(2),
          this.cellSize - scaleToDPR(2),
          0x00ff00,
          0
        )
          .setOrigin(0, 0);

        // 存储单元格信息
        this.grid[row][col] = {
          cell,
          hoverEffect,
          x: x + this.cellSize / 2,
          y: y + this.cellSize / 2,
          occupied: false
        };

        // 添加单元格交互效果
        cell.on('pointerover', () => {
          if (!this.grid[row][col].occupied) {
            // 创建悬停动画
            this.tweens.add({
              targets: hoverEffect,
              alpha: 0.2,
              duration: 200,
              ease: 'Power2'
            });
          }
        });

        cell.on('pointerout', () => {
          if (!this.grid[row][col].occupied) {
            // 创建悬停消失动画
            this.tweens.add({
              targets: hoverEffect,
              alpha: 0,
              duration: 200,
              ease: 'Power2'
            });
          }
        });

        // 添加脉动效果（随机时间）
        if (Math.random() < 0.3) { // 30%的格子会有脉动效果
          const pulse = this.add.rectangle(
            x + this.cellSize / 2,
            y + this.cellSize / 2,
            this.cellSize * 0.8,
            this.cellSize * 0.8,
            0x00ff00,
            0.1
          )
            .setOrigin(0.5);

          this.tweens.add({
            targets: pulse,
            alpha: { from: 0.1, to: 0 },
            scale: { from: 0.8, to: 1.2 },
            duration: 2000 + Math.random() * 2000,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
          });
        }
      }
    }

    // 创建机器核心 (在网格下方)
    this.createMachineCores(offsetX, this.gridOffset.y + gridHeight, gridWidth);

    // 创建战争迷雾效果
    this.createFogOfWar(offsetX, this.gridOffset.y, gridWidth, gridHeight);
  }

  // 添加新方法来创建战争迷雾效果
  createFogOfWar(x, y, width, height) {
    // 创建迷雾粒子（调整参数使其更加柔和）
    const fogParticles = this.add.particles(0, 0, 'particle', {
      x: x - scaleToDPR(50), // 扩大范围，覆盖边缘
      y: y - scaleToDPR(50),
      width: width + scaleToDPR(100), // 增加宽度以覆盖边缘
      height: height + scaleToDPR(100),
      quantity: 3,
      frequency: 300,
      scale: { start: 1, end: 3 },
      alpha: { start: 0.03, end: 0 },
      tint: [0x000000, 0x111111, 0x222222],
      blendMode: 'MULTIPLY',
      lifespan: 5000,
      speedY: { min: -5, max: 5 },
      speedX: { min: -5, max: 5 },
      gravityY: 0,
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Rectangle(-50, -50, width + 100, height + 100)
      }
    });

    // 创建更柔和的边缘渐变效果
    const gradientMask = this.add.graphics();
    gradientMask.clear();

    // 渐变深度
    const gradientDepth = scaleToDPR(100);

    // 上边缘渐变 - 使用多层渐变创造更柔和的效果
    for (let i = 0; i < 5; i++) {
      const alpha = 0.04 - (i * 0.008);
      gradientMask.fillGradientStyle(
        0x000000, 0x000000, 0x000000, 0x000000,
        alpha, alpha, 0, 0
      );
      gradientMask.fillRect(
        x,
        y + (i * gradientDepth / 5),
        width,
        gradientDepth / 5
      );
    }

    // 下边缘渐变
    for (let i = 0; i < 5; i++) {
      const alpha = 0.04 - (i * 0.008);
      gradientMask.fillGradientStyle(
        0x000000, 0x000000, 0x000000, 0x000000,
        0, 0, alpha, alpha
      );
      gradientMask.fillRect(
        x,
        y + height - gradientDepth + (i * gradientDepth / 5),
        width,
        gradientDepth / 5
      );
    }

    // 左边缘渐变
    for (let i = 0; i < 5; i++) {
      const alpha = 0.04 - (i * 0.008);
      gradientMask.fillGradientStyle(
        0x000000, 0x000000, 0x000000, 0x000000,
        alpha, 0, alpha, 0
      );
      gradientMask.fillRect(
        x + (i * gradientDepth / 5),
        y,
        gradientDepth / 5,
        height
      );
    }

    // 右边缘渐变
    for (let i = 0; i < 5; i++) {
      const alpha = 0.04 - (i * 0.008);
      gradientMask.fillGradientStyle(
        0x000000, 0x000000, 0x000000, 0x000000,
        0, alpha, 0, alpha
      );
      gradientMask.fillRect(
        x + width - gradientDepth + (i * gradientDepth / 5),
        y,
        gradientDepth / 5,
        height
      );
    }

    // 添加角落额外的渐变以平滑过渡
    const cornerSize = scaleToDPR(80);
    const cornerAlpha = 0.03;

    // 左上角
    gradientMask.fillGradientStyle(
      0x000000, 0x000000, 0x000000, 0x000000,
      cornerAlpha, 0, 0, 0
    );
    gradientMask.fillRect(x, y, cornerSize, cornerSize);

    // 右上角
    gradientMask.fillGradientStyle(
      0x000000, 0x000000, 0x000000, 0x000000,
      0, cornerAlpha, 0, 0
    );
    gradientMask.fillRect(x + width - cornerSize, y, cornerSize, cornerSize);

    // 左下角
    gradientMask.fillGradientStyle(
      0x000000, 0x000000, 0x000000, 0x000000,
      0, 0, cornerAlpha, 0
    );
    gradientMask.fillRect(x, y + height - cornerSize, cornerSize, cornerSize);

    // 右下角
    gradientMask.fillGradientStyle(
      0x000000, 0x000000, 0x000000, 0x000000,
      0, 0, 0, cornerAlpha
    );
    gradientMask.fillRect(x + width - cornerSize, y + height - cornerSize, cornerSize, cornerSize);

    // 创建更微妙的动态光效
    const lightEffect = this.add.graphics();

    this.time.addEvent({
      delay: 100,
      callback: () => {
        lightEffect.clear();
        lightEffect.lineStyle(scaleToDPR(2), 0x3333ff, 0.05);

        // 创建更柔和的随机光线效果
        for (let i = 0; i < 4; i++) {
          const startX = Phaser.Math.Between(x, x + width);
          const startY = Phaser.Math.Between(y, y + height);
          const length = Phaser.Math.Between(50, 150);
          const angle = Phaser.Math.Between(0, 360);
          const endX = startX + length * Math.cos(angle * Math.PI / 180);
          const endY = startY + length * Math.sin(angle * Math.PI / 180);

          // 使用多段线条创建更柔和的光效
          const points = [];
          const segments = 5;
          for (let j = 0; j <= segments; j++) {
            points.push({
              x: startX + (endX - startX) * (j / segments),
              y: startY + (endY - startY) * (j / segments)
            });
          }

          lightEffect.beginPath();
          lightEffect.moveTo(points[0].x, points[0].y);
          for (let j = 1; j < points.length; j++) {
            const offsetX = Phaser.Math.Between(-3, 3);
            const offsetY = Phaser.Math.Between(-3, 3);
            lightEffect.lineTo(points[j].x + offsetX, points[j].y + offsetY);
          }
          lightEffect.strokePath();
        }
      },
      loop: true
    });
  }

  // 创建传送门
  createPortals(startX, y, totalWidth) {
    const portalCount = this.gridSize.cols;

    this.portals = [];

    for (let i = 0; i < portalCount; i++) {
      // 直接使用格子的中心点坐标
      const x = startX + (i * this.cellSize) + (this.cellSize / 2);
      const portal = this.add.image(x, y, 'portal')
        .setDisplaySize(this.cellSize * 0.8, this.cellSize * 0.8);

      // 添加发光效果
      const glow = this.add.circle(x, y, this.cellSize * 0.5, 0x4444ff, 0.3);

      // 添加传送门粒子效果
      const particles = this.add.particles(x, y, 'particle', {
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.6, end: 0 },
        speed: { min: scaleToDPR(20), max: scaleToDPR(40) },
        lifespan: 1000,
        frequency: 100,
        blendMode: 'ADD',
        tint: 0x4444ff
      });

      // 添加脉动动画
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.3, to: 0.5 },
        scale: { from: 1, to: 1.2 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.portals.push({
        sprite: portal,
        glow: glow,
        particles: particles,
        x: x,
        y: y,
        col: i
      });

      // 添加错误提示动画
      this.time.addEvent({
        delay: Phaser.Math.Between(3000, 8000), // 随机间隔
        callback: () => {
          this.createErrorEffect(portal.x, portal.y);
        },
        loop: true
      });

      // 添加代码流动效果
      const codeParticles = this.add.particles(portal.x, portal.y, 'particle', {
        speed: { min: scaleToDPR(15), max: scaleToDPR(30) },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.6, end: 0 },
        tint: [0x00ff00, 0x00ff88],
        blendMode: 'ADD',
        lifespan: 2000,
        frequency: 300,
        quantity: 2,
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, this.cellSize * 0.5),
          quantity: 16
        }
      });

      // 添加电流效果
      const electricityGraphics = this.add.graphics();
      this.time.addEvent({
        delay: 100,
        callback: () => {
          this.createElectricityEffect(electricityGraphics, portal.x, portal.y);
        },
        loop: true
      });

      // 存储新的效果引用
      this.portals[i].effects = {
        codeParticles,
        electricityGraphics
      };
    }
  }

  // 创建错误提示效果
  createErrorEffect(x, y) {
    const errorText = this.add.text(x, y, 'ERROR', {
      fontSize: scaleToDPR(16),
      fontFamily: 'Courier',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // 创建弧线路径
    const path = new Phaser.Curves.CubicBezier(
      new Phaser.Math.Vector2(x, y),
      new Phaser.Math.Vector2(x + 50, y - 50),
      new Phaser.Math.Vector2(x + 100, y - 30),
      new Phaser.Math.Vector2(x + 150, y)
    );

    // 沿路径移动并消散
    this.tweens.add({
      targets: errorText,
      alpha: { from: 1, to: 0 },
      scale: { from: 1, to: 0.5 },
      ease: 'Power2',
      duration: 2500,
      onUpdate: (tween) => {
        const position = path.getPoint(tween.progress);
        errorText.x = position.x;
        errorText.y = position.y;
      },
      onComplete: () => {
        errorText.destroy();
      }
    });
  }

  // 创建电流效果
  createElectricityEffect(graphics, x, y) {
    graphics.clear();
    graphics.lineStyle(2, 0x00ff00, 0.3);

    const radius = this.cellSize * 0.4;
    const points = 8;
    const variance = 5;

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const nextAngle = ((i + 1) / points) * Math.PI * 2;

      const startX = x + Math.cos(angle) * radius;
      const startY = y + Math.sin(angle) * radius;
      const endX = x + Math.cos(nextAngle) * radius;
      const endY = y + Math.sin(nextAngle) * radius;

      // 创建锯齿状电流
      graphics.beginPath();
      graphics.moveTo(startX, startY);

      const segments = 4;
      for (let j = 1; j <= segments; j++) {
        const progress = j / segments;
        const lineX = startX + (endX - startX) * progress;
        const lineY = startY + (endY - startY) * progress;
        const offsetX = Phaser.Math.Between(-variance, variance);
        const offsetY = Phaser.Math.Between(-variance, variance);

        graphics.lineTo(lineX + offsetX, lineY + offsetY);
      }

      graphics.strokePath();
    }
  }

  // 创建机器核心
  createMachineCores(startX, y, totalWidth) {
    const coreCount = this.gridSize.cols;
    const spacing = scaleToDPR(40);

    this.machineCores = [];

    for (let i = 0; i < coreCount; i++) {
      const x = startX + (i * this.cellSize) + (this.cellSize / 2);

      // 外层发光
      const outerGlow = this.add.circle(x, y + spacing, this.cellSize * 0.4, 0x4488ff, 0.15);

      // 内层发光
      const innerGlow = this.add.circle(x, y + spacing, this.cellSize * 0.25, 0x4488ff, 0.3);

      // 核心图片 - 移除setTint，保持原始颜色
      const core = this.add.image(x, y + spacing, 'core')
        .setDisplaySize(this.cellSize * 0.35, this.cellSize * 0.35);

      // 能量粒子效果
      const particles = this.add.particles(x, y + spacing, 'particle', {
        scale: { start: 0.15, end: 0 },
        alpha: { start: 0.6, end: 0 },
        speed: { min: scaleToDPR(15), max: scaleToDPR(30) },
        lifespan: 1000,
        frequency: 100,
        blendMode: 'ADD',
        tint: 0x4488ff,
        emitZone: {
          type: 'random',
          source: new Phaser.Geom.Circle(0, 0, this.cellSize * 0.2)
        }
      });

      // 呼吸动画
      this.tweens.add({
        targets: [innerGlow, core],
        alpha: { from: 0.7, to: 1 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // 外圈旋转动
      this.tweens.add({
        targets: outerGlow,
        angle: { from: 0, to: 360 },
        duration: 8000,
        repeat: -1,
        ease: 'Linear'
      });

      this.machineCores.push({
        sprite: core,
        innerGlow: innerGlow,
        outerGlow: outerGlow,
        particles: particles,
        x: x,
        y: y + spacing,
        col: i,
        health: 100
      });

      // 添加代码文本发射器
      const emitCode = () => {
        const codeChars = [
          // 编程语言
          'Java', 'Python', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'TypeScript',

          // 基础语法
          'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'return', 'class', 'function',

          // 常用符号
          '{', '}', '[]', '()', '<>', '=>', ';;', '&&', '||', '!=',

          // 数据类型
          'int', 'bool', 'string', 'float', 'array', 'null', 'void', 'const', 'let', 'var',

          // 二进制和数字
          '0', '1', '404', '500', '200', '0x0F', '0b10', '42',

          // 常用关键字
          'async', 'await', 'try', 'catch', 'import', 'export', 'public', 'private', 'static', 'final',

          // 编程概念
          'API', 'SQL', 'REST', 'JSON', 'HTTP', 'DOM', 'CLI', 'GUI', 'OOP', 'FP'
        ];
        // 随机选择文本
        const text = Phaser.Utils.Array.GetRandom(codeChars);

        // 生成随机初始角度
        const startAngle = Phaser.Math.Between(0, 360);
        const startRad = Phaser.Math.DegToRad(startAngle);

        // 设置轨道半径和高度
        const orbitRadius = this.cellSize * 0.8;
        const orbitHeight = this.cellSize * 0.4;

        // 创建文本
        const codeText = this.add.text(x, y + spacing, text, {
          fontSize: `${scaleToDPR(8)}px`,
          fontFamily: 'Courier',
          color: '#00ff00',
          stroke: '#003300',
          strokeThickness: 1
        }).setOrigin(0.5);

        // 创建3D轨道动画
        this.tweens.add({
          targets: codeText,
          angle: '0', // 文本自转
          alpha: { from: 0.8, to: 0 },
          duration: 4000,
          ease: 'Linear',
          onUpdate: (tween) => {
            // 计算当前角度
            const currentAngle = startRad + (Math.PI * 2 * tween.progress);

            // 计算3D位置
            const xPos = x + Math.cos(currentAngle) * orbitRadius;
            const yOffset = Math.sin(currentAngle) * orbitHeight;
            const yPos = (y + spacing) + yOffset;

            // 计算透视缩放（远小近大）
            const scale = Phaser.Math.Linear(0.7, 1.3, (Math.sin(currentAngle) + 1) / 2);

            // 更新位置和缩放
            codeText.x = xPos;
            codeText.y = yPos;
            codeText.setScale(scale);

            // 设置深度排序（前后层次）
            codeText.setDepth(yPos < y + spacing ? 1 : 3);

            // 调整透明度模拟远近效果
            codeText.alpha = Phaser.Math.Linear(0.4, 0.8, (Math.sin(currentAngle) + 1) / 2);
          },
          onComplete: () => {
            codeText.destroy();
          }
        });
      };

      // 增加发射频率并随机化发射时间
      const codeEmitter = this.time.addEvent({
        delay: 1500,
        callback: () => {
          // 添加随机延迟使运动更自然
          this.time.delayedCall(Phaser.Math.Between(0, 100), emitCode);
        },
        loop: true
      });

      // 将发射器引用存储到核心对象中
      this.machineCores[i].codeEmitter = codeEmitter;
    }
  }

  createTowerPanel() {
    const towerTypes = this.towerTypes;

    const panelHeight = scaleToDPR(120);
    const panelY = this.game.config.height - panelHeight;

    // 创建滚动面板容器
    const scrollPanel = this.add.container(0, panelY);
    this.scrollPanel = scrollPanel; // 保存为类属性以便其他方法访问

    // 添加底板背
    const panelBg = this.add.rectangle(
      0,
      this.game.config.height - panelHeight,
      this.game.config.width,
      panelHeight,
      0x000000,
      0.8  // 设置半透明
    ).setOrigin(0);

    scrollPanel.add(panelBg);

    // 创建一个容器来放置所有塔
    const towersContainer = this.add.container(0, 0);
    scrollPanel.add(towersContainer);

    // 调整间距和大小
    const spacing = scaleToDPR(92);
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

      // 检查是否有足够的金币
      const isAffordable = this.gold >= tower.cost;

      // 创建一个容器来放置卡片内的所有元素（除了塔图标）
      const cardElements = this.add.container(0, 0);
      towerContainer.add(cardElements);

      // 塔的卡片背景
      const cardBg = this.add.rectangle(0, 0, scaleToDPR(80), scaleToDPR(90),
        isAffordable ? 0x333333 : 0x222222,
        isAffordable ? 0.8 : 0.5
      )
        .setStrokeStyle(scaleToDPR(1), isAffordable ? 0x666666 : 0x444444)
        .setOrigin(0.5)
        .setInteractive();
      cardElements.add(cardBg);

      // 塔的图标背景
      const iconBg = this.add.circle(0, scaleToDPR(-20), scaleToDPR(24),
        isAffordable ? 0x444444 : 0x333333
      )
        .setInteractive();
      cardElements.add(iconBg);

      // 塔的名称
      const nameText = this.add.text(0, scaleToDPR(10), tower.name, {
        fontSize: `${scaleToDPR(12)}px`,
        fontFamily: 'Arial',
        color: isAffordable ? '#ffffff' : '#888888',
        resolution: 2,
        fontStyle: 'bold'
      })
        .setOrigin(0.5, 0)
        .setInteractive();
      cardElements.add(nameText);

      // 金币图标和成本容器
      const costContainer = this.add.container(0, scaleToDPR(34));
      costContainer.setInteractive(
        new Phaser.Geom.Rectangle(-30, -10, 60, 20),
        Phaser.Geom.Rectangle.Contains
      );
      cardElements.add(costContainer);

      // 添加金币图标
      const coinIcon = this.add.circle(scaleToDPR(-14), 0, scaleToDPR(6), 0xffd700)
        .setAlpha(isAffordable ? 1 : 0.5);
      costContainer.add(coinIcon);

      // 添加成本文本
      const costText = this.add.text(0, 0, tower.cost.toString(), {
        fontSize: `${scaleToDPR(8)}px`,
        fontFamily: 'Arial',
        color: isAffordable ? '#ffd700' : '#997700',
        resolution: 2,
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      costContainer.add(costText);

      // 塔的图标
      const towerIcon = this.add.image(0, scaleToDPR(-20), tower.key)
        .setDisplaySize(scaleToDPR(50), scaleToDPR(50))
        .setAlpha(isAffordable ? 1 : 0.5)
        .setInteractive();
      towerContainer.add(towerIcon);

      // 设置图标为可拖拽
      this.input.setDraggable(towerIcon);

      // 图标的拖拽事件
      towerIcon.on('dragstart', (pointer) => {
        // 检查金币是否足够
        if (this.gold < tower.cost) {
          this.showInsufficientFundsHint(pointer.x, pointer.y);
          return false;
        }

        isTowerDrag = true;
        isDragging = false;  // 停止面板滑动

        // 创建拖拽时的塔预览
        this.dragTower = {
          type: tower.key,
          cost: tower.cost,
          range: tower.range,
          sprite: this.add.image(pointer.x, pointer.y, tower.key)
            .setDisplaySize(this.cellSize * 0.8, this.cellSize * 0.8)
            .setAlpha(0.8)
        };

        // 只为要显示攻击范围的防御塔创建范围预览
        if (!['blockchain_node', 'firewall'].includes(tower.key)) {
          this.createRangePreview(pointer.x, pointer.y, tower.range, 0x9370db);
        }
      });

      towerIcon.on('drag', (pointer, dragX, dragY) => {
        if (!this.dragTower) return;

        this.dragTower.sprite.x = pointer.x;
        this.dragTower.sprite.y = pointer.y;

        const cellCoords = this.screenToGrid(pointer.x, pointer.y);
        if (cellCoords) {
          this.highlightValidCell(cellCoords.row, cellCoords.col);
        } else {
          this.clearHighlight();
        }

        if (this.rangePreview && !['blockchain_node', 'firewall'].includes(this.dragTower.type)) {
          this.createRangePreview(pointer.x, pointer.y, this.dragTower.range, 0x9370db);
        }
      });

      towerIcon.on('dragend', (pointer) => {
        if (!this.dragTower) return;

        const cellCoords = this.screenToGrid(pointer.x, pointer.y);

        if (cellCoords && this.towerManager.canPlace(cellCoords.row, cellCoords.col)) {
          // this.placeTower(cellCoords.row, cellCoords.col, this.dragTower.type);
          this.towerManager.place(cellCoords.row, cellCoords.col, this.dragTower.type);
        }

        this.clearHighlight();
        if (this.rangePreview) {
          this.rangePreview.destroy();
          this.rangePreview = null;
        }
        this.dragTower.sprite.destroy();
        this.dragTower = null;

        isTowerDrag = false;  // 重置拖拽状态
      });

      // 为所有可交互元素添加滑动事件（除了塔图标）
      [cardBg, iconBg, nameText, costContainer].forEach(element => {
        element.on('pointerdown', (pointer) => {
          if (!isTowerDrag) {  // 只有在不拖拽塔时才允许滑动
            isDragging = true;
            initialPointerX = pointer.x;
            lastPointerX = pointer.x;
            dragStartX = pointer.x - scrollX;
            isDragThresholdMet = false;
          }
        });
      });

      // 将组件保存到 tower.uiComponents 中
      tower.uiComponents = {
        cardBg,
        iconBg,
        towerIcon,
        nameText,
        coinIcon,
        costText
      };
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

    // 创建删除区域容器
    this.deleteZone = this.add.container(0, this.game.config.height - panelHeight);
    this.deleteZone.setVisible(false);

    // 创建红色背景
    const deleteZoneBg = this.add.rectangle(
      0,
      0,
      this.game.config.width,
      panelHeight,
      0xff4444,
      0.8
    ).setOrigin(0, 0);
    this.deleteZone.add(deleteZoneBg);

    // 创建删除图标
    const iconSize = scaleToDPR(40);
    const deleteIcon = this.add.graphics();
    deleteIcon.lineStyle(scaleToDPR(4), 0xffffff);
    // 绘制X形图标
    deleteIcon.moveTo(-iconSize / 2, -iconSize / 2);
    deleteIcon.lineTo(iconSize / 2, iconSize / 2);
    deleteIcon.moveTo(iconSize / 2, -iconSize / 2);
    deleteIcon.lineTo(-iconSize / 2, iconSize / 2);
    deleteIcon.setPosition(this.game.config.width / 2, panelHeight / 2);
    this.deleteZone.add(deleteIcon);

    // 添加删除提示文本
    const deleteText = this.add.text(
      this.game.config.width / 2,
      panelHeight / 2 + scaleToDPR(30),
      '拖拽到此处删除',
      {
        fontSize: `${scaleToDPR(20)}px`,
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    this.deleteZone.add(deleteText);

    // 添加金币变化监听器，用于更新塔的显示状态
    this.events.on('goldChanged', () => {
      this.towerTypes.forEach(tower => {
        if (tower.uiComponents) {
          const isAffordable = this.gold >= tower.cost;

          // 更新卡片背景
          tower.uiComponents.cardBg
            .setFillStyle(isAffordable ? 0x333333 : 0x222222, isAffordable ? 0.8 : 0.5)
            .setStrokeStyle(scaleToDPR(1), isAffordable ? 0x666666 : 0x444444);

          // 更新图标背景
          tower.uiComponents.iconBg.setFillStyle(isAffordable ? 0x444444 : 0x333333);

          // 更新图标透明度
          tower.uiComponents.towerIcon.setAlpha(isAffordable ? 1 : 0.5);

          // 更新名称颜色
          tower.uiComponents.nameText.setColor(isAffordable ? '#ffffff' : '#888888');

          // 更新金币图标
          tower.uiComponents.coinIcon.setAlpha(isAffordable ? 1 : 0.5);

          // 更新成本文本颜色
          tower.uiComponents.costText.setColor(isAffordable ? '#ffd700' : '#997700');
        }
      });
    });
  }

  screenToGrid(x, y) {
    const relativeX = x - this.gridOffset.x;
    const relativeY = y - this.gridOffset.y;

    const col = Math.floor(relativeX / this.cellSize);
    const row = Math.floor(relativeY / this.cellSize);

    // 如果坐标在网格范围外，返回 null
    if (row < 0 || row >= this.gridSize.rows ||
      col < 0 || col >= this.gridSize.cols) {
      return null;
    }

    return { row, col };
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

    // 创建并保存实时生成怪物的事件引用
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
    const portal = Phaser.Utils.Array.GetRandom(this.portals);

    const monster = {
      sprite: this.add.image(portal.x, portal.y, type.key)
        .setDisplaySize(this.cellSize * 0.6, this.cellSize * 0.6), // 将 0.8 改为 0.6，怪物更小
      type: type.key,
      column: portal.col,
      level: Number(type.level),
      speed: Number(type.speed) * (1 + (this.wave - 1) * 0.05),
      attack: Number(type.attack) * (1 + (this.wave - 1) * 0.05),
      defense: Number(type.defense) * (1 + (this.wave - 1) * 0.05),
      health: type.health * (1 + (this.wave - 1) * 0.05),
      maxHealth: type.health * (1 + (this.wave - 1) * 0.05),
      attackSpeed: Number(type.attackSpeed) * (1 + (this.wave - 1) * 0.05),
      attackRange: Number(type.attackRange) * (1 + (this.wave - 1) * 0.05),
      reward: Number(type.reward) * (1 + (this.wave - 1) * 0.05),
      skill: type.skill,
      effects: [],
      lastSkillUse: 0,
      isDying: false
    };

    // 创建血条 - 调整Y轴位置，使其更贴近怪物
    monster.healthBar = this.createHealthBar(
      portal.x,
      portal.y - scaleToDPR(20), // 调整血条位置，使其更贴近怪物
      scaleToDPR(30), // 减血条宽度
      scaleToDPR(3),  // 减小血条高度
      true
    );

    // 添加到怪物数组
    this.monsterManager.monsters.push(monster);

    return monster;
  }

  // 添加传送效果
  createPortalEffect(portal, monster) {
    // 创建闪光效果
    const flash = this.add.circle(portal.x, portal.y, this.cellSize * 0.6, 0x4444ff, 0.8);

    // 创建能量环效果
    const ring = this.add.circle(portal.x, portal.y, this.cellSize * 0.4);
    ring.setStrokeStyle(scaleToDPR(2), 0x4444ff);

    // 添加动画效果
    this.tweens.add({
      targets: [flash, ring],
      scale: { from: 0.5, to: 1.5 },
      alpha: { from: 0.8, to: 0 },
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
        ring.destroy();
      }
    });

    // 怪物出现动画
    monster.sprite.setScale(0);
    monster.sprite.setAlpha(0);

    this.tweens.add({
      targets: monster.sprite,
      scale: { from: 0, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  // 添加高亮方法
  highlightValidCell(row, col) {
    this.clearHighlight();

    if (row >= 0 && row < this.gridSize.rows &&
      col >= 0 && col < this.gridSize.cols) {
      const cell = this.grid[row][col];
      if (cell.occupied) {
        // 已占用格子显示红色
        cell.cell.setStrokeStyle(scaleToDPR(2), 0xff0000);
      } else if (this.towerManager.canPlace(row, col)) {
        // 可放置格子显示绿色
        cell.cell.setStrokeStyle(scaleToDPR(2), 0x00ff00);
      } else {
        // 其他无效位置显示红色
        cell.cell.setStrokeStyle(scaleToDPR(2), 0xff0000);
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
      fontSize: `${scaleToDPR(16)}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#ff0000',
      padding: { x: 8, y: 4 },
      resolution: 2
    }).setOrigin(0.5);

    // 添加动画效果
    this.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  // 添加创建范围预览的方法
  createRangePreview(x, y, range, color = 0x9370db) {
    // 如果已存在范围预览先销毁它
    if (this.rangePreview) {
      this.rangePreview.destroy();
    }

    // 计算范围圆形的半径（格子数 * 格子���小）
    const radius = range * this.cellSize;

    // 创建图形对象
    this.rangePreview = this.add.graphics();

    // 设置边框颜色
    this.rangePreview.lineStyle(2, color === 0x9370db ? 0x6a0dad : color);

    // 设置半透明填充
    this.rangePreview.fillStyle(color, 0.3);

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
          color = 0xff6666; // 浅色
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
      health: 100, // 初始生命值
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
    if (!monster || monster.isDying) return false;

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
      monster.isDying = true;

      // 获得经验值
      const expGain = monster.experience || 10; // 默认经验值为10
      this.addExperience(expGain);

      // 显示获得的经验值
      this.showExpGain(monster.sprite.x, monster.sprite.y, expGain);

      this.playDeathAnimation(monster);
      return true; // 返回true表示怪物已死亡
    }
    return false; // 返回false表示物存活
  }

  // 添加经验值方法
  addExperience(amount) {
    this.experience += amount;

    // 检查是否升级
    while (this.experience >= this.nextLevelExp) {
      this.levelUp();
    }

    // 更新经验条
    this.updateExpBar();
  }

  // 升级方法
  levelUp() {
    this.level += 1;
    this.experience -= this.nextLevelExp;

    // 计算下一级所需经验值
    this.nextLevelExp = this.config.levelConfig.getNextLevelExp(this.level);

    // 更新等级显示
    this.levelText.setText(`${this.level}`);

    // 播放升级特效
    this.playLevelUpEffect();
  }

  // 更新经验条显示
  updateExpBar() {
    if (!this.expBar) return;

    const progress = this.experience / this.nextLevelExp;
    // 设置经验条的宽度
    this.expBar.width = scaleToDPR(100) * progress;
  }

  // 显示获得经验值的文本
  showExpGain(x, y, amount) {
    const expText = this.add.text(x, y - scaleToDPR(40), `+${amount} EXP`, {
      fontSize: `${scaleToDPR(16)}px`,
      fontFamily: 'Arial',
      color: '#44ff44',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: expText,
      y: y - scaleToDPR(80),
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => expText.destroy()
    });
  }

  // 播放升级特效
  playLevelUpEffect() {
    // 创建升级文本
    const levelUpText = this.add.text(
      this.levelText.x,
      this.levelText.y,
      'LEVEL UP!',
      {
        fontSize: `${scaleToDPR(24)}px`,
        fontFamily: 'Arial',
        color: '#ffff44',
        stroke: '#000000',
        strokeThickness: 3
      }
    ).setOrigin(0.5);

    // 创建发光效果
    const glow = this.add.circle(
      this.levelText.x,
      this.levelText.y,
      scaleToDPR(40),
      0xffff44,
      0.5
    );

    // 创建粒子效果
    const particles = this.add.particles(
      this.levelText.x,
      this.levelText.y,
      'particle',
      {
        speed: { min: scaleToDPR(100), max: scaleToDPR(200) },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 1000,
        quantity: 20,
        tint: 0xffff44
      }
    );

    // 动画效果
    this.tweens.add({
      targets: [levelUpText, glow],
      alpha: 0,
      scale: 2,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        levelUpText.destroy();
        glow.destroy();
        particles.destroy();
      }
    });
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
        this.updateGold(this.gold + monster.reward);
        this.showRewardText(monster.sprite.x, monster.sprite.y, monster.reward);

        // 从数组中移除怪物
        const index = this.monsterManager.monsters.indexOf(monster);
        if (index > -1) {
          this.monsterManager.monsters.splice(index, 1);
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

      // 恢复游戏速度
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

    // 整个对话框区可以接收输入
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
    // this.pauseText.setText('暂停');

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

    // 移除键盘事件监听
    this.input.keyboard.off('keydown-ESC');
  }

  // 添加显示返还金币的方法
  showRefundText(x, y, amount) {
    const refundText = this.add.text(x, y, `返还: ${amount}`, {
      fontSize: `${scaleToDPR(20)}px`,
      fontFamily: 'Arial',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: scaleToDPR(2)
    }).setOrigin(0.5);

    this.tweens.add({
      targets: refundText,
      y: y - scaleToDPR(50),
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => refundText.destroy()
    });
  }

  onTowerDragStart(tower, pointer) {
    // 只有当塔有攻击范围时才显示
    if (tower.towerType.attackType !== 'none' && tower.towerType.attackType !== 'mine') {
      this.rangeCircle = this.add.circle(
        tower.x,
        tower.y,
        tower.towerType.range * this.cellSize,
        0x00ff00,
        0.2
      );
    }

    this.children.bringToTop(tower);
  }

  onTowerDragEnd(tower, pointer) {
    // 清除范围显示
    if (this.rangeCircle) {
      this.rangeCircle.destroy();
      this.rangeCircle = null;
    }
  }

  onTowerDrag(tower, pointer) {
    tower.x = pointer.x;
    tower.y = pointer.y;

    // 更新范围显示的位置
    if (this.rangeCircle) {
      this.rangeCircle.x = pointer.x;
      this.rangeCircle.y = pointer.y;
    }
  }

  // 添加新的方法来更新范围预览
  updateRangePreview(x, y, range) {
    if (!this.rangePreview) return;

    this.rangePreview.clear();
    this.rangePreview.lineStyle(2, 0x9370db);
    this.rangePreview.fillStyle(0x9370db, 0.3);

    // 计算范围圆形的半径（格子数 * 格子大小）
    const radius = range * this.cellSize;

    // 绘制圆形
    this.rangePreview.beginPath();
    this.rangePreview.arc(x, y, radius, 0, Math.PI * 2);
    this.rangePreview.closePath();
    this.rangePreview.fillPath();
    this.rangePreview.strokePath();
  }

  // 修改更新金币显示的方法
  updateGold(amount) {
    this.gold = amount;
    this.goldText.setText(`${this.gold}`);
    // 触发金币变化事件
    this.events.emit('goldChanged');
  }

  // 查找指定列的代码块
  findCodeBlockInColumn(column) {
    return this.codeBlocks?.find(block => block.column === column);
  }

  // 创建代码块 - 调整文字大小
  createCodeBlock(column, type) {
    const core = this.machineCores[column];
    if (!core) return;

    const x = core.x;
    const y = core.y;

    // 减小文字大小
    const mainText = this.add.text(x, y, type.toUpperCase(), {
      fontSize: `${scaleToDPR(16)}px`, // 从24改为16
      fontFamily: 'Courier',
      color: type === 'catch' ? '#ff4444' : '#ff8844',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 相应调整阴影文字大小
    const shadowText = this.add.text(x + scaleToDPR(1), y + scaleToDPR(1), type.toUpperCase(), {
      fontSize: `${scaleToDPR(16)}px`, // 从24改为16
      fontFamily: 'Courier',
      color: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.3);

    // 创建发光效果
    const glow = this.add.graphics();
    const glowColor = type === 'catch' ? 0xff4444 : 0xff8844;
    glow.lineStyle(scaleToDPR(2), glowColor, 0.4);

    // 添加动画效果
    this.tweens.add({
      targets: [mainText, shadowText],
      y: y - scaleToDPR(10),
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 添加脉动发光效果
    this.tweens.add({
      targets: mainText,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 创建粒子效果
    const particles = this.add.particles(x, y, 'particle', {
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.6, end: 0 },
      speed: { min: scaleToDPR(20), max: scaleToDPR(40) },
      lifespan: 1000,
      frequency: 100,
      blendMode: 'ADD',
      tint: glowColor,
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Rectangle(-30, -15, 60, 30)
      }
    });

    const block = {
      type: type,
      column: column,
      sprite: { x, y }, // 用于碰撞检测的位置信息
      mainText,
      shadowText,
      glow,
      particles
    };

    if (!this.codeBlocks) {
      this.codeBlocks = [];
    }
    this.codeBlocks.push(block);

    return block;
  }

  // 触发代码块爆炸效果
  triggerCodeBlockExplosion(codeBlock) {
    // 创建爆炸效果
    this.createExplosionEffect(codeBlock.sprite.x, codeBlock.sprite.y,
      codeBlock.type === 'catch' ? 0xff4444 : 0xff8844);

    // 清理代码块资源
    codeBlock.mainText.destroy();
    codeBlock.shadowText.destroy();
    codeBlock.glow.destroy();
    codeBlock.particles.destroy();

    // 从数组中移除
    const index = this.codeBlocks.indexOf(codeBlock);
    if (index > -1) {
      this.codeBlocks.splice(index, 1);
    }
  }

  // 摧毁机器核心
  destroyMachineCore(column) {
    const core = this.machineCores[column];
    if (core) {
      // 停止代码发射
      if (core.codeEmitter) {
        core.codeEmitter.destroy();
      }

      core.isDestroyed = true;

      // 创建爆炸效果
      this.createExplosionEffect(core.x, core.y, 0x4488ff);

      // 核心消失动画
      this.tweens.add({
        targets: [core.sprite, core.innerGlow, core.outerGlow],
        alpha: 0,
        scale: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          core.particles?.destroy();
          core.sprite.destroy();
          core.innerGlow.destroy();
          core.outerGlow.destroy();
        }
      });
    }
  }

  // 创建爆炸效果
  createExplosionEffect(x, y, color) {
    // 创建闪光
    const flash = this.add.circle(x, y, this.cellSize * 0.8, color, 0.8);

    // 创建文字碎片效果
    const fragments = [];
    const fragmentCount = 8;
    const fragmentText = ['{ ', ' }', '< ', ' >', '/ ', ' /', '[ ', ' ]'];

    for (let i = 0; i < fragmentCount; i++) {
      const angle = (i / fragmentCount) * Math.PI * 2;
      const distance = this.cellSize * 0.8;
      const fragmentX = x + Math.cos(angle) * distance;
      const fragmentY = y + Math.sin(angle) * distance;

      const fragment = this.add.text(x, y, fragmentText[i], {
        fontSize: `${scaleToDPR(16)}px`,
        fontFamily: 'Courier',
        color: '#ffffff'
      }).setOrigin(0.5);

      fragments.push(fragment);

      this.tweens.add({
        targets: fragment,
        x: fragmentX,
        y: fragmentY,
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        duration: 1000,
        ease: 'Power2',
        onComplete: () => fragment.destroy()
      });
    }

    // 爆炸动画
    this.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    });

    // 创建粒子爆炸效果
    const particles = this.add.particles(x, y, 'particle', {
      speed: { min: scaleToDPR(100), max: scaleToDPR(200) },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      blendMode: 'ADD',
      lifespan: 800,
      quantity: 20,
      tint: [color, 0xffffff]
    });

    this.time.delayedCall(800, () => {
      particles.destroy();
    });
  }

  // 处理游戏结束
  handleGameOver() {
    // 暂停游戏逻辑，但保持场景活跃以显示动画
    this.isGameOver = true;

    // 创建最终爆炸效果
    this.createFinalExplosionEffect(() => {
      // 爆炸效果完成后显示游戏结束对话框
      this.showGameOverDialog();
    });

    // 清理所有现有的怪物
    this.monsterManager.destroyAll();
  }

  // 创建最终爆炸效果
  createFinalExplosionEffect(callback) {
    const centerX = this.game.config.width / 2;
    const centerY = this.game.config.height / 2;

    // 创建中心爆炸闪光
    const flash = this.add.circle(centerX, centerY, 10, 0xffffff, 1);

    // 创建多层扩散波
    const waves = [];
    const colors = [0xff8844, 0xff4444, 0xffaa44];

    // 扩散波动画
    this.tweens.add({
      targets: flash,
      scale: { from: 1, to: 50 },
      alpha: { from: 1, to: 0 },
      duration: 1000,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    });

    // 创建三层扩散波
    for (let i = 0; i < 3; i++) {
      const wave = this.add.circle(centerX, centerY, 10, colors[i], 0.8);
      waves.push(wave);

      this.tweens.add({
        targets: wave,
        scale: { from: 1, to: 40 },
        alpha: { from: 0.8, to: 0 },
        duration: 1500,
        delay: i * 200,
        ease: 'Power2',
        onComplete: () => wave.destroy()
      });
    }

    // 创建代码碎片效果
    const fragments = ['ERROR', 'CRASH', 'FATAL', '404', 'BREAK'];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const distance = 200;
      const text = this.add.text(centerX, centerY,
        Phaser.Utils.Array.GetRandom(fragments), {
        fontSize: `${scaleToDPR(20)}px`,
        fontFamily: 'Courier',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: text,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        alpha: { from: 1, to: 0 },
        angle: Phaser.Math.Between(-180, 180),
        scale: { from: 1, to: 0.5 },
        duration: 1000,
        ease: 'Power2',
        onComplete: () => text.destroy()
      });
    }

    // 添加震动效果
    this.cameras.main.shake(1000, 0.01);

    // 延迟调用回调函数
    this.time.delayedCall(1500, callback);
  }

  // 显示游戏结束对话框
  showGameOverDialog() {
    const width = this.game.config.width;
    const height = this.game.config.height;

    // 创建模糊背景
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0)
      .setDepth(100);

    // 对话框尺寸和位置
    const dialogWidth = Math.min(width * 0.8, scaleToDPR(500));
    const dialogHeight = Math.min(height * 0.5, scaleToDPR(300));
    const dialogX = width / 2;
    const dialogY = height / 2;

    // 创建对话框背景 - 主背景
    const dialogBg = this.add.rectangle(dialogX, dialogY, dialogWidth, dialogHeight, 0x1a1a1a)
      .setDepth(101);

    // 内层背景
    const innerBg = this.add.rectangle(dialogX, dialogY, dialogWidth - scaleToDPR(4), dialogHeight - scaleToDPR(4), 0x2a2a2a)
      .setDepth(101);

    // 添加渐变边框
    const border = this.add.graphics()
      .setDepth(101);

    // 创建渐变边框效果
    const gradientWidth = scaleToDPR(2);
    const colors = [0xff8844, 0xff4444, 0xffaa44];
    const borderAlpha = 0.8;

    // 动态更新边框颜色
    let colorIndex = 0;
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        border.clear();
        const color = colors[colorIndex];
        border.lineStyle(gradientWidth, color, borderAlpha);
        border.strokeRect(
          dialogX - dialogWidth / 2,
          dialogY - dialogHeight / 2,
          dialogWidth,
          dialogHeight
        );
        colorIndex = (colorIndex + 1) % colors.length;
      }
    });

    // 添加标题装饰线
    const decorLine = this.add.graphics()
      .setDepth(101);
    decorLine.lineStyle(scaleToDPR(2), 0xff4444, 0.8);
    decorLine.lineBetween(
      dialogX - dialogWidth * 0.3,
      dialogY - dialogHeight * 0.15,
      dialogX + dialogWidth * 0.3,
      dialogY - dialogHeight * 0.15
    );

    // 游戏结束文本
    const gameOverText = this.add.text(dialogX, dialogY - dialogHeight * 0.25,
      'GAME OVER', {
      fontSize: `${scaleToDPR(40)}px`,
      fontFamily: 'Arial',
      color: '#ff4444',
      fontStyle: 'bold'
    })
      .setOrigin(0.5)
      .setDepth(101);

    // 添加文字发光效果
    gameOverText.setStroke('#ff0000', scaleToDPR(1));
    this.tweens.add({
      targets: gameOverText,
      alpha: 0.7,
      yoyo: true,
      repeat: -1,
      duration: 1000,
      ease: 'Sine.easeInOut'
    });

    // 创建按钮容器
    const buttonContainer = this.add.container(dialogX, dialogY + dialogHeight * 0.15)
      .setDepth(101);

    // 按钮样式函数
    const createButton = (x, text, color) => {
      const padding = scaleToDPR(15);
      const buttonWidth = dialogWidth * 0.35;
      const buttonHeight = scaleToDPR(40);

      const buttonBg = this.add.rectangle(x, 0, buttonWidth, buttonHeight, color, 0.8)
        .setInteractive();
      const buttonText = this.add.text(x, 0, text, {
        fontSize: `${scaleToDPR(20)}px`,
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // 添加按钮光晕效果
      const glow = this.add.rectangle(x, 0, buttonWidth + scaleToDPR(4), buttonHeight + scaleToDPR(4), color, 0.3);

      // 按钮交互效果
      buttonBg.on('pointerover', () => {
        this.tweens.add({
          targets: [buttonBg, buttonText],
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 100
        });
        glow.setAlpha(0.5);
      });

      buttonBg.on('pointerout', () => {
        this.tweens.add({
          targets: [buttonBg, buttonText],
          scaleX: 1,
          scaleY: 1,
          duration: 100
        });
        glow.setAlpha(0.3);
      });

      return { bg: buttonBg, text: buttonText, glow };
    };

    // 创建按钮
    const homeButton = createButton(-dialogWidth * 0.2, '返回首页', 0xff4444);
    const restartButton = createButton(dialogWidth * 0.2, '重新开始', 0x44aa44);

    buttonContainer.add([
      homeButton.glow, restartButton.glow,
      homeButton.bg, restartButton.bg,
      homeButton.text, restartButton.text
    ]);

    // 添加按钮点击事件
    homeButton.bg.on('pointerdown', () => {
      this.shutdown();
      this.scene.stop();
      this.scene.remove();

      if (this.game) {
        this.game.destroy(true);
      }

      if (typeof this.onBack === 'function') {
        this.onBack();
      }
    });

    restartButton.bg.on('pointerdown', () => {
      this.scene.restart();
    });

    // 添加出现动画
    const elements = [dialogBg, innerBg, gameOverText, buttonContainer];
    elements.forEach(element => {
      element.alpha = 0;
      element.y += scaleToDPR(50);
      this.tweens.add({
        targets: element,
        alpha: 1,
        y: element.y - scaleToDPR(50),
        duration: 500,
        ease: 'Back.easeOut'
      });
    });

    // 添加粒子效果
    this.add.particles(dialogX, dialogY - dialogHeight * 0.25, 'particle', {
      speed: { min: scaleToDPR(30), max: scaleToDPR(60) },
      angle: { min: 0, max: 360 },
      scale: { start: 0.2, end: 0 },
      blendMode: 'ADD',
      lifespan: 1000,
      frequency: 100,
      tint: [0xff4444, 0xff8844],
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Rectangle(-50, -10, 100, 20)
      }
    });
  }

  // 新增暂停对话框方法，复用游戏结束对话框的样式
  showPauseDialog() {
    // 先创建UI元素，再暂停场景
    const width = this.game.config.width;
    const height = this.game.config.height;

    // 创建一个新的场景来显示暂停菜单
    if (!this.scene.get('PauseScene')) {
      class PauseScene extends Phaser.Scene {
        constructor() {
          super({ key: 'PauseScene' });
        }

        create() {
          // 创建模糊背景
          const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0)
            .setDepth(100);

          // 对话框尺寸和位置
          const dialogWidth = Math.min(width * 0.8, scaleToDPR(500));
          const dialogHeight = Math.min(height * 0.5, scaleToDPR(300));
          const dialogX = width / 2;
          const dialogY = height / 2;

          // 创建对话框背景 - 主背景
          const dialogBg = this.add.rectangle(dialogX, dialogY, dialogWidth, dialogHeight, 0x1a1a1a)
            .setDepth(101);

          // 内层背景
          const innerBg = this.add.rectangle(dialogX, dialogY, dialogWidth - scaleToDPR(4), dialogHeight - scaleToDPR(4), 0x2a2a2a)
            .setDepth(101);

          // 添加渐变边框
          const border = this.add.graphics()
            .setDepth(101);

          // 创建渐变边框效果
          const gradientWidth = scaleToDPR(2);
          const colors = [0x4488ff, 0x44aaff, 0x44ddff];
          const borderAlpha = 0.8;

          let colorIndex = 0;
          this.borderTimer = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
              border.clear();
              const color = colors[colorIndex];
              border.lineStyle(gradientWidth, color, borderAlpha);
              border.strokeRect(
                dialogX - dialogWidth / 2,
                dialogY - dialogHeight / 2,
                dialogWidth,
                dialogHeight
              );
              colorIndex = (colorIndex + 1) % colors.length;
            }
          });

          // 添加标题装饰线
          const decorLine = this.add.graphics()
            .setDepth(101);
          decorLine.lineStyle(scaleToDPR(2), 0x4488ff, 0.8);
          decorLine.lineBetween(
            dialogX - dialogWidth * 0.3,
            dialogY - dialogHeight * 0.15,
            dialogX + dialogWidth * 0.3,
            dialogY - dialogHeight * 0.15
          );

          // 暂停标题文本
          const pauseTitle = this.add.text(dialogX, dialogY - dialogHeight * 0.25,
            '游戏暂停', {
            fontSize: `${scaleToDPR(40)}px`,
            fontFamily: 'Arial',
            color: '#4488ff',
            fontStyle: 'bold'
          })
            .setOrigin(0.5)
            .setDepth(101);

          // 添加文本发光效果
          pauseTitle.setStroke('#0066ff', scaleToDPR(1));
          this.tweens.add({
            targets: pauseTitle,
            alpha: 0.7,
            yoyo: true,
            repeat: -1,
            duration: 1000,
            ease: 'Sine.easeInOut'
          });

          // 创建按钮
          const createButton = (x, text, color) => {
            const buttonWidth = dialogWidth * 0.35;
            const buttonHeight = scaleToDPR(40);

            const buttonBg = this.add.rectangle(x, 0, buttonWidth, buttonHeight, color, 0.8)
              .setInteractive();
            const buttonText = this.add.text(x, 0, text, {
              fontSize: `${scaleToDPR(20)}px`,
              fontFamily: 'Arial',
              color: '#ffffff',
              fontStyle: 'bold'
            }).setOrigin(0.5);

            const glow = this.add.rectangle(x, 0, buttonWidth + scaleToDPR(4), buttonHeight + scaleToDPR(4), color, 0.3);

            buttonBg.on('pointerover', () => {
              this.tweens.add({
                targets: [buttonBg, buttonText],
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
              });
              glow.setAlpha(0.5);
            });

            buttonBg.on('pointerout', () => {
              this.tweens.add({
                targets: [buttonBg, buttonText],
                scaleX: 1,
                scaleY: 1,
                duration: 100
              });
              glow.setAlpha(0.3);
            });

            return { bg: buttonBg, text: buttonText, glow };
          };

          // 创建按钮容器
          const buttonContainer = this.add.container(dialogX, dialogY + dialogHeight * 0.15)
            .setDepth(101);

          const homeButton = createButton(-dialogWidth * 0.2, '返回首页', 0xff4444);
          const continueButton = createButton(dialogWidth * 0.2, '继续游戏', 0x44aa44);

          buttonContainer.add([
            homeButton.glow, continueButton.glow,
            homeButton.bg, continueButton.bg,
            homeButton.text, continueButton.text
          ]);

          // 添加按钮点击事件
          homeButton.bg.on('pointerdown', () => {
            const gameScene = this.scene.get('GameScene');
            if (gameScene) {
              if (typeof gameScene.onBack === 'function') {
                gameScene.onBack();
              }
              gameScene.scene.stop();
              gameScene.scene.remove();
              if (gameScene.game) {
                gameScene.game.destroy(true);
              }
            }
          });

          continueButton.bg.on('pointerdown', () => {
            const gameScene = this.scene.get('GameScene');
            if (gameScene) {
              gameScene.scene.resume();
              if (gameScene.monsterSpawnEvent) {
                gameScene.monsterSpawnEvent.paused = false;
              }
            }
            this.scene.stop();
          });

          // 添加出现动画
          const elements = [dialogBg, innerBg, pauseTitle, buttonContainer];
          elements.forEach(element => {
            element.alpha = 0;
            element.y += scaleToDPR(50);
            this.tweens.add({
              targets: element,
              alpha: 1,
              y: element.y - scaleToDPR(50),
              duration: 500,
              ease: 'Back.easeOut'
            });
          });
        }
      }

      this.scene.add('PauseScene', PauseScene, false);
    }

    // 启动暂停场景
    this.scene.launch('PauseScene');
    this.scene.pause();
    if (this.monsterSpawnEvent) {
      this.monsterSpawnEvent.paused = true;
    }
  }

  createShadowOverlay() {
    const topBarHeight = scaleToDPR(60);

    // 设置阴影的深度为较低的值
    const gradient = this.add.graphics()
      .setDepth(0);

    gradient.fillGradientStyle(
      0x000000,
      0x000000,
      0x000000,
      0x000000,
      0.6,
      0.6,
      0,
      0
    );

    gradient.fillRect(
      0,
      topBarHeight,
      this.game.config.width,
      this.game.config.height - topBarHeight
    );
  }
} 