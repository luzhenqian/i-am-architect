export class BaseConfig {
  constructor() {
    if (this.constructor === BaseConfig) {
      throw new Error('BaseConfig 类不能直接实例化');
    }
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }
}