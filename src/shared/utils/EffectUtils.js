import Phaser from 'phaser';
import { scaleToDPR } from './DisplayUtils';

export class EffectUtils {
  // 创建攻击特效
  static createAttackEffect(scene, source, target, color = 0x00ff00) {
    const towerType = scene.config.towerConfig.towerTypes.find(t => t.key === source.type);
    switch (towerType.key) {
      case 'code_warrior':
        return EffectUtils.createCodeWarriorAttackEffect(scene, source, target, color);
      case 'ai_sniper':
        return EffectUtils.createAiSniperAttackEffect(scene, source, target, color);
      case 'algo_cannon':
        return EffectUtils.createAlgoCannonAttackEffect(scene, source, target, color);
      case 'syntax_parser':
        return EffectUtils.createSyntaxParserAttackEffect(scene, source, target, color);
      default:
        return EffectUtils.createDefaultAttackEffect(scene, source, target, color);
    }

    const line = scene.add.graphics();
    line.lineStyle(scaleToDPR(2), color, 1);
    line.beginPath();
    line.moveTo(source.x, source.y);
    line.lineTo(target.x, target.y);
    line.strokePath();

    const particles = scene.add.particles(source.x, source.y, 'particle', {
      speed: { min: scaleToDPR(100), max: scaleToDPR(200) },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      lifespan: 300,
      quantity: 1,
      tint: color
    });

    // 自动清理
    scene.time.delayedCall(300, () => {
      line.destroy();
      particles.destroy();
    });

    return { line, particles };
  }

  // 代码战士的攻击效果
  static createCodeWarriorAttackEffect(scene, tower, monster, color = 0x00ffff, onHit) {
    const startPos = { x: tower.sprite.x, y: tower.sprite.y };
    const endPos = { x: monster.sprite.x, y: monster.sprite.y };

    // 创建子弹
    const bullet = scene.add.container(startPos.x, startPos.y);

    // 子弹主体 - 蓝色能量弹
    const bulletBody = scene.add.ellipse(0, 0, scaleToDPR(12), scaleToDPR(6), 0x00ffff);
    bulletBody.setAlpha(0.8);

    // 子弹尾迹
    const bulletTrail = scene.add.ellipse(0, 0, scaleToDPR(16), scaleToDPR(4), 0x0088ff);
    bulletTrail.setAlpha(0.4);

    // 子弹光晕
    const bulletGlow = scene.add.ellipse(0, 0, scaleToDPR(20), scaleToDPR(8), 0x00ffff);
    bulletGlow.setAlpha(0.2);

    bullet.add([bulletGlow, bulletTrail, bulletBody]);

    // 计算角度
    const angle = Phaser.Math.Angle.Between(startPos.x, startPos.y, endPos.x, endPos.y);
    bullet.setRotation(angle);

    // 创建发射闪光
    const muzzleFlash = scene.add.circle(startPos.x, startPos.y, scaleToDPR(10), 0x00ffff, 0.8);

    // 发射粒子效果
    const particles = scene.add.particles(startPos.x, startPos.y, 'particle', {
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
    scene.tweens.add({
      targets: bullet,
      x: endPos.x,
      y: endPos.y,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (onHit) onHit();
        // 创建命中效果
        const impact = scene.add.circle(endPos.x, endPos.y, scaleToDPR(15), 0x00ffff, 0.8);

        // 命中粒子
        const impactParticles = scene.add.particles(endPos.x, endPos.y, 'particle', {
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
        const ring = scene.add.circle(endPos.x, endPos.y, scaleToDPR(10), 0x00ffff, 0);
        ring.setStrokeStyle(scaleToDPR(2), 0x00ffff, 1);

        // 命中效果动画
        scene.tweens.add({
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
    scene.tweens.add({
      targets: muzzleFlash,
      scale: { from: 0.8, to: 1.5 },
      alpha: { from: 0.8, to: 0 },
      duration: 200,
      ease: 'Power2',
      onComplete: () => muzzleFlash.destroy()
    });

    // 子弹尾迹动画
    scene.tweens.add({
      targets: bulletTrail,
      scaleX: { from: 1, to: 1.5 },
      alpha: { from: 0.4, to: 0 },
      duration: 400,
      ease: 'Power2'
    });

    return { bullet, particles };
  }

  // 算法炮台的攻击效果
  static createAlgoCannonAttackEffect(scene, tower, monster, color = 0x333333, onHit) {
    const startPos = { x: tower.sprite.x, y: tower.sprite.y };
    const endPos = { x: monster.sprite.x, y: monster.sprite.y };

    // 创椭圆形炮弹
    const shell = scene.add.ellipse(startPos.x, startPos.y, scaleToDPR(12), scaleToDPR(8), 0x333333);
    shell.setStrokeStyle(scaleToDPR(1), 0x666666);

    // 直线弹动
    scene.tweens.add({
      targets: shell,
      x: endPos.x,
      y: endPos.y,
      duration: 400,
      ease: 'Linear',
      onComplete: () => {
        if (onHit) onHit();
        shell.destroy();

        // 创建爆炸中心闪光
        const flash = scene.add.circle(endPos.x, endPos.y, scaleToDPR(30), 0xffaa00, 1);

        // 创建爆炸波纹
        const rings = [];
        for (let i = 0; i < 3; i++) {
          const ring = scene.add.circle(endPos.x, endPos.y, scaleToDPR(20), 0x666666, 0.6);
          rings.push(ring);

          scene.tweens.add({
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
        const mushroomCloud = scene.add.particles(endPos.x, endPos.y, 'particle', {
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
        const sparks = scene.add.particles(endPos.x, endPos.y, 'particle', {
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
        const shockwave = scene.add.particles(endPos.x, endPos.y, 'particle', {
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
        scene.tweens.add({
          targets: flash,
          scale: { from: 0.5, to: 2 },
          alpha: { from: 1, to: 0 },
          duration: 300,
          ease: 'Power2',
          onComplete: () => flash.destroy()
        });

        // 清理所有效果
        scene.time.delayedCall(1000, () => {
          mushroomCloud.destroy();
          sparks.destroy();
          shockwave.destroy();
        });
      }
    });

    return { shell };
  }

  // AI狙击手的攻击效果
  static createAiSniperAttackEffect(scene, tower, monster, color = 0xff0000, onHit) {
    // 1. 创建瞄准线效果 - 使用虚线
    const aimLine = scene.add.graphics();
    aimLine.lineStyle(scaleToDPR(1), 0xff0000, 0.3, 1); // 最后一个参数是虚线
    aimLine.beginPath();
    aimLine.moveTo(tower.sprite.x, tower.sprite.y);
    aimLine.lineTo(monster.sprite.x, monster.sprite.y);
    aimLine.strokePath();

    // 2. 创建十字准星效果
    const crosshair = scene.add.container(monster.sprite.x, monster.sprite.y);
    const crosshairSize = scaleToDPR(16);
    const lineLength = scaleToDPR(6);

    const crosshairGraphics = scene.add.graphics();
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
    const bullet = scene.add.container(tower.sprite.x, tower.sprite.y);
    const bulletCore = scene.add.rectangle(0, 0, scaleToDPR(8), scaleToDPR(3), 0xffff00);
    const bulletTrail = scene.add.rectangle(scaleToDPR(-6), 0, scaleToDPR(12), scaleToDPR(1), 0xff8800);
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
    const muzzleFlash = scene.add.sprite(tower.sprite.x, tower.sprite.y, 'particle')
      .setScale(0.8)
      .setTint(0xffff00)
      .setAlpha(0.8);

    // 5. 子弹飞行动画
    scene.tweens.add({
      targets: bullet,
      x: monster.sprite.x,
      y: monster.sprite.y,
      duration: 100, // 更快的子弹速度
      ease: 'Linear',
      onComplete: () => {
        // 触发命中回调
        if (onHit) onHit();

        // 创建击中效果
        const impact = scene.add.circle(monster.sprite.x, monster.sprite.y, scaleToDPR(5), 0xffffff, 1);

        // 创建击中粒子效果
        const impactParticles = scene.add.particles(monster.sprite.x, monster.sprite.y, 'particle', {
          speed: { min: scaleToDPR(100), max: scaleToDPR(200) },
          scale: { start: 0.4, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 200,
          quantity: 6,
          angle: { min: 0, max: 360 },
          tint: [0xffff00, 0xff8800]
        });

        // 击中效果动画
        scene.tweens.add({
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
    scene.tweens.add({
      targets: muzzleFlash,
      scale: { from: 1.2, to: 0.2 },
      alpha: { from: 1, to: 0 },
      duration: 100,
      onComplete: () => muzzleFlash.destroy()
    });

    // 7. 准星动画
    scene.tweens.add({
      targets: crosshair,
      scale: { from: 1.5, to: 1 },
      alpha: { from: 0.2, to: 1 },
      duration: 200
    });

    // 清理定时器
    scene.time.delayedCall(300, () => {
      aimLine.destroy();
      crosshair.destroy();
    });

    return {
      aimLine,
      crosshair,
      bullet,
      muzzleFlash
    };
  }

  // 默认攻击效果
  static createDefaultAttackEffect(scene, tower, monster, color = 0x00ff00, onHit) {
    // 其他防御塔的默认效果
    const line = scene.add.graphics();
    line.lineStyle(scaleToDPR(2), color, 1);
    line.beginPath();
    line.moveTo(tower.sprite.x, tower.sprite.y);
    line.lineTo(monster.sprite.x, monster.sprite.y);
    line.strokePath();

    const startPoint = scene.add.circle(tower.sprite.x, tower.sprite.y, scaleToDPR(5), color, 1);
    const endPoint = scene.add.circle(monster.sprite.x, monster.sprite.y, scaleToDPR(5), color, 1);

    const particles = scene.add.particles(tower.sprite.x, tower.sprite.y, 'particle', {
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

    // 在特效完成时调用回调
    scene.time.delayedCall(300, () => {
      if (onHit) onHit();
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

  // 创建治疗特效
  static createHealEffect(scene, source, target, healColor = 0x00ff88) {
    const healParticles = scene.add.particles(target.x, target.y, 'particle', {
      speed: { min: scaleToDPR(50), max: scaleToDPR(100) },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: healColor,
      blendMode: 'ADD',
      lifespan: 500,
      quantity: 5
    });

    scene.time.delayedCall(500, () => healParticles.destroy());
    return healParticles;
  }

  // 创建爆炸特效
  static createExplosionEffect(scene, x, y, config = {}) {
    const {
      radius = scaleToDPR(30),
      particleCount = 20,
      duration = 500,
      colors = [0xff9900, 0xff6600, 0xff3300]
    } = config;

    const explosion = scene.add.particles(x, y, 'particle', {
      speed: { min: scaleToDPR(100), max: scaleToDPR(200) },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: duration,
      quantity: particleCount,
      tint: colors
    });

    scene.time.delayedCall(duration, () => explosion.destroy());
    return explosion;
  }

  // 创建金币生成特效
  static createGoldGenerationEffect(scene, source, amount) {
    const startX = source.sprite.x;
    const startY = source.sprite.y - scaleToDPR(30);

    // 创建金币容器
    const coinContainer = scene.add.container(startX, startY);

    // 创建金币背景光晕
    const glow = scene.add.circle(0, 0, scaleToDPR(15), 0xffd700, 0.3);

    // 创建金币主体
    const coinBody = scene.add.circle(0, 0, scaleToDPR(12), 0xffd700);
    const coinInner = scene.add.circle(0, 0, scaleToDPR(10), 0xffed4a);

    // 创建比特币符号
    const btcSymbol = scene.add.text(0, 0, '₿', {
      fontSize: `${scaleToDPR(14)}px`,
      fontFamily: 'Arial',
      color: '#996515'
    }).setOrigin(0.5);

    // 创建金额文本
    const amountText = scene.add.text(scaleToDPR(20), 0, `+${amount}`, {
      fontSize: `${scaleToDPR(16)}px`,
      fontFamily: 'Arial',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: scaleToDPR(3)
    }).setOrigin(0, 0.5);

    // 添加所有元素到容器
    coinContainer.add([glow, coinBody, coinInner, btcSymbol, amountText]);

    // 创建金币闪光粒子
    const sparkles = scene.add.particles(startX, startY, 'particle', {
      speed: { min: scaleToDPR(30), max: scaleToDPR(60) },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: [0xffd700, 0xffed4a, 0xffffff],
      blendMode: 'ADD',
      lifespan: 800,
      quantity: 2,
      frequency: 100,
      angle: { min: 0, max: 360 }
    });

    // 创建上升的小金币粒子
    const risingCoins = scene.add.particles(startX, startY, 'particle', {
      speed: { min: scaleToDPR(40), max: scaleToDPR(80) },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: 0xffd700,
      blendMode: 'ADD',
      lifespan: 1000,
      quantity: 1,
      frequency: 200,
      angle: { min: -30, max: 30 },
      gravityY: scaleToDPR(-50)
    });

    // 金币脉冲动画
    scene.tweens.add({
      targets: [coinBody, coinInner],
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut'
    });

    // 光晕呼吸动画
    scene.tweens.add({
      targets: glow,
      alpha: 0.6,
      scale: 1.3,
      duration: 500,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut'
    });

    // 整体上升并淡出动画
    scene.tweens.add({
      targets: coinContainer,
      y: startY - scaleToDPR(30),
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        coinContainer.destroy();
        sparkles.destroy();
        risingCoins.destroy();
      }
    });

    // 创建波纹效果
    const ripple = scene.add.circle(startX, startY, scaleToDPR(20), 0xffd700, 0.3);
    scene.tweens.add({
      targets: ripple,
      scale: 2,
      alpha: 0,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => ripple.destroy()
    });

    return {
      container: coinContainer,
      sparkles,
      risingCoins,
      ripple
    };
  }

  // 创建语法解析器的攻击效果
  static createSyntaxParserAttackEffect(scene, tower, monster, color = 0x4B0082, onHit) {
    const startPos = { x: tower.sprite.x, y: tower.sprite.y };
    const endPos = { x: monster.sprite.x, y: monster.sprite.y };

    // 随机选择一个语法符号
    const syntaxSymbols = ['{}', '()', ';', '//', '='];
    const symbol = syntaxSymbols[Math.floor(Math.random() * syntaxSymbols.length)];

    // 创建语法符号容器
    const symbolContainer = scene.add.container(startPos.x, startPos.y);

    // 创建符号文本
    const symbolText = scene.add.text(0, 0, symbol, {
      fontSize: `${scaleToDPR(24)}px`,
      fontFamily: 'Consolas, monospace',
      color: '#4B0082',
      stroke: '#ffffff',
      strokeThickness: scaleToDPR(2)
    }).setOrigin(0.5);

    // 添加发光效果
    const glow = scene.add.rectangle(0, 0,
      symbolText.width + scaleToDPR(10),
      symbolText.height + scaleToDPR(10),
      0x4B0082, 0.3);

    symbolContainer.add([glow, symbolText]);

    // 计算角度
    const angle = Phaser.Math.Angle.Between(startPos.x, startPos.y, endPos.x, endPos.y);
    symbolContainer.setRotation(angle);

    // 创建语法轨迹粒子
    const particles = scene.add.particles(startPos.x, startPos.y, 'particle', {
      speed: { min: scaleToDPR(50), max: scaleToDPR(100) },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: 0x4B0082,
      blendMode: 'ADD',
      lifespan: 400,
      quantity: 2,
      angle: {
        min: Phaser.Math.RadToDeg(angle) - 15,
        max: Phaser.Math.RadToDeg(angle) + 15
      }
    });

    // 符号飞行动画
    scene.tweens.add({
      targets: symbolContainer,
      x: endPos.x,
      y: endPos.y,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (onHit) onHit();

        // 创建命中效果
        let impactEffect;
        switch (symbol) {
          case '{}':
            // 代码块包围效果
            impactEffect = scene.add.circle(endPos.x, endPos.y, scaleToDPR(30), 0x4B0082, 0.3);
            scene.tweens.add({
              targets: impactEffect,
              scale: 1.5,
              alpha: 0,
              duration: 400,
              ease: 'Power2'
            });
            break;

          case '()':
            // 捕获效果 - 创建收缩圈
            impactEffect = scene.add.circle(endPos.x, endPos.y, scaleToDPR(40), 0x4B0082, 0);
            impactEffect.setStrokeStyle(scaleToDPR(2), 0x4B0082);
            scene.tweens.add({
              targets: impactEffect,
              scale: 0.2,
              alpha: 1,
              duration: 300,
              ease: 'Power2'
            });
            break;

          case ';':
            // 终止效果 - 十字闪光
            impactEffect = scene.add.container(endPos.x, endPos.y);
            const line1 = scene.add.rectangle(0, 0, scaleToDPR(40), scaleToDPR(4), 0x4B0082);
            const line2 = scene.add.rectangle(0, 0, scaleToDPR(4), scaleToDPR(40), 0x4B0082);
            impactEffect.add([line1, line2]);
            scene.tweens.add({
              targets: impactEffect,
              scale: 1.5,
              alpha: 0,
              duration: 300,
              ease: 'Power2'
            });
            break;

          case '//':
            // 注释效果 - 波浪线
            impactEffect = scene.add.graphics();
            impactEffect.lineStyle(scaleToDPR(2), 0x4B0082, 1);
            const wavePoints = [];
            for (let i = 0; i <= 10; i++) {
              wavePoints.push({
                x: endPos.x - scaleToDPR(20) + i * scaleToDPR(4),
                y: endPos.y + Math.sin(i * 0.5) * scaleToDPR(5)
              });
            }
            impactEffect.strokePoints(wavePoints);
            scene.tweens.add({
              targets: impactEffect,
              alpha: 0,
              duration: 400
            });
            break;

          case '=':
            // 赋值效果 - 扩散环
            impactEffect = [];
            for (let i = 0; i < 2; i++) {
              const ring = scene.add.circle(endPos.x, endPos.y, scaleToDPR(15 + i * 10), 0x4B0082, 0.5);
              impactEffect.push(ring);
              scene.tweens.add({
                targets: ring,
                scale: 2,
                alpha: 0,
                duration: 400,
                delay: i * 100,
                ease: 'Power2'
              });
            }
            break;
        }

        // 清理效果
        scene.time.delayedCall(500, () => {
          if (Array.isArray(impactEffect)) {
            impactEffect.forEach(effect => effect.destroy());
          } else if (impactEffect) {
            impactEffect.destroy();
          }
        });

        // 清理符号和粒子
        symbolContainer.destroy();
        particles.destroy();
      }
    });

    return { symbolContainer, particles };
  }

  // 添加传送效果
  static createPortalEffect(scene, portal, monster) {
    // 创建闪光效果
    const flash = scene.add.circle(portal.x, portal.y, scene.cellSize * 0.6, 0x4444ff, 0.8);

    // 创建能量环效果
    const ring = scene.add.circle(portal.x, portal.y, scene.cellSize * 0.4);
    ring.setStrokeStyle(scaleToDPR(2), 0x4444ff);

    // 添加动画效果
    scene.tweens.add({
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

    // 保存原始缩放值
    const targetScale = monster.sprite.scale;

    // 怪物出现动画
    monster.sprite.setScale(0);
    monster.sprite.setAlpha(0);

    scene.tweens.add({
      targets: monster.sprite,
      scale: { from: 0, to: targetScale }, // 使用原始缩放值
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  // 创建爆炸效果
  static createExplosionEffect(scene, x, y, color) {
    // 创建闪光
    const flash = scene.add.circle(x, y, scene.cellSize * 0.8, color, 0.8);

    // 创建文字碎片效果
    const fragments = [];
    const fragmentCount = 8;
    const fragmentText = ['{ ', ' }', '< ', ' >', '/ ', ' /', '[ ', ' ]'];

    for (let i = 0; i < fragmentCount; i++) {
      const angle = (i / fragmentCount) * Math.PI * 2;
      const distance = scene.cellSize * 0.8;
      const fragmentX = x + Math.cos(angle) * distance;
      const fragmentY = y + Math.sin(angle) * distance;

      const fragment = scene.add.text(x, y, fragmentText[i], {
        fontSize: `${scaleToDPR(16)}px`,
        fontFamily: 'Courier',
        color: '#ffffff'
      }).setOrigin(0.5);

      fragments.push(fragment);

      scene.tweens.add({
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
    scene.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    });

    // 创建粒子爆炸效果
    const particles = scene.add.particles(x, y, 'particle', {
      speed: { min: scaleToDPR(100), max: scaleToDPR(200) },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      blendMode: 'ADD',
      lifespan: 800,
      quantity: 20,
      tint: [color, 0xffffff]
    });

    scene.time.delayedCall(800, () => {
      particles.destroy();
    });
  }

  // 创建最终爆炸效果
  static createFinalExplosionEffect(scene, callback) {
    const centerX = scene.game.config.width / 2;
    const centerY = scene.game.config.height / 2;

    // 创建中心爆炸闪光
    const flash = scene.add.circle(centerX, centerY, 10, 0xffffff, 1);

    // 创建多层扩散波
    const waves = [];
    const colors = [0xff8844, 0xff4444, 0xffaa44];

    // 扩散波动画
    scene.tweens.add({
      targets: flash,
      scale: { from: 1, to: 50 },
      alpha: { from: 1, to: 0 },
      duration: 1000,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    });

    // 创建三层扩散波
    for (let i = 0; i < 3; i++) {
      const wave = scene.add.circle(centerX, centerY, 10, colors[i], 0.8);
      waves.push(wave);

      scene.tweens.add({
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
      const text = scene.add.text(centerX, centerY,
        Phaser.Utils.Array.GetRandom(fragments), {
        fontSize: `${scaleToDPR(20)}px`,
        fontFamily: 'Courier',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      scene.tweens.add({
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
    scene.cameras.main.shake(1000, 0.01);

    // 延迟调用回调函数
    scene.time.delayedCall(1500, callback);
  }

  // 播放升级特效
  static playLevelUpEffect(scene, uiManager) {
    // 创建升级文本
    const levelUpText = scene.add.text(
      uiManager.levelText.x,
      uiManager.levelText.y,
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
    const glow = scene.add.circle(
      uiManager.levelText.x,
      uiManager.levelText.y,
      scaleToDPR(40),
      0xffff44,
      0.5
    );

    // 创建粒子效果
    const particles = scene.add.particles(
      uiManager.levelText.x,
      uiManager.levelText.y,
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
    scene.tweens.add({
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

  // 添加新的特效方法
  static createPortalTransitionEffect(scene, onComplete) {
    const centerX = scene.game.config.width / 2;
    const centerY = scene.game.config.height / 2;

    // 创建传送门容器
    const portalContainer = scene.add.container(centerX, centerY).setDepth(9999);

    // 创建黑色遮罩背景
    const overlay = scene.add.rectangle(
      -scene.game.config.width/2,
      -scene.game.config.height/2,
      scene.game.config.width,
      scene.game.config.height,
      0x1e1e1e, 0
    );
    portalContainer.add(overlay);

    // 创建外圈二进制数字 - 减少数量，增加间距
    const binaryRing = [];
    const particleCount = 24; // 从48减少到24
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 220; // 增加半径
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      const digit = Math.random() > 0.5 ? '1' : '0';
      const particle = scene.add.text(x, y, digit, {
        fontSize: `${scaleToDPR(18)}px`, // 增大字体
        fontFamily: 'Consolas',
        color: '#9cdcfe',
        stroke: '#1e1e1e',
        strokeThickness: 2
      }).setOrigin(0.5).setAlpha(0);
      
      binaryRing.push(particle);
      portalContainer.add(particle);
    }

    // 创建内圈二进制数字 - 减少数量，增加间距
    const innerBinaryRing = [];
    const innerParticleCount = 16; // 从32减少到16
    for (let i = 0; i < innerParticleCount; i++) {
      const angle = (i / innerParticleCount) * Math.PI * 2;
      const radius = 160; // 调整半径
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      const digit = Math.random() > 0.5 ? '1' : '0';
      const particle = scene.add.text(x, y, digit, {
        fontSize: `${scaleToDPR(16)}px`, // 增大字体
        fontFamily: 'Consolas',
        color: '#4fc1ff',
        stroke: '#1e1e1e',
        strokeThickness: 2
      }).setOrigin(0.5).setAlpha(0);
      
      innerBinaryRing.push(particle);
      portalContainer.add(particle);
    }

    // 动画序列
    // 1. 逐个点亮外圈数字
    binaryRing.forEach((particle, index) => {
      scene.tweens.add({
        targets: particle,
        alpha: 0.9,
        duration: 40, // 稍微放慢点亮速度
        delay: index * 40,
        ease: 'Power1'
      });
    });

    // 2. 逐个点亮内圈数字
    innerBinaryRing.forEach((particle, index) => {
      scene.tweens.add({
        targets: particle,
        alpha: 0.9,
        duration: 40,
        delay: binaryRing.length * 40 + index * 40,
        ease: 'Power1'
      });
    });

    // 3. 全部点亮后的效果
    scene.time.delayedCall(
      (binaryRing.length + innerBinaryRing.length) * 40 + 300,
      () => {
        scene.cameras.main.flash(800, 30, 30, 30);
        
        scene.tweens.add({
          targets: overlay,
          alpha: 1,
          duration: 800,
          ease: 'Power2',
          onComplete: () => {
            portalContainer.destroy();
            if (onComplete) onComplete();
          }
        });
      }
    );

    // 添加轻微的相机震动
    scene.cameras.main.shake(300, 0.001);
  }
} 
