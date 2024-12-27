export class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.pauseMenu = null;
    this.exitConfirm = null;
    this.healthText = null;
    this.goldText = null;
    this.waveText = null;
    this.waveProgress = null;
    this.pauseText = null;
  }

  createUI() {
    this.createTopBar();
    this.createPauseMenu();
    this.createExitConfirm();
    this.setupKeyboardControls();
  }

  createTopBar() {
    // 创建顶部信息栏背景
    const topBarHeight = 60;
    const topBar = this.scene.add.rectangle(0, 0, this.scene.game.config.width, topBarHeight, 0x333333)
      .setOrigin(0, 0)
      .setAlpha(0.8);

    // 创建分隔线
    const separator = this.scene.add.graphics();
    separator.lineStyle(2, 0x666666, 1);
    separator.lineBetween(0, topBarHeight, this.scene.game.config.width, topBarHeight);

    // 左侧：生命值 (x: 30)
    const healthIcon = this.scene.add.circle(30, topBarHeight/2, 12, 0xff0000);
    this.healthText = this.scene.add.text(50, topBarHeight/2, `生命值: ${this.scene.playerHealth}`, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    // 中间偏左：金币 (x: 200)
    const coinIcon = this.scene.add.circle(200, topBarHeight/2, 12, 0xffd700);
    const coinSymbol = this.scene.add.text(200, topBarHeight/2, '₿', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#000000'
    }).setOrigin(0.5);
    
    this.goldText = this.scene.add.text(220, topBarHeight/2, `金币: ${this.scene.gold}`, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    // 中间：波次信息 (x: 400)
    this.waveText = this.scene.add.text(400, topBarHeight/2, `波次: ${this.scene.wave}`, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    // 波次进度显示
    this.waveProgress = this.scene.add.text(400, topBarHeight - 10, '', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#aaaaaa'
    }).setOrigin(0, 1);

    // 右侧：暂停按钮 (x: game.width - 100)
    const pauseX = this.scene.game.config.width - 100;
    const pauseButton = this.scene.add.rectangle(pauseX, topBarHeight/2, 80, 30, 0x4CAF50)
      .setInteractive();
    
    this.pauseText = this.scene.add.text(pauseX, topBarHeight/2, '暂停', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 暂停按钮交互
    pauseButton.on('pointerover', () => {
      pauseButton.setFillStyle(0x45a049);
      this.scene.input.setDefaultCursor('pointer');
    });

    pauseButton.on('pointerout', () => {
      pauseButton.setFillStyle(0x4CAF50);
      this.scene.input.setDefaultCursor('default');
    });

    pauseButton.on('pointerdown', () => {
      this.togglePause();
    });
  }

  createPauseMenu() {
    this.pauseMenu = this.scene.add.container(this.scene.game.config.width/2, this.scene.game.config.height/2);
    this.pauseMenu.setDepth(2000);
    this.pauseMenu.setVisible(false);

    // 暂停菜单背景
    const menuBg = this.scene.add.rectangle(0, 0, 300, 200, 0x000000, 0.8);
    const menuTitle = this.scene.add.text(0, -70, '游戏暂停', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 继续按钮
    const resumeButton = this.scene.add.rectangle(0, 0, 200, 40, 0x4CAF50)
      .setInteractive();
    const resumeText = this.scene.add.text(0, 0, '继续游戏', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    resumeButton.on('pointerover', () => {
      resumeButton.setFillStyle(0x45a049);
      this.scene.input.setDefaultCursor('pointer');
    });

    resumeButton.on('pointerout', () => {
      resumeButton.setFillStyle(0x4CAF50);
      this.scene.input.setDefaultCursor('default');
    });

    resumeButton.on('pointerup', () => {
      this.togglePause();
    });

    this.pauseMenu.add([menuBg, menuTitle, resumeButton, resumeText]);
  }

  createExitConfirm() {
    this.exitConfirm = this.scene.add.container(this.scene.game.config.width/2, this.scene.game.config.height/2);
    this.exitConfirm.setDepth(2000);
    this.exitConfirm.setVisible(false);

    const exitBg = this.scene.add.rectangle(0, 0, 400, 200, 0x000000, 0.8);
    const exitTitle = this.scene.add.text(0, -50, '确定要退出游戏吗？', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 确认和取消按钮
    const confirmButton = this.scene.add.rectangle(-80, 30, 120, 40, 0xff4444)
      .setInteractive();
    const confirmText = this.scene.add.text(-80, 30, '确认', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const cancelButton = this.scene.add.rectangle(80, 30, 120, 40, 0x4CAF50)
      .setInteractive();
    const cancelText = this.scene.add.text(80, 30, '取消', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    confirmButton.on('pointerdown', () => {
      this.scene.scene.start('MenuScene');
    });

    cancelButton.on('pointerdown', () => {
      this.exitConfirm.setVisible(false);
      if (this.scene.scene.isPaused()) {
        this.scene.scene.resume();
      }
    });

    this.exitConfirm.add([exitBg, exitTitle, confirmButton, confirmText, cancelButton, cancelText]);
  }

  setupKeyboardControls() {
    this.scene.input.keyboard.on('keydown-ESC', () => {
      if (this.exitConfirm.visible) {
        this.exitConfirm.setVisible(false);
        if (!this.pauseMenu.visible) {
          this.scene.scene.resume();
        }
      } else {
        this.togglePause();
      }
    });
  }

  togglePause() {
    if (this.scene.scene.isPaused()) {
      this.scene.scene.resume();
      this.pauseMenu.setVisible(false);
      this.pauseText.setText('暂停');
      
      if (this.scene.monsterSpawnEvent) {
        this.scene.monsterSpawnEvent.paused = false;
      }
      
      this.scene.tweens.resumeAll();
      this.scene.game.loop.wake();
    } else {
      this.scene.scene.pause();
      this.pauseMenu.setVisible(true);
      this.pauseText.setText('已暂停');
      
      if (this.scene.monsterSpawnEvent) {
        this.scene.monsterSpawnEvent.paused = true;
      }
      
      this.scene.tweens.pauseAll();
      this.scene.game.loop.sleep();
    }
  }

  showExitConfirmation() {
    this.exitConfirm.setVisible(true);
    if (!this.scene.scene.isPaused()) {
      this.togglePause();
    }
    this.pauseMenu.setVisible(false);
  }

  updateHealthText() {
    this.healthText.setText(`生命值: ${this.scene.playerHealth}`);
  }

  updateGoldText() {
    this.goldText.setText(`金币: ${this.scene.gold}`);
  }

  updateWaveText() {
    this.waveText.setText(`波次: ${this.scene.wave}`);
  }

  updateWaveProgress(remaining) {
    if (this.scene.isWaveActive && remaining > 0) {
      this.waveProgress.setText(`剩余: ${remaining}`);
    } else {
      this.waveProgress.setText('准备就绪');
    }
  }

  shutdown() {
    this.scene.input.keyboard.off('keydown-ESC');
    
    if (this.pauseMenu) {
      this.pauseMenu.destroy();
    }
    
    if (this.exitConfirm) {
      this.exitConfirm.destroy();
    }
  }
} 