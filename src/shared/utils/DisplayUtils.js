export class DisplayUtils {
  // 创建血条
  static createHealthBar(scene, x, y, width, height, isMonster = false) {
    const background = scene.add.rectangle(x, y, width, height, 0x000000);
    background.setOrigin(0.5, 0.5);

    const bar = scene.add.rectangle(
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

  // 创建伤害数字
  static createDamageNumber(scene, x, y, amount, color = 0xff0000) {
    const damageText = scene.add.text(x, y - scaleToDPR(20), amount.toString(), {
      fontSize: `${scaleToDPR(20)}px`,
      fontFamily: 'Arial',
      color: `#${color.toString(16)}`,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    scene.tweens.add({
      targets: damageText,
      y: y - scaleToDPR(50),
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => damageText.destroy()
    });
  }

  // 创建暴击伤害数字
  static createCriticalDamageNumber(scene, x, y, amount) {
    const critText = scene.add.text(x, y - scaleToDPR(20), amount.toString(), {
      fontSize: `${scaleToDPR(28)}px`,  // 比普通伤害字体更大
      fontFamily: 'Arial',
      color: '#ff9900',  // 使用橙色来区分暴击
      stroke: '#660000',
      strokeThickness: scaleToDPR(4),
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#ff0000',
        blur: 5,
        fill: true
      }
    }).setOrigin(0.5);

    scene.tweens.add({
      targets: critText,
      y: y - scaleToDPR(70),  // 上升距离更长
      alpha: { from: 1, to: 0 },
      scale: { from: 1.2, to: 1.5 },  // 添加缩放效果
      duration: 1200,
      ease: 'Back.easeOut',
      onComplete: () => critText.destroy()
    });
  }

  // 创建治疗数字
  static createHealNumber(scene, x, y, amount) {
    const healText = scene.add.text(x, y - scaleToDPR(20), `+${amount}`, {
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

    scene.tweens.add({
      targets: healText,
      y: y - scaleToDPR(50),
      alpha: 0,
      scale: { from: 1, to: 1.2 },
      duration: 1000,
      ease: 'Quad.out',
      onComplete: () => healText.destroy()
    });
  }
}

// DPR缩放
export function scaleToDPR(value) {
  return value * (window.devicePixelRatio || 1);
}