import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    console.log('BootScene preload started');
    
    // 添加加载进度显示
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 50);
    
    const loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      font: '20px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // 监听加载进度
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 4 + 10, height / 2 - 20, (width / 2 - 20) * value, 30);
    });
    
    // 加载防御塔图片
    this.load.image('code_warrior', '/assets/images/towers/code_warrior.png');
    this.load.image('algo_cannon', '/assets/images/towers/algo_cannon.png');
    this.load.image('firewall', '/assets/images/towers/firewall.png');
    this.load.image('debug_fairy', '/assets/images/towers/debug_fairy.png');
    this.load.image('ai_sniper', '/assets/images/towers/ai_sniper.png');
    this.load.image('blockchain_node', '/assets/images/towers/blockchain_node.png');

    // 加载怪物图片 - 更新路径和键名
    this.load.image('cyber_virus', '/assets/images/monsters/cyber_virus.png');
    this.load.image('ghost_hacker', '/assets/images/monsters/ghost_hacker.png');
    this.load.image('memory_leaker', '/assets/images/monsters/memory_leaker.png');
    this.load.image('trojan_demon', '/assets/images/monsters/trojan_demon.png');
    this.load.image('web_spider', '/assets/images/monsters/web_spider.png');
    this.load.image('binary_wizard', '/assets/images/monsters/binary_wizard.png');

    // 添加加载错误处理
    this.load.on('loaderror', (file) => {
      console.error('Error loading asset:', file.src);
      this.createTemporaryImage(file.key);
    });

    // 加载完成时
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      
      // 检查图片是否成功加载
      const towers = [
        { key: 'code_warrior', path: 'towers/code_warrior.png' },
        { key: 'algo_cannon', path: 'towers/algo_cannon.png' },
        { key: 'firewall', path: 'towers/firewall.png' },
        { key: 'debug_fairy', path: 'towers/debug_fairy.png' },
        { key: 'ai_sniper', path: 'towers/ai_sniper.png' },
        { key: 'blockchain_node', path: 'towers/blockchain_node.png' }
      ];

      towers.forEach(tower => {
        if (!this.textures.exists(tower.key)) {
          console.warn(`Failed to load texture: ${tower.key}`);
          this.createTemporaryImage(tower.key);
        } else {
          console.log(`Successfully loaded: ${tower.key}`);
        }
      });
      
      this.scene.start('GameScene');
    });
  }

  createTemporaryImage(key) {
    // 为新的怪物类型设置临时颜色
    const colors = {
      cyber_virus: 0xff0000,      // 红色
      ghost_hacker: 0x00ffff,     // 青色
      memory_leaker: 0xff00ff,    // 紫色
      trojan_demon: 0xff8800,     // 橙色
      web_spider: 0x00ff00,       // 绿色
      binary_wizard: 0xffff00     // 黄色
    };

    const graphics = this.add.graphics();
    const color = colors[key] || 0xffffff;
    
    graphics.fillStyle(color, 1);
    graphics.fillCircle(16, 16, 16);
    
    const texture = graphics.generateTexture(key, 32, 32);
    graphics.destroy();
    
    console.log(`Generated temporary image for: ${key}`);
  }

  create() {
    this.scene.start('GameScene');
  }
}