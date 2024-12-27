export class WaveManager {
  constructor(scene) {
    this.scene = scene;
    this.wave = 0;
    this.isWaveActive = false;
    this.monstersRemaining = 0;
    this.monsterSpawnEvent = null;
    this.waveTimer = null;
    this.countdownText = null;
  }

  startCountdown() {
    let countdown = 3;
    
    // 创建倒计时文本
    this.countdownText = this.scene.add.text(
      this.scene.game.config.width / 2,
      this.scene.game.config.height / 2,
      countdown.toString(),
      {
        fontSize: '64px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        shadow: { blur: 10, color: '#000000', fill: true }
      }
    ).setOrigin(0.5).setDepth(1000);

    // 倒计时动画
    const countdownTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        countdown--;
        if (countdown > 0) {
          this.countdownText.setText(countdown.toString());
          this.countdownText.setScale(1);
          this.scene.tweens.add({
            targets: this.countdownText,
            scale: 0.5,
            duration: 500,
            ease: 'Power2'
          });
        } else {
          this.countdownText.setText('开始!');
          this.scene.tweens.add({
            targets: this.countdownText,
            scale: 2,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
              this.countdownText.destroy();
              this.startWave();
            }
          });
        }
      },
      repeat: 3
    });
  }

  startWave() {
    if (this.isWaveActive) return;
    
    this.wave++;
    this.isWaveActive = true;
    this.scene.uiManager.updateWaveText();
    
    // 计算这一波的怪物数量
    this.monstersRemaining = 5 + Math.floor(this.wave * 1.5);
    this.scene.uiManager.updateWaveProgress(this.monstersRemaining);
    
    // 创建定时生成怪物的事件
    this.monsterSpawnEvent = this.scene.time.addEvent({
      delay: this.scene.config.monsterSpawnInterval,
      callback: this.spawnMonster,
      callbackScope: this,
      repeat: this.monstersRemaining - 1
    });
  }

  spawnMonster() {
    // 随机选择一个怪物类型
    const availableTypes = this.scene.config.monsterTypes.filter(type => type.level <= this.wave);
    const monsterType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    
    // 随机选择一个生成点
    const spawnPoints = [
      { x: this.scene.game.config.width * 0.2, y: -30 },
      { x: this.scene.game.config.width * 0.4, y: -30 },
      { x: this.scene.game.config.width * 0.6, y: -30 },
      { x: this.scene.game.config.width * 0.8, y: -30 }
    ];
    const spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

    // 创建怪物
    const monster = {
      sprite: this.scene.add.circle(spawnPoint.x, spawnPoint.y, 15, 0xff0000),
      health: monsterType.health * (1 + this.wave * 0.1),
      maxHealth: monsterType.health * (1 + this.wave * 0.1),
      speed: monsterType.speed,
      attack: monsterType.attack * (1 + this.wave * 0.05),
      defense: monsterType.defense,
      attackSpeed: monsterType.attackSpeed,
      reward: monsterType.reward,
      type: monsterType.key
    };

    // 创建血条
    const healthBarWidth = 30;
    const healthBarHeight = 4;
    monster.healthBar = {
      background: this.scene.add.rectangle(
        spawnPoint.x,
        spawnPoint.y - 25,
        healthBarWidth,
        healthBarHeight,
        0x000000
      ),
      bar: this.scene.add.rectangle(
        spawnPoint.x - healthBarWidth/2,
        spawnPoint.y - 25,
        healthBarWidth,
        healthBarHeight,
        0x00ff00
      ).setOrigin(0, 0.5),
      width: healthBarWidth
    };

    this.scene.monsterManager.monsters.push(monster);
    this.monstersRemaining--;
    this.scene.uiManager.updateWaveProgress(this.monstersRemaining);

    // 检查是否是这一波的最后一个怪物
    if (this.monstersRemaining <= 0) {
      this.prepareNextWave();
    }
  }

  prepareNextWave() {
    this.isWaveActive = false;
    
    // 等待所有怪物被消灭
    const checkMonsters = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.scene.monsterManager.monsters.length === 0) {
          checkMonsters.destroy();
          this.startNextWave();
        }
      },
      loop: true
    });
  }

  startNextWave() {
    // 给玩家一些准备时间
    this.waveTimer = this.scene.time.delayedCall(3000, () => {
      this.startWave();
    });
  }

  update() {
    // 更新波次状态
    if (this.isWaveActive && this.monstersRemaining <= 0 && 
        this.scene.monsterManager.monsters.length === 0) {
      this.prepareNextWave();
    }
  }

  shutdown() {
    if (this.monsterSpawnEvent) {
      this.monsterSpawnEvent.destroy();
    }
    if (this.waveTimer) {
      this.waveTimer.destroy();
    }
    if (this.countdownText) {
      this.countdownText.destroy();
    }
  }
} 