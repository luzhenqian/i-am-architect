import { BaseConfig } from './BaseConfig';

export class GameConfig extends BaseConfig {
  constructor() {
    super();
    this.initialGold = 200;
    this.initialHealth = 100;
    this.cellSize = 64;
    this.monsterSpawnInterval = 2500;
    this.gridSize = { rows: 7, cols: 6 };
  }
}