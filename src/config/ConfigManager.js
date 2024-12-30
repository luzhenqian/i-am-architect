import { GameConfig } from './GameConfig';
import { TowerConfig } from './TowerConfig';
import { MonsterConfig } from './MonsterConfig';
import { LevelConfig } from './LevelConfig';

export class ConfigManager {
  static getInstance() {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  constructor() {
    this.gameConfig = GameConfig.getInstance();
    this.towerConfig = TowerConfig.getInstance();
    this.monsterConfig = MonsterConfig.getInstance();
    this.levelConfig = LevelConfig.getInstance();
  }
} 