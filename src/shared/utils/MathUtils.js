export class MathUtils {
  // 计算两点间距离
  static getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  // 计算角度
  static getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  // 计算伤害值(考虑防御)
  static calculateDamage(attack, defense) {
    return Math.max(1, Math.floor(attack - defense));
  }

  // 随机范围值
  static getRandomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // 计算暴击伤害
  static calculateCriticalDamage(baseDamage, criticalMultiplier = 2) {
    return Math.floor(baseDamage * criticalMultiplier);
  }

  // 检查是否在范围内
  static isInRange(source, target, range) {
    return this.getDistance(source.x, source.y, target.x, target.y) <= range;
  }
} 