import Phaser from 'phaser';
import { DisplayUtils, scaleToDPR } from '../../shared/utils/DisplayUtils';

export class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.topBarHeight = scaleToDPR(60);
    this.bottomPanelHeight = scaleToDPR(120);

    this.goldText = null;
    this.levelText = null;
    this.waveText = null;
    this.expBar = null;
    this.waveProgress = null;
    this.scrollPanel = null;
  }

  // 创建顶部信息栏
  createTopBar() {
    const topBarHeight = scaleToDPR(60);
    const depth = 2000;

    // 创建顶部栏背景并设置深度和半透明
    const topBar = this.scene.add.rectangle(0, 0, this.scene.game.config.width, topBarHeight, 0x333333)
      .setOrigin(0, 0)
      .setAlpha(0.1) // 降低不透明度
      .setDepth(depth)
      .setScrollFactor(0);

    // 第一行 Y 坐标
    const firstRowY = topBarHeight / 3;

    // 左侧: 等级和经验条
    this.createLevelDisplay(firstRowY, depth);

    // 中间: 金币
    this.createGoldDisplay(firstRowY, depth);

    // 右侧: 波次文本
    this.createWaveDisplay(firstRowY, depth);

    // 创建暂停按钮
    this.createPauseButton(depth);

    // 添加波次进度指示器
    this.createWaveProgressIndicator();
  }

  // 创建等级显示
  createLevelDisplay(firstRowY, depth) {
    const levelStartX = scaleToDPR(20);
    const levelIcon = this.scene.add.image(levelStartX, firstRowY, 'level')
      .setDisplaySize(scaleToDPR(48), scaleToDPR(48))
      .setDepth(depth + 5);

    this.levelText = this.scene.add.text(levelStartX, firstRowY, `${this.scene.level || 1}`, {
      fontSize: `${scaleToDPR(14)}px`,
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(depth + 6);

    // 经验条背景
    const expBarX = levelStartX + scaleToDPR(0);
    const expBarBg = this.scene.add.rectangle(
      expBarX,
      firstRowY,
      scaleToDPR(100),
      scaleToDPR(6),
      0x333333,
      0.8
    ).setOrigin(0, 0.5).setDepth(depth + 1);

    // 经验条
    this.expBar = this.scene.add.rectangle(
      expBarX,
      firstRowY,
      scaleToDPR(100) * ((this.scene.experience || 0) / (this.scene.nextLevelExp || 100)),
      scaleToDPR(6),
      0x00ff00,
      1
    ).setOrigin(0, 0.5).setDepth(depth + 2);
  }

  // 创建金币显示
  createGoldDisplay(firstRowY, depth) {
    const coinX = this.scene.game.config.width / 2 - scaleToDPR(0);
    const coinIcon = this.scene.add.image(coinX, firstRowY, 'coin')
      .setDisplaySize(scaleToDPR(34), scaleToDPR(34))
      .setDepth(depth);

    this.goldText = this.scene.add.text(coinX + scaleToDPR(20), firstRowY, `${this.scene.gold}`, {
      fontSize: `${scaleToDPR(16)}px`,
      fontFamily: 'Arial',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0, 0.5).setDepth(depth);
  }

  // 创建波次显示
  createWaveDisplay(firstRowY, depth) {
    const waveX = this.scene.game.config.width - scaleToDPR(20);
    this.waveText = this.scene.add.text(waveX, firstRowY, `第 ${this.scene.wave} 波`, {
      fontSize: `${scaleToDPR(14)}px`,
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(1, 0.5).setDepth(depth);
  }

  // 创建暂停按钮
  createPauseButton(depth) {
    const secondRowY = this.topBarHeight * 2 / 3 + scaleToDPR(16);
    const pauseButton = this.scene.add.image(
      scaleToDPR(20),
      secondRowY,
      'pause'
    )
      .setDisplaySize(scaleToDPR(32), scaleToDPR(32))
      .setInteractive()
      .setDepth(depth);

    pauseButton.on('pointerover', () => {
      this.scene.input.setDefaultCursor('pointer');
    });

    pauseButton.on('pointerout', () => {
      this.scene.input.setDefaultCursor('default');
    });

    pauseButton.on('pointerdown', () => {
      this.scene.showPauseDialog();
    });
  }

  // 创建波次进度指示器
  createWaveProgressIndicator() {
    this.waveProgress = this.scene.add.text(
      this.scene.game.config.width - scaleToDPR(20),
      this.topBarHeight - scaleToDPR(10),
      '',
      {
        fontSize: `${scaleToDPR(14)}px`,
        fontFamily: 'Arial',
        color: '#aaaaaa'
      }
    ).setOrigin(1, 1);
  }

  // 更新经验条
  updateExpBar() {
    if (!this.expBar) return;
    const progress = this.scene.experience / this.scene.nextLevelExp;
    this.expBar.width = scaleToDPR(100) * progress;
  }

  // 更新金币显示
  updateGold(amount) {
    if (this.goldText) {
      this.scene.gold = amount;
      this.goldText.setText(`${amount}`);
      this.scene.events.emit('goldChanged');
    }
  }

  // 更新波次进度显示
  updateWaveProgress() {
    if (this.waveProgress) {
      if (this.scene.isWaveActive && this.scene.monstersRemaining > 0) {
        this.waveProgress.setText(`剩余: ${this.scene.monstersRemaining}`);
      } else {
        this.waveProgress.setText('准备就绪');
      }
    }
  }

  // 更新等级显示
  updateLevel(level) {
    if (this.levelText) {
      this.levelText.setText(`${level}`);
    }
  }

  // 清理资源
  destroy() {
    if (this.scrollPanel) {
      this.scrollPanel.destroy();
    }
  }
}
