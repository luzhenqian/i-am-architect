import { MathUtils } from "./MathUtils";

export class SoundUtils {
  static playSound(scene, key, config = {}) {
    const {
      volume = 0.1,
      rate = 1.0,
      detune = 0,
      loop = false
    } = config;

    const sound = scene.sound.add(key);
    sound.play({
      volume,
      rate,
      detune,
      loop
    });

    return sound;
  }

  static playSoundWithDistance(scene, key, source, listener, maxDistance, config = {}) {
    const distance = MathUtils.getDistance(
      source.x, source.y,
      listener.x, listener.y
    );

    const volume = Math.max(0, 1 - (distance / maxDistance));
    return this.playSound(scene, key, { ...config, volume });
  }
} 