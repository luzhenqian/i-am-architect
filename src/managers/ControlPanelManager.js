import Phaser from 'phaser';

export class ControlPanelManager {
  constructor(scene) {
    this.scene = scene;
    this.panelHeight = 160;
    this.dragTower = null;
    this.rangePreview = null;
  }

  createControlPanel() {
    const panelHeight = this.panelHeight;
    const spacing = 120;  // 卡片间距
    const cardWidth = 110;  // 卡片宽度
    const totalCards = this.scene.config.towerTypes.length;
    const totalWidth = totalCards * spacing;  // 移到这里，统一使用这个totalWidth
    
    // 创建滚动面板容器
    const scrollPanel = this.scene.add.container(0, this.scene.game.config.height - panelHeight);
    
    // 创建面板背景
    const panelBg = this.scene.add.rectangle(
      0,
      0,
      this.scene.game.config.width,
      panelHeight,
      0x333333,
      0.8
    ).setOrigin(0, 0);
    scrollPanel.add(panelBg);

    // 创建防御塔容器
    const towersContainer = this.scene.add.container(0, 0);
    scrollPanel.add(towersContainer);

    // 创建滚动条背景
    const scrollBarHeight = 4;
    const scrollBarBg = this.scene.add.rectangle(
      0,
      panelHeight - scrollBarHeight - 8,
      this.scene.game.config.width,
      scrollBarHeight,
      0x666666,
      0.6
    ).setOrigin(0, 0);
    scrollPanel.add(scrollBarBg);

    // 创建滚动条
    const scrollBarWidth = (this.scene.game.config.width / totalWidth) * this.scene.game.config.width;
    const scrollBar = this.scene.add.rectangle(
      0,
      panelHeight - scrollBarHeight - 8,
      scrollBarWidth,
      scrollBarHeight,
      0x00ff00,
      0.8
    ).setOrigin(0, 0);
    scrollPanel.add(scrollBar);

    // 定义滚动条位置更新函数
    const updateScrollBar = (x) => {
      const scrollPercent = Math.abs(x) / maxScroll;
      const maxScrollBarX = this.scene.game.config.width - scrollBarWidth;
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
    const maxScroll = Math.max(0, totalWidth - this.scene.game.config.width);

    // 设置面板交互
    panelBg.setInteractive();
    
    panelBg.on('pointerdown', (pointer) => {
      isDragging = true;
      initialPointerX = pointer.x;
      lastPointerX = pointer.x;
      dragStartX = pointer.x - scrollX;
      isDragThresholdMet = false;
    });

    this.scene.input.on('pointermove', (pointer) => {
      if (!isDragging || isTowerDrag) return;

      const deltaX = Math.abs(pointer.x - initialPointerX);

      if (!isDragThresholdMet) {
        if (deltaX > dragThreshold) {
          isDragThresholdMet = true;
        } else {
          return;
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
      
      updateScrollBar(scrollX);
    });

    this.scene.input.on('pointerup', () => {
      isDragging = false;
      isDragThresholdMet = false;
      isTowerDrag = false;
    });

    // 修改防御塔卡片位置计算
    const startX = (this.scene.game.config.width - totalWidth) / 2 + cardWidth / 2;

    this.scene.config.towerTypes.forEach((tower, index) => {
      const x = startX + spacing * index;
      const y = panelHeight / 2;
      
      const towerContainer = this.scene.add.container(x, y);
      towersContainer.add(towerContainer);

      // 塔的卡片背景
      const cardBg = this.scene.add.rectangle(0, 0, 110, 120, 0x333333, 0.8)
        .setStrokeStyle(1, 0x666666)
        .setOrigin(0.5)
        .setInteractive();
      towerContainer.add(cardBg);

      // 塔的图标背景
      const iconBg = this.scene.add.circle(0, -30, 32, 0x444444);
      towerContainer.add(iconBg);

      // 塔的图标
      const towerIcon = this.scene.add.image(0, -30, tower.key)
        .setDisplaySize(50, 50);
      towerContainer.add(towerIcon);

      // 塔的名称
      const nameText = this.scene.add.text(0, 10, tower.name, {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        resolution: 2,
        fontStyle: 'bold'
      }).setOrigin(0.5, 0);
      towerContainer.add(nameText);

      // 金币图标和成本
      const costContainer = this.scene.add.container(0, 35);
      towerContainer.add(costContainer);

      const coinIcon = this.scene.add.circle(-28, 0, 12, 0xffd700);
      costContainer.add(coinIcon);

      const costText = this.scene.add.text(0, 0, tower.cost.toString(), {
        fontSize: '20px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffd700',
        resolution: 2,
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      costContainer.add(costText);

      // 设置拖拽
      cardBg.setInteractive();

      // 添加交互效果
      cardBg.on('pointerover', () => {
        cardBg.setFillStyle(0x444444, 0.8);
      });

      cardBg.on('pointerout', () => {
        cardBg.setFillStyle(0x333333, 0.8);
      });

      // 拖拽开始
      cardBg.on('dragstart', (pointer) => {
        if (isDragThresholdMet) return;

        if (this.scene.gold < tower.cost) {
          this.showInsufficientFundsHint(pointer.x, pointer.y);
          return;
        }

        isTowerDrag = true;
        isDragging = false;
        
        this.dragTower = {
          type: tower.key,
          cost: tower.cost,
          range: tower.range,
          sprite: this.scene.add.image(pointer.x, pointer.y, tower.key)
            .setDisplaySize(this.scene.cellSize * 0.8, this.scene.cellSize * 0.8)
            .setAlpha(0.8)
        };

        this.createRangePreview(pointer.x, pointer.y, tower.range);
      });

      // 拖拽中
      cardBg.on('drag', (pointer) => {
        if (!this.dragTower) return;
        
        this.dragTower.sprite.x = pointer.x;
        this.dragTower.sprite.y = pointer.y;

        const cellCoords = this.screenToGrid(pointer.x, pointer.y);
        
        if (this.isValidGridPosition(cellCoords.row, cellCoords.col)) {
          const centerX = this.scene.grid[cellCoords.row][cellCoords.col].x;
          const centerY = this.scene.grid[cellCoords.row][cellCoords.col].y;
          this.createRangePreview(centerX, centerY, this.dragTower.range);
          this.highlightValidCell(cellCoords.row, cellCoords.col);
        } else {
          this.createRangePreview(pointer.x, pointer.y, this.dragTower.range);
        }
      });

      // 拖拽结束
      cardBg.on('dragend', (pointer) => {
        if (!this.dragTower) return;
        
        const cellCoords = this.screenToGrid(pointer.x, pointer.y);
        if (this.canPlaceTower(cellCoords.row, cellCoords.col)) {
          this.scene.placeTower(cellCoords.row, cellCoords.col, this.dragTower.type);
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

    // 添加滑动惯性
    let velocity = 0;

    this.scene.time.addEvent({
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

  // 辅助方法
  showInsufficientFundsHint(x, y) {
    const text = this.scene.add.text(x, y - 30, '金币不足!', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ff0000',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 },
      resolution: 2
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  createRangePreview(x, y, range) {
    if (this.rangePreview) {
      this.rangePreview.destroy();
    }

    const radius = range * this.scene.cellSize;
    this.rangePreview = this.scene.add.graphics();
    this.rangePreview.lineStyle(2, 0x6a0dad);
    this.rangePreview.fillStyle(0x9370db, 0.3);
    this.rangePreview.beginPath();
    this.rangePreview.arc(x, y, radius, 0, Math.PI * 2);
    this.rangePreview.closePath();
    this.rangePreview.fillPath();
    this.rangePreview.strokePath();
  }

  screenToGrid(x, y) {
    const relativeX = x - this.scene.gridOffset.x;
    const relativeY = y - this.scene.gridOffset.y;
    
    const col = Math.floor(relativeX / this.scene.cellSize);
    const row = Math.floor(relativeY / this.scene.cellSize);
    
    return {
      row: Math.max(0, Math.min(row, this.scene.gridSize.rows - 1)),
      col: Math.max(0, Math.min(col, this.scene.gridSize.cols - 1))
    };
  }

  isValidGridPosition(row, col) {
    return row >= 0 && row < this.scene.gridSize.rows &&
           col >= 0 && col < this.scene.gridSize.cols;
  }

  canPlaceTower(row, col) {
    return this.isValidGridPosition(row, col) &&
           this.scene.grid[row] &&
           this.scene.grid[row][col] &&
           !this.scene.grid[row][col].occupied;
  }

  highlightValidCell(row, col) {
    this.clearHighlight();
    
    if (this.isValidGridPosition(row, col)) {
      if (this.canPlaceTower(row, col)) {
        this.scene.grid[row][col].cell.setStrokeStyle(2, 0x00ff00);
      } else {
        this.scene.grid[row][col].cell.setStrokeStyle(2, 0xff0000);
      }
    }
  }

  clearHighlight() {
    if (!this.scene.grid) return;
    
    for (let row = 0; row < this.scene.gridSize.rows; row++) {
      for (let col = 0; col < this.scene.gridSize.cols; col++) {
        if (this.scene.grid[row] && this.scene.grid[row][col]) {
          this.scene.grid[row][col].cell.setStrokeStyle(1, 0x444444);
        }
      }
    }
  }

  shutdown() {
    if (this.rangePreview) {
      this.rangePreview.destroy();
    }
    if (this.dragTower) {
      this.dragTower.sprite.destroy();
    }
  }
} 