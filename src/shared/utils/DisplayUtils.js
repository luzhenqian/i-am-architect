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

  // 创建渐变文本
  static createGradientText(scene, x, y, text, config = {}) {
    const {
      fontSize = '20px',
      fontFamily = 'Arial',
      gradient: gradientColors = ['#ff0000', '#ffff00']
    } = config;

    const textObject = scene.add.text(x, y, text, {
      fontSize,
      fontFamily
    });

    const textGradient = textObject.context.createLinearGradient(0, 0, 0, textObject.height);
    textGradient.addColorStop(0, gradientColors[0]);
    textGradient.addColorStop(1, gradientColors[1]);
    textObject.setFill(textGradient);

    return textObject;
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