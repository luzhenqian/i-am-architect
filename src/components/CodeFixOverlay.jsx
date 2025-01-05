import React from 'react';
import { createRoot } from 'react-dom/client';
import CodeFixScreen from './CodeFixScreen';

class CodeFixOverlay {
  constructor(scene) {
    this.scene = scene;
    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.zIndex = '1000';
    this.container.style.display = 'none';
    document.body.appendChild(this.container);

    this.root = createRoot(this.container);
  }

  show(wave) {
    const gameState = {
      wave,
      gold: this.scene.gold,
      health: this.scene.health,
      score: this.scene.score,
      difficulty: Math.floor(wave / 5)
    };

    this.container.style.display = 'block';
    this.root.render(
      <CodeFixScreen
        gameState={gameState}
        onComplete={(rewards) => this.handleComplete(rewards)}
        onSkip={(penalty) => this.handleSkip(penalty)}
      />
    );
  }

  hide() {
    this.container.style.display = 'none';
    this.root.render(null);
  }

  handleComplete(rewards = {}) {
    this.hide();
    // 应用奖励
    if (rewards.gold) this.scene.updateGold(this.scene.gold + rewards.gold);
    this.scene.scene.resume();
    setTimeout(() => {
      this.scene.wave++;
      this.scene.startWave();
    }, 1000);
  }

  handleSkip(penalty = {}) {
    // 跳过惩罚
    // if (penalty.gold) this.scene.addGold(-penalty.gold);
    // if (penalty.health) this.scene.addHealth(-penalty.health);
    // if (penalty.score) this.scene.addScore(-penalty.score);
    this.hide();
    this.scene.scene.resume();
    setTimeout(() => {
      this.scene.prepareNextWave();
    }, 1000);
  }

  destroy() {
    this.root.unmount();
    this.container.remove();
  }
}

export default CodeFixOverlay; 