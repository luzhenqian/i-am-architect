import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { scaleToDPR } from '../shared/utils';

export default class GameScene extends Phaser.Scene {
  constructor(data) {
    super({ key: 'GameScene' });
    this.config = new GameConfig();
    this.gridSize = this.config.gridSize;
    this.cellSize = this.config.cellSize;
    this.initialGold = this.config.initialGold;
    this.gold = this.config.initialGold;
    this.playerHealth = this.config.initialHealth;
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
    this.codeBlocks = [];
    this.isGameOver = false;
    this.onBack = data?.onBack; // 保存回调函数
    this.level = 1;
    this.experience = 0;
    this.nextLevelExp = 100;
  }

  init(data) {
    // 在 init 方法中获取回调函数
    this.onBack = data?.onBack;
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
    // 传送门
    this.load.image('portal', 'assets/images/portal.png');
    // 机器核心
    this.load.image('core', 'assets/images/core.png');
    this.load.image('level', 'assets/images/level.png');
    this.load.image('coin', 'assets/images/coin.png');
    this.load.image('pause', 'assets/images/pause.png');
    // this.load.image('grid', 'assets/ui/grid.png');
    // this.load.image('tower_base', 'assets/ui/tower_base.png');
    // 加载防御塔攻击音效
    this.config.towerTypes.forEach(tower => {
      // 只为有攻击能力的防御塔加载音效
      if (!['blockchain_node', 'firewall', 'debug_fairy'].includes(tower.key)) {
        try {
          this.load.audio(`${tower.key}_attack`, `assets/effects/attack/${tower.key}.wav`);
        } catch (error) {
          console.warn(`Warning: Attack sound effect not found for tower: ${tower.key}`);
        }
      }
    });
  }

  create() {
    console.log('GameScene create started');

    // 创建游戏背景
    this.add.rectangle(0, 0, this.game.config.width, this.game.config.height, 0x1a1a1a)
      .setOrigin(0, 0);

    // 计算适配尺寸
    const { width, height } = this.calculateGameDimensions();

    // 设置游戏区域
    this.gridOffset = {
      x: (this.game.config.width - width) / 2,
      y: this.topBarHeight + (height - this.topBarHeight - this.bottomPanelHeight - width) / 2
    };

    // 计算单个格子大小
    this.cellSize = width / this.gridSize.cols;

    // 更新UI布局
    this.updateUILayout();

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

  // 更新UI布局
  updateUILayout() {
    // 顶部信息栏
    const topBar = this.add.container(0, 0);
    topBar.setDepth(1000);

    // 背景
    const topBarBg = this.add.rectangle(
      0,
      0,
      this.game.config.width,
      this.topBarHeight,
      0x000000,
      0.8
    ).setOrigin(0);

    // 生命值
    this.healthText = this.add.text(
      scaleToDPR(10),
      this.topBarHeight / 2,
      `生命: ${this.health}`,
      {
        fontSize: `${scaleToDPR(18)}px`,
        color: '#ffffff'
      }
    ).setOrigin(0, 0.5);

    // 金币
    this.goldText = this.add.text(
      this.game.config.width / 2,
      this.topBarHeight / 2,
      `金币: ${this.gold}`,
      {
        fontSize: `${scaleToDPR(18)}px`,
        color: '#ffd700'
      }
    ).setOrigin(0.5);

    // 波次
    this.waveText = this.add.text(
      this.game.config.width - scaleToDPR(10),
      this.topBarHeight / 2,
      `波次: ${this.wave}`,
      {
        fontSize: `${scaleToDPR(18)}px`,
        color: '#ffffff'
      }
    ).setOrigin(1, 0.5);

    topBar.add([topBarBg, this.healthText, this.goldText, this.waveText]);

    // 底部控制面板
    this.createBottomPanel();
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
      0.8
    ).setOrigin(0);
  }

  update(time, delta) {
    this.updateMonsters();
    this.updateTowers(time, delta);

    // 更新所有防御塔的血条位置
    this.towers.forEach(tower => {
      this.updateTowerHealthBarPosition(tower);
    });

    // 更新波次进���
    this.updateWaveProgress();
  }

  // 创建顶部信息栏背景
  createTopBar() {
    const topBarHeight = scaleToDPR(60);
    const depth = 2000; // 增加深度值，确保显示在最上层

    // 创建顶部栏背景并设置深度
    const topBar = this.add.rectangle(0, 0, this.game.config.width, topBarHeight, 0x333333)
      .setOrigin(0, 0)
      .setAlpha(0.95) // 略微增加不透明度
      .setDepth(depth)
      .setScrollFactor(0); // 固定位置，不随场景滚动

    // 创建分隔线并设置深度
    const separator = this.add.graphics()
      .setDepth(depth)
      .setScrollFactor(0);
    separator.lineStyle(scaleToDPR(2), 0x666666, 1);
    separator.lineBetween(0, topBarHeight, this.game.config.width, topBarHeight);

    // 更新所有顶部栏UI元素的深度和滚动因子
    [this.levelText, this.expBar, this.goldText, this.waveText, this.waveProgressBar].forEach(element => {
      if (element) {
        element.setDepth(depth).setScrollFactor(0);
      }
    });

    // 确保所有子元素也固定在顶部
    const topBarElements = [
      this.levelText,
      this.expBar,
      this.goldText,
      this.waveText,
      this.waveProgressBar,
    ];

    topBarElements.forEach(element => {
      if (element) {
        element
          .setDepth(depth)
          .setScrollFactor(0);
      }
    });

    // 第一行 Y 坐标
    const firstRowY = topBarHeight / 3;

    // 左侧: 等级和经验条
    const levelStartX = scaleToDPR(20);
    const levelIcon = this.add.image(levelStartX, firstRowY, 'level')
      .setDisplaySize(scaleToDPR(48), scaleToDPR(48))
      .setDepth(depth + 2);

    // 等级文字放在图标正中心
    this.levelText = this.add.text(levelStartX, firstRowY, `${this.level || 1}`, {
      fontSize: `${scaleToDPR(14)}px`,
      fontFamily: 'Arial',
      color: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(depth + 3);

    // 经验条增加间距
    const expBarX = levelStartX + scaleToDPR(0);
    const expBarBg = this.add.rectangle(
      expBarX,
      firstRowY,
      scaleToDPR(100),
      scaleToDPR(6),
      0x444444
    ).setOrigin(0, 0.5)
      .setDepth(depth + 1) // 降低层级
    // .setRoundedRectangle(scaleToDPR(3)); // 添加圆角

    this.expBar = this.add.rectangle(
      expBarX,
      firstRowY,
      scaleToDPR(100) * ((this.experience || 0) / (this.nextLevelExp || 100)),
      scaleToDPR(6),
      0x00ff00
    ).setOrigin(0, 0.5).setDepth(depth);

    // 中间: 金币
    const coinX = this.game.config.width / 2 - scaleToDPR(50);
    const coinIcon = this.add.image(coinX, firstRowY, 'coin')
      .setDisplaySize(scaleToDPR(40), scaleToDPR(40))
      .setDepth(depth);

    this.goldText = this.add.text(coinX + scaleToDPR(20), firstRowY, `${this.gold}`, {
      fontSize: `${scaleToDPR(16)}px`,
      fontFamily: 'Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5).setDepth(depth);

    // 右侧: 波次和进度条
    const waveX = this.game.config.width - scaleToDPR(180);
    this.waveText = this.add.text(waveX, firstRowY, `第 ${this.wave} 波`, {
      fontSize: `${scaleToDPR(14)}px`,
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5).setDepth(depth);

    // 波次进度条
    const waveProgressBg = this.add.rectangle(
      waveX + scaleToDPR(80),
      firstRowY,
      scaleToDPR(80),
      scaleToDPR(6),
      0x444444
    ).setOrigin(0, 0.5).setDepth(depth);

    this.waveProgressBar = this.add.rectangle(
      waveX + scaleToDPR(80),
      firstRowY,
      0,
      scaleToDPR(6),
      0x3498db
    ).setOrigin(0, 0.5).setDepth(depth);

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
        const progress = 1 - (this.monstersRemaining / (5 + Math.floor(this.wave * 1.5)));
        this.waveProgressBar.width = scaleToDPR(100) * progress;
        this.waveText.setText(`第 ${this.wave} 波 (${this.monstersRemaining})`);
      } else {
        this.waveProgressBar.width = 0;
        this.waveText.setText(`第 ${this.wave} 波`);
      }
    };
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

    // 检查是否是不应该攻击的防御塔类型
    if (['debug_fairy', 'blockchain_node', 'firewall'].includes(towerType.key)) {
      return false;
    }

    // 检查并播放攻击音效
    const soundKey = `${tower.type}_attack`;
    // 检查所有音效
    console.log('检查所有音效', this.sound);
    const a = this.sound.add(soundKey);
    a.play({
      volume: 0.1,
      rate: 1.0
    });

    // 清理旧特效
    if (tower.currentEffect) {
      this.clearTowerEffects(tower);
    }

    // 创建新的攻击特效
    tower.currentEffect = this.createAttackEffect(tower, monster, tower.attackColor || 0x00ff00);

    // 根据防御塔类型处理不同的攻击逻辑
    switch (towerType.key) {
      case 'algo_cannon':
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
            const baseDamage = tower.attack || towerType.attack || 15;
            const damage = Math.max(1, Math.floor(baseDamage * damageRatio));

            this.damageMonster(targetMonster, damage);
            this.showDamageNumber(
              targetMonster.sprite.x,
              targetMonster.sprite.y,
              damage,
              0xff4400
            );
          }
        });

        this.showAOEIndicator(monster.sprite.x, monster.sprite.y, aoeRadius);
        return true;

      default:
        // 其他防御塔的单体伤害
        const defaultBaseDamage = tower.attack || towerType.attack || 10;
        const defaultMonsterDefense = monster.defense || 0;
        const defaultDamage = Math.max(1, Math.floor(defaultBaseDamage - defaultMonsterDefense));

        return this.damageMonster(monster, defaultDamage);
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
      // 1. 创建瞄准线效果 - 使用虚线
      const aimLine = this.add.graphics();
      aimLine.lineStyle(scaleToDPR(1), 0xff0000, 0.3, 1); // 最后一个参数是虚线
      aimLine.beginPath();
      aimLine.moveTo(tower.sprite.x, tower.sprite.y);
      aimLine.lineTo(monster.sprite.x, monster.sprite.y);
      aimLine.strokePath();

      // 2. 创建十字准星效果
      const crosshair = this.add.container(monster.sprite.x, monster.sprite.y);
      const crosshairSize = scaleToDPR(16);
      const lineLength = scaleToDPR(6);

      const crosshairGraphics = this.add.graphics();
      crosshairGraphics.lineStyle(scaleToDPR(1), 0xff0000, 0.8);

      // 绘制十字准星
      [0, 90, 180, 270].forEach(angle => {
        const rad = Phaser.Math.DegToRad(angle);
        crosshairGraphics.beginPath();
        crosshairGraphics.moveTo(
          Math.cos(rad) * lineLength,
          Math.sin(rad) * lineLength
        );
        crosshairGraphics.lineTo(
          Math.cos(rad) * crosshairSize,
          Math.sin(rad) * crosshairSize
        );
        crosshairGraphics.strokePath();
      });

      crosshair.add(crosshairGraphics);

      // 3. 创建子弹
      const bullet = this.add.container(tower.sprite.x, tower.sprite.y);
      const bulletCore = this.add.rectangle(0, 0, scaleToDPR(8), scaleToDPR(3), 0xffff00);
      const bulletTrail = this.add.rectangle(scaleToDPR(-6), 0, scaleToDPR(12), scaleToDPR(1), 0xff8800);
      bullet.add([bulletTrail, bulletCore]);

      // 计算子弹旋转角度
      const bulletAngle = Phaser.Math.Angle.Between(
        tower.sprite.x,
        tower.sprite.y,
        monster.sprite.x,
        monster.sprite.y
      );
      bullet.setRotation(bulletAngle);

      // 4. 创建枪口闪光
      const muzzleFlash = this.add.sprite(tower.sprite.x, tower.sprite.y, 'particle')
        .setScale(0.8)
        .setTint(0xffff00)
        .setAlpha(0.8);

      // 5. 子弹飞行动画
      this.tweens.add({
        targets: bullet,
        x: monster.sprite.x,
        y: monster.sprite.y,
        duration: 100, // 更快的子弹速度
        ease: 'Linear',
        onComplete: () => {
          // 创建击中效果
          const impact = this.add.circle(monster.sprite.x, monster.sprite.y, scaleToDPR(5), 0xffffff, 1);

          // 创建击中粒子效果
          const impactParticles = this.add.particles(monster.sprite.x, monster.sprite.y, 'particle', {
            speed: { min: scaleToDPR(100), max: scaleToDPR(200) },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 200,
            quantity: 6,
            angle: { min: 0, max: 360 },
            tint: [0xffff00, 0xff8800]
          });

          // 击中效果动画
          this.tweens.add({
            targets: [impact],
            scale: { from: 0.5, to: 2 },
            alpha: { from: 1, to: 0 },
            duration: 200,
            onComplete: () => {
              impact.destroy();
              impactParticles.destroy();
            }
          });

          bullet.destroy();
        }
      });

      // 6. 枪口闪光动画
      this.tweens.add({
        targets: muzzleFlash,
        scale: { from: 1.2, to: 0.2 },
        alpha: { from: 1, to: 0 },
        duration: 100,
        onComplete: () => muzzleFlash.destroy()
      });

      // 7. 准星动画
      this.tweens.add({
        targets: crosshair,
        scale: { from: 1.5, to: 1 },
        alpha: { from: 0.2, to: 1 },
        duration: 200
      });

      // 清理定时器
      this.time.delayedCall(300, () => {
        aimLine.destroy();
        crosshair.destroy();
      });

      return {
        aimLine,
        crosshair,
        bullet,
        muzzleFlash
      };
    } else if (towerType.key === 'algo_cannon') {
      // 算法炮台的特殊攻击效果
      const startPos = { x: tower.sprite.x, y: tower.sprite.y };
      const endPos = { x: monster.sprite.x, y: monster.sprite.y };

      // 创椭圆形炮弹
      const shell = this.add.ellipse(startPos.x, startPos.y, scaleToDPR(12), scaleToDPR(8), 0x333333);
      shell.setStrokeStyle(scaleToDPR(1), 0x666666);

      // 直线弹动
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
    } else if (towerType.key === 'code_warrior') {
      // 代码战士的特殊攻击效果
      const startPos = { x: tower.sprite.x, y: tower.sprite.y };
      const endPos = { x: monster.sprite.x, y: monster.sprite.y };

      // 创建子弹
      const bullet = this.add.container(startPos.x, startPos.y);

      // 子弹主体 - 蓝色能量弹
      const bulletBody = this.add.ellipse(0, 0, scaleToDPR(12), scaleToDPR(6), 0x00ffff);
      bulletBody.setAlpha(0.8);

      // 子弹尾迹
      const bulletTrail = this.add.ellipse(0, 0, scaleToDPR(16), scaleToDPR(4), 0x0088ff);
      bulletTrail.setAlpha(0.4);

      // 子弹光晕
      const bulletGlow = this.add.ellipse(0, 0, scaleToDPR(20), scaleToDPR(8), 0x00ffff);
      bulletGlow.setAlpha(0.2);

      bullet.add([bulletGlow, bulletTrail, bulletBody]);

      // 计算角度
      const angle = Phaser.Math.Angle.Between(startPos.x, startPos.y, endPos.x, endPos.y);
      bullet.setRotation(angle);

      // 创建发射闪光
      const muzzleFlash = this.add.circle(startPos.x, startPos.y, scaleToDPR(10), 0x00ffff, 0.8);

      // 发射粒子效果
      const particles = this.add.particles(startPos.x, startPos.y, 'particle', {
        speed: { min: scaleToDPR(50), max: scaleToDPR(100) },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.6, end: 0 },
        tint: 0x00ffff,
        blendMode: 'ADD',
        lifespan: 200,
        quantity: 8,
        angle: {
          min: Phaser.Math.RadToDeg(angle) - 15,
          max: Phaser.Math.RadToDeg(angle) + 15
        }
      });

      // 子弹飞行动画
      this.tweens.add({
        targets: bullet,
        x: endPos.x,
        y: endPos.y,
        duration: 400,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          // 创建命中效果
          const impact = this.add.circle(endPos.x, endPos.y, scaleToDPR(15), 0x00ffff, 0.8);

          // 命中粒子
          const impactParticles = this.add.particles(endPos.x, endPos.y, 'particle', {
            speed: { min: scaleToDPR(80), max: scaleToDPR(160) },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.6, end: 0 },
            tint: [0x00ffff, 0x0088ff],
            blendMode: 'ADD',
            lifespan: 300,
            quantity: 12,
            angle: { min: 0, max: 360 }
          });

          // 命中波纹
          const ring = this.add.circle(endPos.x, endPos.y, scaleToDPR(10), 0x00ffff, 0);
          ring.setStrokeStyle(scaleToDPR(2), 0x00ffff, 1);

          // 命中效果动画
          this.tweens.add({
            targets: [impact, ring],
            scale: 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
              impact.destroy();
              ring.destroy();
              impactParticles.destroy();
            }
          });

          // 清理子弹相关效果
          bullet.destroy();
          particles.destroy();
        }
      });

      // 发射闪光动画
      this.tweens.add({
        targets: muzzleFlash,
        scale: { from: 0.8, to: 1.5 },
        alpha: { from: 0.8, to: 0 },
        duration: 200,
        ease: 'Power2',
        onComplete: () => muzzleFlash.destroy()
      });

      // 子弹尾迹动画
      this.tweens.add({
        targets: bulletTrail,
        scaleX: { from: 1, to: 1.5 },
        alpha: { from: 0.4, to: 0 },
        duration: 400,
        ease: 'Power2'
      });

      return { bullet, particles };
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

  // 更新放置防御塔方法，添加唯一ID
  placeTower(row, col, towerType) {
    if (!this.canPlaceTower(row, col)) return;

    const tower = this.towerTypes.find(t => t.key === towerType);
    if (!tower || this.gold < tower.cost) return;

    // 扣除金币
    this.updateGold(this.gold - tower.cost);

    // 标记格子为已占用
    this.grid[row][col].occupied = true;

    const x = this.grid[row][col].x;
    const y = this.grid[row][col].y;

    // 创建防御塔
    const towerSprite = this.add.image(x, y, towerType)
      .setDisplaySize(this.cellSize * 0.8, this.cellSize * 0.8)
      .setInteractive({ draggable: true }); // 设置为可交互和可拖拽

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

    // 添加对话框
    this.addTowerDialogue(newTower);

    // 将每秒攻击次数转换为毫秒间隔
    const towerConfig = this.config.towerTypes.find(t => t.key === towerType);
    newTower.attackInterval = Math.floor(1000 / towerConfig.attackSpeed);

    this.towers.push(newTower);

    // 设置拖拽事件
    towerSprite.on('dragstart', () => {
      console.log('Tower drag started');
      this.deleteZone.setVisible(true);
      this.scrollPanel.setVisible(false);
      towerSprite.originalPosition = { x: towerSprite.x, y: towerSprite.y };

      // 清除可能存在的旧预览
      if (this.rangePreview) {
        this.rangePreview.destroy();
      }

      // 只为有攻击范围的防御塔显示范围预览
      if (!['blockchain_node', 'firewall'].includes(towerType)) {
        this.rangePreview = this.add.graphics();
        this.updateRangePreview(towerSprite.x, towerSprite.y, newTower.range);
      }
    });

    towerSprite.on('drag', (pointer, dragX, dragY) => {
      // 更新防御塔位置
      towerSprite.x = dragX;
      towerSprite.y = dragY;

      // 更新血条位置
      this.updateTowerHealthBarPosition(newTower);

      // 更新攻击范围预览位置
      if (this.rangePreview) {
        this.updateRangePreview(dragX, dragY, newTower.range);
      }
    });

    towerSprite.on('dragend', (pointer) => {
      console.log('Tower drag ended');
      const panelHeight = scaleToDPR(160);

      // 清除攻击范围预览
      if (this.rangePreview) {
        this.rangePreview.destroy();
        this.rangePreview = null;
      }

      if (pointer.y > this.game.config.height - panelHeight) {
        // 播放删除动画
        this.tweens.add({
          targets: [towerSprite, newTower.healthBar.background, newTower.healthBar.bar],
          alpha: 0,
          scale: 0.5,
          duration: 200,
          onComplete: () => {
            // 清除网格占用状态
            this.grid[row][col].occupied = false;

            // 恢复格子的原始颜色和边框
            const cell = this.grid[row][col].cell;
            cell.setFillStyle(0x333333);
            cell.setStrokeStyle(scaleToDPR(1), 0x444444);

            // 从数组中移除防御塔
            const index = this.towers.indexOf(newTower);
            if (index > -1) {
              this.towers.splice(index, 1);
            }

            // 销毁防御塔及其相关组件
            towerSprite.destroy();
            newTower.healthBar.background.destroy();
            newTower.healthBar.bar.destroy();

            // 返还一部分金币
            const refund = Math.floor(tower.cost * 0.7);
            this.updateGold(this.gold + refund);
            this.showRefundText(pointer.x, pointer.y, refund);
          }
        });
      } else {
        // 返回原位
        towerSprite.x = towerSprite.originalPosition.x;
        towerSprite.y = towerSprite.originalPosition.y;
        this.updateTowerHealthBarPosition(newTower);
      }

      // 隐藏删除区域
      this.deleteZone.setVisible(false);
      // 显示原始面板
      this.scrollPanel.setVisible(true);
    });

    // 确保拖拽插件已启用
    if (!this.input.draggable) {
      this.input.dragDistanceThreshold = 0;
      this.input.setDraggable(towerSprite);
    }

    if (towerType === 'blockchain_node') {
      // 为区块链节点设置金币生成定时器
      const goldGenerationEvent = this.time.addEvent({
        delay: 5000, // 每5秒生成一次
        callback: () => {
          const goldAmount = 10; // 每次生成10金币
          this.generateGold(newTower, goldAmount);
        },
        loop: true
      });

      // 将定时器引用存储在塔的属性中，以便后续清理
      newTower.goldGenerationEvent = goldGenerationEvent;
    }

    if (towerType === 'debug_fairy') {
      // 为代码精灵设置治疗定时器
      const healingEvent = this.time.addEvent({
        delay: Math.floor(1000 / tower.attackSpeed), // 根据攻击速度设置间隔
        callback: () => {
          this.healNearbyTowers(newTower);
        },
        loop: true
      });

      // 将定时器引用存储在塔的属性中，以便后续清理
      newTower.healingEvent = healingEvent;
    }

    return newTower;
  }


  // 添加新方法来创建对话气泡
  addTowerDialogue(tower) {
    const dialogues = [
      "代码又抽风，头秃要成翁！",
      "变量瞎搞，脑袋要爆！",
      "函数一跑，Bug全来闹！",
      "指针指东，代码全发懵！",
      "循环转不停，脑袋要变形！",
      "Bug一冒，代码全乱套！",
      "代码像疯癫，工作全玩完！",
      "程序像魔仙，BUG在疯癫！",
      "逻辑太复杂，脑子要爆炸！",
      "函数一飞，代码全稀碎！"
    ];

    // 创建定时器来随机显示对话
    const showDialogue = () => {
      // 如果防御塔已被销毁,停止显示对话
      if (!tower.sprite || !tower.sprite.active) return;

      // 随机选择一句话
      const text = Phaser.Utils.Array.GetRandom(dialogues);

      // 创建对话气泡背景
      const padding = scaleToDPR(10);
      const maxWidth = scaleToDPR(150);
      const bubbleText = this.add.text(0, 0, text, {
        fontSize: `${scaleToDPR(12)}px`,
        fontFamily: 'Arial',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: maxWidth }
      });

      // 计算气泡大小
      const bounds = bubbleText.getBounds();
      const bubbleBg = this.add.graphics();
      bubbleBg.fillStyle(0x333333, 0.9);
      bubbleBg.lineStyle(scaleToDPR(2), 0x666666, 1);

      // 绘制圆角矩形气泡
      const cornerRadius = scaleToDPR(8);
      const bubbleWidth = bounds.width + padding * 2;
      const bubbleHeight = bounds.height + padding * 2;
      const x = tower.sprite.x - bubbleWidth / 2;
      const y = tower.sprite.y - bubbleHeight - scaleToDPR(40);

      bubbleBg.fillRoundedRect(x, y, bubbleWidth, bubbleHeight, cornerRadius);
      bubbleBg.strokeRoundedRect(x, y, bubbleWidth, bubbleHeight, cornerRadius);

      // 绘制小三角
      bubbleBg.fillTriangle(
        x + bubbleWidth / 2 - scaleToDPR(10),
        y + bubbleHeight,
        x + bubbleWidth / 2 + scaleToDPR(10),
        y + bubbleHeight,
        x + bubbleWidth / 2,
        y + bubbleHeight + scaleToDPR(10)
      );

      // 设置文本位置
      bubbleText.setPosition(x + padding, y + padding);

      // 创建容器来组合背景和文本
      const container = this.add.container(0, 0, [bubbleBg, bubbleText]);
      container.setDepth(1000);

      // 添加出现动画
      container.setScale(0);
      container.setAlpha(0);

      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        duration: 200,
        ease: 'Back.out',
        onComplete: () => {
          // 等待一段时间后消失
          this.time.delayedCall(3000, () => {
            this.tweens.add({
              targets: container,
              scaleX: 0,
              scaleY: 0,
              alpha: 0,
              duration: 200,
              ease: 'Back.in',
              onComplete: () => container.destroy()
            });
          });
        }
      });
    };

    // 初始延迟
    const initialDelay = Phaser.Math.Between(2000, 5000);
    this.time.delayedCall(initialDelay, () => {
      showDialogue();

      // 设置随机间隔显示对话
      tower.dialogueTimer = this.time.addEvent({
        delay: Phaser.Math.Between(8000, 15000),
        callback: showDialogue,
        loop: true
      });
    });
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

        // 首检查是否有任何finally代码块被触碰
        const finallyBlocks = this.codeBlocks?.filter(block => block.type === 'finally') || [];
        for (const finallyBlock of finallyBlocks) {
          if (Math.abs(monster.sprite.y - finallyBlock.sprite.y) < this.cellSize * 0.5 &&
            Math.abs(monster.sprite.x - finallyBlock.sprite.x) < this.cellSize * 0.5) {
            // 如果碰到任何finally代码块，直接结束游戏
            this.handleGameOver();
            this.playDeathAnimation(monster);
            return;
          }
        }

        // 检查是否与机器核心或catch代块碰撞
        const machineCore = this.machineCores[monster.column];
        const codeBlock = this.findCodeBlockInColumn(monster.column);

        if (machineCore && !machineCore.isDestroyed &&
          Math.abs(monster.sprite.y - machineCore.y) < this.cellSize * 0.5) {
          // 与机器核心碰撞
          this.destroyMachineCore(monster.column);
          this.createCodeBlock(monster.column, 'catch');
          this.playDeathAnimation(monster);
        } else if (codeBlock && codeBlock.type === 'catch' &&
          Math.abs(monster.sprite.y - codeBlock.sprite.y) < this.cellSize * 0.5) {
          // 与catch代码块碰撞
          this.triggerCodeBlockExplosion(codeBlock);
          this.createCodeBlock(monster.column, 'finally');
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
      const damage = Math.max(5, baseDamage - defense); // 确最小伤害为5

      // 应伤害
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
    // 如果代码精灵，清理治疗定时器
    if (tower.type === 'debug_fairy' && tower.healingEvent) {
      tower.healingEvent.destroy();
    }
    // 如果是区块链节点，清理金币生成定时器
    if (tower.type === 'blockchain_node' && tower.goldGenerationEvent) {
      tower.goldGenerationEvent.destroy();
    }

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

        // 清除网格占用状态
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
    if (this.towers) {
      this.towers.forEach(tower => {
        if (tower.sprite) tower.sprite.destroy();
        if (tower.healthBar) {
          tower.healthBar.background.destroy();
          tower.healthBar.bar.destroy();
        }
        // 清除特殊防御塔的定时器
        if (tower.goldGenerationEvent) tower.goldGenerationEvent.destroy();
        if (tower.healingEvent) tower.healingEvent.destroy();
      });
      this.towers = [];
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

    // 创建网格背景
    this.add.rectangle(
      offsetX,
      this.gridOffset.y,
      gridWidth,
      gridHeight,
      0x222222
    ).setOrigin(0, 0);

    // 创建机器核心 (在网格下方)
    this.createMachineCores(offsetX, this.gridOffset.y + gridHeight, gridWidth);

    // 创建网格
    this.grid = [];
    for (let row = 0; row < this.gridSize.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.gridSize.cols; col++) {
        const x = this.gridOffset.x + col * this.cellSize;
        const y = this.gridOffset.y + row * this.cellSize;

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

    const panelHeight = scaleToDPR(120); // 从160改为120
    const panelY = this.game.config.height - panelHeight;

    // 创建滚动面板容器
    const scrollPanel = this.add.container(0, panelY);
    this.scrollPanel = scrollPanel; // 保存为类属性以便其他方法访问

    // 添加底板背
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
      const cardBg = this.add.rectangle(0, 0, scaleToDPR(80), scaleToDPR(94),
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

        if (cellCoords && this.canPlaceTower(cellCoords.row, cellCoords.col)) {
          this.placeTower(cellCoords.row, cellCoords.col, this.dragTower.type);
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

  canPlaceTower(row, col) {
    return row >= 0 && row < this.gridSize.rows &&
      col >= 0 && col < this.gridSize.cols &&
      this.grid[row] &&
      this.grid[row][col] &&
      !this.grid[row][col].occupied;  // 检查格子是否已被占用
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
    this.monsters.push(monster);

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
      } else if (this.canPlaceTower(row, col)) {
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
        this.updateGold(this.gold + monster.reward);
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

  // 新防御塔血条位置
  updateTowerHealthBarPosition(tower) {
    if (tower.healthBar) {
      tower.healthBar.background.x = tower.sprite.x;
      tower.healthBar.background.y = tower.sprite.y - this.cellSize / 2;
      tower.healthBar.bar.x = tower.sprite.x - tower.healthBar.background.width / 2;
      tower.healthBar.bar.y = tower.sprite.y - this.cellSize / 2;
    }
  }

  // 添加调试精灵的治疗功能
  healNearbyTowers(sourceTower) {
    const healRadius = sourceTower.range * this.cellSize;
    let targetTower = null;
    let lowestHealthPercentage = 1;

    // 查找范围内血量百分比最低的防御塔（包括自己）
    this.towers.forEach(tower => {
      const distance = Phaser.Math.Distance.Between(
        sourceTower.sprite.x,
        sourceTower.sprite.y,
        tower.sprite.x,
        tower.sprite.y
      );

      if (distance <= healRadius) {
        const healthPercentage = tower.health / tower.maxHealth;
        if (healthPercentage < 1 && healthPercentage < lowestHealthPercentage) {
          lowestHealthPercentage = healthPercentage;
          targetTower = tower;
        }
      }
    });

    // 如果找到需要治疗的目标
    if (targetTower) {
      // 计算治疗量
      const healing = sourceTower.attack || 10;
      targetTower.health = Math.min(targetTower.maxHealth, targetTower.health + healing);

      // 更新血条
      const healthPercentage = targetTower.health / targetTower.maxHealth;
      this.updateHealthBar(targetTower.healthBar, healthPercentage);

      // 显示治疗数字
      this.showHealNumber(targetTower.sprite.x, targetTower.sprite.y, healing);

      // 创建治疗特效
      this.createHealEffect(sourceTower, targetTower);
    }
  }

  // 创建治疗特效
  createHealEffect(sourceTower, targetTower) {
    // 定义治疗主色调
    const healColor = 0x00ff88;
    const healColorBright = 0x80ffaa;

    // 创建治疗光束
    const line = this.add.graphics();

    // 创建双层光束效果
    line.lineStyle(scaleToDPR(4), healColor, 0.3); // 外层光束
    line.beginPath();
    line.moveTo(sourceTower.sprite.x, sourceTower.sprite.y);
    line.lineTo(targetTower.sprite.x, targetTower.sprite.y);
    line.strokePath();

    line.lineStyle(scaleToDPR(2), healColorBright, 0.7); // 内层光束
    line.beginPath();
    line.moveTo(sourceTower.sprite.x, sourceTower.sprite.y);
    line.lineTo(targetTower.sprite.x, targetTower.sprite.y);
    line.strokePath();

    // 创建源点光环
    const sourceGlow = this.add.circle(
      sourceTower.sprite.x,
      sourceTower.sprite.y,
      scaleToDPR(15),
      healColor,
      0.5
    );

    // 创建目标点光环
    const targetGlow = this.add.circle(
      targetTower.sprite.x,
      targetTower.sprite.y,
      scaleToDPR(20),
      healColor,
      0.5
    );

    // 创建治疗粒子 - 沿光束路径
    const dx = targetTower.sprite.x - sourceTower.sprite.x;
    const dy = targetTower.sprite.y - sourceTower.sprite.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    const particles = this.add.particles(sourceTower.sprite.x, sourceTower.sprite.y, 'particle', {
      speed: { min: scaleToDPR(150), max: scaleToDPR(200) },
      angle: { min: angle - 5, max: angle + 5 },
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      lifespan: 500,
      quantity: 2,
      tint: [healColor, healColorBright],
      emitting: true
    });

    // 创建目标点治疗光环动画 - 使用 Graphics 代替 Circle
    const healRing = this.add.graphics();
    const initialRadius = scaleToDPR(10);
    const targetRadius = scaleToDPR(30);

    // 创建扩散动画
    let progress = 0;
    const expandRing = this.time.addEvent({
      delay: 16, // 约60fps
      callback: () => {
        progress += 0.05; // 控制动画速度
        const currentRadius = Phaser.Math.Linear(initialRadius, targetRadius, progress);
        const alpha = 1 - progress;

        healRing.clear();
        healRing.lineStyle(scaleToDPR(2), healColor, alpha);
        healRing.strokeCircle(targetTower.sprite.x, targetTower.sprite.y, currentRadius);

        if (progress >= 1) {
          expandRing.destroy();
          healRing.destroy();
        }
      },
      repeat: 20 // 调整重复次数以匹配所需的动画持续时间
    });

    // 目标点光晕效果
    this.tweens.add({
      targets: targetGlow,
      scale: 1.5,
      alpha: 0,
      duration: 600,
      ease: 'Quad.out'
    });

    // 源点光晕效果
    this.tweens.add({
      targets: sourceGlow,
      scale: 1.3,
      alpha: 0,
      duration: 400,
      ease: 'Quad.out'
    });

    // 束渐隐效果
    this.tweens.add({
      targets: line,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        line.destroy();
        particles.destroy();
        sourceGlow.destroy();
        targetGlow.destroy();
      }
    });

    // 在目标位置创建上升的治疗符
    const healSymbol = this.add.text(
      targetTower.sprite.x,
      targetTower.sprite.y,
      '+',
      {
        fontSize: `${scaleToDPR(24)}px`,
        fontFamily: 'Arial',
        color: '#00ff88',
        stroke: '#ffffff',
        strokeThickness: scaleToDPR(1)
      }
    ).setOrigin(0.5);

    // 治疗符动画
    this.tweens.add({
      targets: healSymbol,
      y: targetTower.sprite.y - scaleToDPR(30),
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      ease: 'Quad.out',
      onComplete: () => healSymbol.destroy()
    });
  }

  // 更新显示治疗数字的方
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

  // 添加产生金币的功能
  generateGold(tower, amount) {
    // 创建金币图标位置（在防御塔稍微上方）
    const coinX = tower.sprite.x;
    const coinY = tower.sprite.y - scaleToDPR(30);

    // 创建金币图标
    const coinIcon = this.add.circle(
      coinX,
      coinY,
      scaleToDPR(12),
      0xffd700
    );

    // 创建金币符号
    const coinSymbol = this.add.text(
      coinX,
      coinY,
      '₿',
      {
        fontSize: `${scaleToDPR(16)}px`,
        fontFamily: 'Arial',
        color: '#000000'
      }
    ).setOrigin(0.5);

    // 创建金币文本
    const amountText = this.add.text(
      coinX + scaleToDPR(20),
      coinY,
      `+${amount}`,
      {
        fontSize: `${scaleToDPR(16)}px`,
        fontFamily: 'Arial',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: scaleToDPR(2)
      }
    ).setOrigin(0, 0.5);

    // 创建粒子效果
    const particles = this.add.particles(coinX, coinY, 'particle', {
      speed: { min: scaleToDPR(50), max: scaleToDPR(100) },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: 0xffd700,
      blendMode: 'ADD',
      lifespan: 500,
      quantity: 5,
      angle: { min: -30, max: 30 }
    });

    // 金币上升动画
    this.tweens.add({
      targets: [coinIcon, coinSymbol, amountText],
      y: coinY - scaleToDPR(40),
      alpha: { from: 1, to: 0 },
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        coinIcon.destroy();
        coinSymbol.destroy();
        amountText.destroy();
        particles.destroy();
      }
    });

    // 更新金币数量并添加跳动效果
    this.updateGold(this.gold + amount);

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

    // 添加闪光效果
    const flash = this.add.circle(
      tower.sprite.x,
      tower.sprite.y,
      scaleToDPR(25),
      0xffd700,
      0.3
    );

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.2,
      duration: 500,
      onComplete: () => flash.destroy()
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

    // 移除键盘事件监听
    this.input.keyboard.off('keydown-ESC');
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

    // ... rest of the method ...
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
    this.goldText.setText(`金币: ${this.gold}`);
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