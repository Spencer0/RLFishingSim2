export class CarEnvironment {
  constructor({ width = 800, height = 500, wallMargin = 80, speed = 5, trackLength = 760 } = {}) {
    this.width = width;
    this.height = height;
    this.wallMargin = wallMargin;
    this.speed = speed;
    this.trackLength = trackLength;
    this.reset();
  }

  getTopWallY() {
    return this.wallMargin;
  }

  getBottomWallY() {
    return this.height - this.wallMargin;
  }

  reset() {
    const centerY = (this.getTopWallY() + this.getBottomWallY()) / 2;
    this.car = {
      x: 40,
      y: centerY + (Math.random() * 10 - 5),
      headingDeg: 0
    };

    return this.getState();
  }

  getState() {
    const topDistance = this.car.y - this.getTopWallY();
    const bottomDistance = this.getBottomWallY() - this.car.y;
    return [
      topDistance / this.height,
      bottomDistance / this.height,
      this.car.headingDeg / 180,
      this.car.y / this.height
    ];
  }

  step(actionDeg) {
    this.car.headingDeg += actionDeg;
    const headingRad = (this.car.headingDeg * Math.PI) / 180;
    this.car.x += this.speed * Math.cos(headingRad);
    this.car.y += this.speed * Math.sin(headingRad);

    const crashed = this.car.y < this.getTopWallY() || this.car.y > this.getBottomWallY();
    const finished = this.car.x >= this.trackLength;

    let reward = 0;
    let done = false;
    let event = 'running';

    if (crashed) {
      reward = -1;
      done = true;
      event = 'crash';
    } else if (finished) {
      reward = 1;
      done = true;
      event = 'finish';
    }

    return {
      nextState: this.getState(),
      reward,
      done,
      event
    };
  }
}
