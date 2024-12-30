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
      strokeThickness: 2
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
    const secondRowY = this.topBarHeight * 2 / 3 + scaleToDPR(8);
    const pauseButton = this.scene.add.image(
      this.scene.game.config.width - scaleToDPR(30),
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
      this.scene.game.config.width - scaleToDPR(30),
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


  // 创建塔面板
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

  // 清理资源
  destroy() {
    if (this.scrollPanel) {
      this.scrollPanel.destroy();
    }
    // 清理其他UI元素...
  }
}
