export class DisplayUtils {
  // 创建血条
  static createHealthBar(scene, x, y, width, height, isMonster = false) {
    const borderWidth = scaleToDPR(2);
    const border = scene.add.rectangle(x, y, width + borderWidth, height + borderWidth, 0x000000, borderWidth);
    border.setOrigin(0.5, 0.5);

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
      border,
      background,
      bar,
      width,
      height,
      isMonster
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

  // 添加创建充能条方法
  static createChargeBar(scene, x, y, width, height, color = 0xffff00) {
    const border = scene.add.rectangle(x, y, width + 4, height + 2, 0x000000, 1)
      .setOrigin(0.5, 0.5);

    const background = scene.add.rectangle(x, y, width, height, 0xffffff, 0.5)
      .setOrigin(0.5, 0.5);

    const bar = scene.add.rectangle(
      x - width / 2,
      y,
      0,
      height,
      color,
      1
    ).setOrigin(0, 0.5);

    // 添加分割线
    const segments = 5; // 分成5段
    const lines = [];
    for (let i = 1; i < segments; i++) {
      const lineX = x - width / 2 + (width / segments * i);
      const line = scene.add.line(
        0, 0,
        lineX, y - height / 2 + 4,  // 上端点
        lineX, y + height / 2 + 8,  // 下端点
        0x000000,
        1
      ).setLineWidth(3);
      lines.push(line);
    }

    return { background, bar, border, width, lines };
  }

  // 更新充能条方法
  static updateChargeBar(chargeBar, progress) {
    const width = chargeBar.width * Math.min(Math.max(progress, 0), 1);
    chargeBar.bar.width = width;
  }
}

// DPR缩放
export function scaleToDPR(value) {
  return value * (window.devicePixelRatio || 1);
}