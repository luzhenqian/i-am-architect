import { BaseConfig } from './BaseConfig';

export class LevelConfig extends BaseConfig {
  constructor() {
    super();

    this.levelExperience = {
      1: 100,
      2: 200,
      3: 350,
      4: 550,
      5: 800,
      6: 1100,
      7: 1450,
      8: 1850,
      9: 2300,
      10: 2800,
      11: 3350,
      12: 3950,
      13: 4600,
      14: 5300,
      15: 6050,
    };
  }

  getNextLevelExp(currentLevel) {
    if (currentLevel <= 15) {
      return this.levelExperience[currentLevel] || 100;
    }
    return this.levelExperience[15] + (currentLevel - 15) * 800;
  }
} 