import Phaser from 'phaser';
import { DisplayUtils, scaleToDPR } from '../../shared/utils/DisplayUtils';
import { SoundUtils } from '../../shared/utils/SoundUtils';
import { EffectUtils } from '../../shared/utils/EffectUtils';

export class TowerManager {
  constructor(scene) {
    this.scene = scene;
    this.towers = [];
  }

  // 放置防御塔
  place(row, col, towerType) {
    if (!this.canPlace(row, col)) return;

    const tower = this.scene.config.towerConfig.towerTypes.find(t => t.key === towerType);
    if (!tower || this.scene.gold < tower.cost) return;

    // 扣除金币
    this.scene.updateGold(this.scene.gold - tower.cost);

    // 标记格子为已占用
    this.scene.grid[row][col].occupied = true;

    const x = this.scene.grid[row][col].x;
    const y = this.scene.grid[row][col].y;

    // 创建防御塔
    const towerSprite = this.scene.add.image(x, y, towerType)
      .setDisplaySize(this.scene.cellSize * 0.8, this.scene.cellSize * 0.8)
      .setInteractive({ draggable: true }); // 设置为可交互和可拖拽

    // 创建血条
    const healthBar = DisplayUtils.createHealthBar(
      this.scene,
      x,
      y - this.scene.cellSize / 2,
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
    const towerConfig = this.scene.config.towerConfig.towerTypes.find(t => t.key === towerType);
    newTower.attackInterval = Math.floor(1000 / towerConfig.attackSpeed);

    this.towers.push(newTower);

    // 设置拖拽事件
    towerSprite.on('dragstart', () => {
      console.log('Tower drag started');
      this.scene.deleteZone.setVisible(true);
      this.scene.scrollPanel.setVisible(false);
      towerSprite.originalPosition = { x: towerSprite.x, y: towerSprite.y };

      // 暂停游戏但保持UI交互
      // 设置拖拽标志
      this.isDragging = true;

      // 暂停所有特殊防御塔的定时器
      this.towers.forEach(tower => {
        if (tower.healingEvent) {
          tower.healingEvent.paused = true;
        }
        if (tower.goldGenerationEvent) {
          tower.goldGenerationEvent.paused = true;
        }
      });

      // 清除可能存在的旧预览
      if (this.rangePreview) {
        this.rangePreview.destroy();
      }

      // 只为有攻击范围的防御塔显示范围预览
      if (!['blockchain_node', 'firewall'].includes(towerType)) {
        this.rangePreview = this.scene.add.graphics();
        this.scene.updateRangePreview(towerSprite.x, towerSprite.y, newTower.range);
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
        this.scene.updateRangePreview(dragX, dragY, newTower.range);
      }
    });

    towerSprite.on('dragend', (pointer) => {
      console.log('Tower drag ended');
      const panelHeight = scaleToDPR(120);

      // 清除拖拽标志
      this.isDragging = false;

      // 恢复所有特殊防御塔的定时器
      this.towers.forEach(tower => {
        if (tower.healingEvent) {
          tower.healingEvent.paused = false;
        }
        if (tower.goldGenerationEvent) {
          tower.goldGenerationEvent.paused = false;
        }
      });

      // 继续游戏
      this.scene.resume('GameScene');

      // 恢复正常深度
      towerSprite.setDepth(0);
      this.scene.deleteZone.setDepth(0);
      if (newTower.healthBar) {
        newTower.healthBar.background.setDepth(0);
        newTower.healthBar.bar.setDepth(0);
      }

      // 清除攻击范围预览
      if (this.scene.rangePreview) {
        this.scene.rangePreview.destroy();
        this.scene.rangePreview = null;
      }

      if (pointer.y > this.scene.game.config.height - panelHeight) {
        // 播放删除动画
        this.scene.tweens.add({
          targets: [towerSprite, newTower.healthBar.background, newTower.healthBar.bar],
          alpha: 0,
          scale: 0.5,
          duration: 200,
          onComplete: () => {
            // 清除网格占用状态
            this.scene.grid[row][col].occupied = false;

            // 恢复格子的原始颜色和边框
            const cell = this.scene.grid[row][col].cell;
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
            this.scene.updateGold(this.scene.gold + refund);
            this.scene.showRefundText(pointer.x, pointer.y, refund);
          }
        });
      } else {
        // 返回原位
        towerSprite.x = towerSprite.originalPosition.x;
        towerSprite.y = towerSprite.originalPosition.y;
        this.updateTowerHealthBarPosition(newTower);
      }

      // 隐藏删除区域
      this.scene.deleteZone.setVisible(false);
      // 显示原始面板
      this.scene.scrollPanel.setVisible(true);
    });

    // 确保拖拽插件已启用
    if (!this.scene.input.draggable) {
      this.scene.input.dragDistanceThreshold = 0;
      this.scene.input.setDraggable(towerSprite);
    }

    if (towerType === 'blockchain_node') {
      // 为区块链节点设置金币生成定时器
      const goldGenerationEvent = this.scene.time.addEvent({
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
      const healingEvent = this.scene.time.addEvent({
        delay: Math.floor(1000 / tower.attackSpeed), // 根据攻击速度设置间隔
        callback: () => {
          this.healNear(newTower);
        },
        loop: true
      });

      // 将定时器引用存储在塔的属性中，以便后续清理
      newTower.healingEvent = healingEvent;
    }

    return newTower;
  }

  // 检查是否可以放置防御塔
  canPlace(row, col) {
    return row >= 0 && row < this.scene.gridSize.rows &&
      col >= 0 && col < this.scene.gridSize.cols &&
      this.scene.grid[row] &&
      this.scene.grid[row][col] &&
      !this.scene.grid[row][col].occupied;  // 检查格子是否已被占用
  }

  // 创建对话气泡
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
      "函数一飞，代码全稀碎！",
      "996，头顶光光，代码忙忙",
      "加班累成狗，发量已远走",
      "代码写得妙，加班没烦恼，可惜头发掉",
      "都说程序员好，天天加班累成草",
      "996的苦，秃了头来没法补",
      "代码敲得欢，加班心发蔫",
      "加班累成狗，头发掉成帚",
      "头顶秃秃，代码咕咕，996真苦",
      "程序员的日常，加班累断肠",
      "代码写得勤，加班泪满襟",
      "加班加成狗，头发掉成篓",
      "996的生活，秃了头还得接着过"
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
      const bubbleText = this.scene.add.text(0, 0, text, {
        fontSize: `${scaleToDPR(12)}px`,
        fontFamily: 'Arial',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: maxWidth }
      });

      // 计算气泡大小
      const bounds = bubbleText.getBounds();
      const bubbleBg = this.scene.add.graphics();
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
      const container = this.scene.add.container(0, 0, [bubbleBg, bubbleText]);
      container.setDepth(1000);

      // 添加出现动画
      container.setScale(0);
      container.setAlpha(0);

      this.scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        duration: 200,
        ease: 'Back.out',
        onComplete: () => {
          // 等待一段时间后消失
          this.scene.time.delayedCall(3000, () => {
            this.scene.tweens.add({
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
    this.scene.time.delayedCall(initialDelay, () => {
      showDialogue();

      // 设置随机间隔显示对话
      tower.dialogueTimer = this.scene.time.addEvent({
        delay: Phaser.Math.Between(8000, 15000),
        callback: showDialogue,
        loop: true
      });
    });
  }

  // 攻击怪物
  attackMonster(tower, monster) {
    if (!tower || !monster || monster.isDying) return;

    const towerType = this.scene.config.towerConfig.towerTypes.find(t => t.key === tower.type);

    // 检查是否是不应该攻击的防御塔类型
    if (['debug_fairy', 'blockchain_node', 'firewall'].includes(towerType.key)) {
      return false;
    }

    // 播放攻击音效
    SoundUtils.playSound(this.scene, `${tower.type}_attack`);

    // 清理旧特效
    if (tower.currentEffect) {
      this.clearTowerEffects(tower);
    }

    // 创建攻击特效
    EffectUtils.createAttackEffect(this.scene, tower, monster, tower.attackColor || 0x00ff00);

    // 根据防御塔类型处理不同的攻击逻辑
    switch (towerType.key) {
      case 'algo_cannon':
        // 算法炮台的范围伤害
        const aoeRadius = this.scene.cellSize * 1.5;

        // 找出范围内的所有怪物
        this.scene.monsterManager.monsters.forEach(targetMonster => {
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

            this.scene.damageMonster(targetMonster, damage);
            DisplayUtils.createDamageNumber(this.scene, targetMonster.sprite.x, targetMonster.sprite.y, damage, 0xff4400);
          }
        });

        this.showAOEIndicator(monster.sprite.x, monster.sprite.y, aoeRadius);
        return true;

      default:
        // 其他防御塔的单体伤害
        const defaultBaseDamage = tower.attack || towerType.attack || 10;
        const defaultMonsterDefense = monster.defense || 0;
        const defaultDamage = Math.max(1, Math.floor(defaultBaseDamage - defaultMonsterDefense));

        return this.scene.damageMonster(monster, defaultDamage);
    }
  }

  // 添加查找目标的函数
  findTarget(tower) {
    const towerType = this.scene.config.towerConfig.towerTypes.find(t => t.key === tower.type);
    const range = towerType.range * this.scene.cellSize;
    let nearestMonster = null;
    let shortestDistance = Infinity;

    // 遍历所有怪物
    this.scene.monsterManager.monsters.forEach(monster => {
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

  // 新防御塔血条位置
  updateTowerHealthBarPosition(tower) {
    if (tower.healthBar) {
      tower.healthBar.background.x = tower.sprite.x;
      tower.healthBar.background.y = tower.sprite.y - this.cellSize / 2;
      tower.healthBar.bar.x = tower.sprite.x - tower.healthBar.background.width / 2;
      tower.healthBar.bar.y = tower.sprite.y - this.scene.cellSize / 2;
    }
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

  // 添加调试精灵的治疗功能
  healNear(sourceTower) {
    const healRadius = sourceTower.range * this.scene.cellSize;
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
      this.scene.updateHealthBar(targetTower.healthBar, healthPercentage);

      // 显示治疗数字
      this.scene.showHealNumber(targetTower.sprite.x, targetTower.sprite.y, healing);

      // 播放治疗音效
      SoundUtils.playSound(this.scene, 'debug_fairy_attack');

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
    const line = this.scene.add.graphics();

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
    const sourceGlow = this.scene.add.circle(
      sourceTower.sprite.x,
      sourceTower.sprite.y,
      scaleToDPR(15),
      healColor,
      0.5
    );

    // 创建目标点光环
    const targetGlow = this.scene.add.circle(
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

    const particles = this.scene.add.particles(sourceTower.sprite.x, sourceTower.sprite.y, 'particle', {
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
    const healRing = this.scene.add.graphics();
    const initialRadius = scaleToDPR(10);
    const targetRadius = scaleToDPR(30);

    // 创建扩散动画
    let progress = 0;
    const expandRing = this.scene.time.addEvent({
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
    this.scene.tweens.add({
      targets: targetGlow,
      scale: 1.5,
      alpha: 0,
      duration: 600,
      ease: 'Quad.out'
    });

    // 源点光晕效果
    this.scene.tweens.add({
      targets: sourceGlow,
      scale: 1.3,
      alpha: 0,
      duration: 400,
      ease: 'Quad.out'
    });

    // 束渐隐效果
    this.scene.tweens.add({
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
    const healSymbol = this.scene.add.text(
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
    this.scene.tweens.add({
      targets: healSymbol,
      y: targetTower.sprite.y - scaleToDPR(30),
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      ease: 'Quad.out',
      onComplete: () => healSymbol.destroy()
    });
  }

  // 添加产生金币的功能
  generateGold(tower, amount) {
    // 创建金币图标位置（在防御塔稍微上方）
    const coinX = tower.sprite.x;
    const coinY = tower.sprite.y - scaleToDPR(30);

    // 创建金币图标
    const coinIcon = this.scene.add.circle(
      coinX,
      coinY,
      scaleToDPR(12),
      0xffd700
    );

    // 创建金币符号
    const coinSymbol = this.scene.add.text(
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
    const amountText = this.scene.add.text(
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
    const particles = this.scene.add.particles(coinX, coinY, 'particle', {
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
    this.scene.tweens.add({
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
    this.scene.updateGold(this.scene.gold + amount);

    this.scene.tweens.add({
      targets: this.scene.goldText,
      scale: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Quad.out',
      onComplete: () => {
        this.scene.goldText.setScale(1);
      }
    });

    // 添加闪光效果
    const flash = this.scene.add.circle(
      tower.sprite.x,
      tower.sprite.y,
      scaleToDPR(25),
      0xffd700,
      0.3
    );

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.2,
      duration: 500,
      onComplete: () => flash.destroy()
    });
  }

  // 添加范围指示器显示方法
  showAOEIndicator(x, y, radius) {
    const indicator = this.scene.add.circle(x, y, radius, 0xff0000, 0.2);

    this.scene.tweens.add({
      targets: indicator,
      alpha: 0,
      scale: 1.2,
      duration: 500,
      ease: 'Power2',
      onComplete: () => indicator.destroy()
    });
  }

  // 摧毁防御塔
  destroy(tower) {
    if (tower.isDestroying) {
      return;
    }
    tower.isDestroying = true;
    // 播放防御塔摧毁音效
    SoundUtils.playSound(this.scene, `${tower.type}_die`);

    // 如果代码精灵，清理治疗定时器
    if (tower.type === 'debug_fairy' && tower.healingEvent) {
      tower.healingEvent.destroy();
    }
    // 如果是区块链节点，清理金币生成定时器
    if (tower.type === 'blockchain_node' && tower.goldGenerationEvent) {
      tower.goldGenerationEvent.destroy();
    }

    // 创建爆炸效果
    const explosion = this.scene.add.particles(0, 0, 'particle', {
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
    this.scene.tweens.add({
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
        this.scene.grid[tower.row][tower.col].occupied = false;
      }
    });

    // 血条淡出
    this.scene.tweens.add({
      targets: [tower.healthBar.background, tower.healthBar.bar],
      alpha: 0,
      duration: 500
    });
  }

  update(time, delta) {
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
}
