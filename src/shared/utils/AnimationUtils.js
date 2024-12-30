import { scaleToDPR } from './DisplayUtils';

export class AnimationUtils {
  // 创建淡出动画
  static fadeOut(scene, target, duration = 200, destroyOnComplete = true) {
    return scene.tweens.add({
      targets: target,
      alpha: 0,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        if (destroyOnComplete) target.destroy();
      }
    });
  }

  // 创建弹跳动画
  static bounce(scene, target, scale = 1.2, duration = 200) {
    return scene.tweens.add({
      targets: target,
      scaleX: scale,
      scaleY: scale,
      duration: duration,
      yoyo: true,
      ease: 'Quad.out'
    });
  }

  // 创建浮动数字动画
  static createFloatingNumber(scene, x, y, value, config = {}) {
    const {
      color = '#ff0000',
      fontSize = scaleToDPR(20),
      duration = 1000,
      distance = scaleToDPR(50)
    } = config;

    const text = scene.add.text(x, y, value.toString(), {
      fontSize: `${fontSize}px`,
      fontFamily: 'Arial',
      color: color,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    scene.tweens.add({
      targets: text,
      y: y - distance,
      alpha: 0,
      duration: duration,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });

    return text;
  }

  // 创建闪烁动画
  static flash(scene, target, duration = 200, repeat = 3) {
    return scene.tweens.add({
      targets: target,
      alpha: 0,
      duration: duration / 2,
      yoyo: true,
      repeat: repeat,
      ease: 'Linear'
    });
  }

  // 创建移动动画
  static moveTo(scene, target, x, y, duration = 1000, ease = 'Power2') {
    return scene.tweens.add({
      targets: target,
      x: x,
      y: y,
      duration: duration,
      ease: ease
    });
  }
} 