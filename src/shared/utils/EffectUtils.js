import Phaser from 'phaser';
import { scaleToDPR } from './DisplayUtils';

export class EffectUtils {
  // 创建攻击特效
  static createAttackEffect(scene, source, target, color = 0x00ff00) {
    console.log('createAttackEffect', source, target, color);
    const towerType = scene.config.towerConfig.towerTypes.find(t => t.key === source.type);
    switch (towerType.key) {
      case 'code_warrior':
        return EffectUtils.createCodeWarriorAttackEffect(scene, source, target, color);
      case 'ai_sniper':
        return EffectUtils.createAiSniperAttackEffect(scene, source, target, color);
      case 'algo_cannon':
        return EffectUtils.createAlgoCannonAttackEffect(scene, source, target, color);
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
  static createCodeWarriorAttackEffect(scene, tower, monster, color = 0x00ffff) {
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
  static createAlgoCannonAttackEffect(scene, tower, monster, color = 0x333333) {
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
  static createAiSniperAttackEffect(scene, tower, monster, color = 0xff0000) {
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
  static createDefaultAttackEffect(scene, tower, monster, color = 0x00ff00) {
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

    scene.time.delayedCall(300, () => {
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
} 