class LevelManager {
  constructor() {
    this.currentWave = 1;
    this.difficulty = 1.0;
    this.waveThresholds = [5, 10, 15, 20];
    this.difficultyIncrement = 0.2;
  }

  update(score) {
    const newWave = this.calculateWave(score);
    if (newWave > this.currentWave) {
      this.currentWave = newWave;
      this.difficulty = 1.0 + (this.currentWave - 1) * this.difficultyIncrement;
      console.log(`Wave ${this.currentWave}開始! 難易度: ${this.difficulty.toFixed(1)}`);
    }
    return this.currentWave;
  }

  calculateWave(score) {
    for (let i = 0; i < this.waveThresholds.length; i++) {
      if (score < this.waveThresholds[i]) {
        return i + 1;
      }
    }
    return this.waveThresholds.length + 1;
  }

  getSpawnRate() {
    return 1.0 * this.difficulty;
  }

  getSpeedMultiplier() {
    return 1.0 + (this.difficulty - 1) * 0.5;
  }

  getTargetSize() {
    return Math.max(30, 40 - this.currentWave * 2);
  }
}