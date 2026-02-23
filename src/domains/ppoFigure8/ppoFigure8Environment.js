const CORRIDOR_WIDTH = 0.12;
const CORRIDOR_HEIGHT = 0.25;

export class CarEnvironment {
  constructor({ width = 800, height = 500, speed = 1.1 } = {}) {
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.outerRadiusX = width * 0.22;
    this.outerRadiusY = height * 0.35;
    this.innerRadiusX = width * 0.1;
    this.innerRadiusY = height * 0.18;
    this.midRadiusX = (this.outerRadiusX + this.innerRadiusX) / 2;
    this.midRadiusY = (this.outerRadiusY + this.innerRadiusY) / 2;
    this.leftCenter = { x: width * 0.3, y: height * 0.5 };
    this.rightCenter = { x: width * 0.7, y: height * 0.5 };
    this.corridor = {
      xMin: width * (0.5 - CORRIDOR_WIDTH / 2),
      xMax: width * (0.5 + CORRIDOR_WIDTH / 2),
      yMin: height * (0.5 - CORRIDOR_HEIGHT / 2),
      yMax: height * (0.5 + CORRIDOR_HEIGHT / 2)
    };
    this.reset();
  }

  ellipseNorm(x, y, center, rx, ry) {
    const dx = x - center.x;
    const dy = y - center.y;
    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
  }

  isInLoopRing(x, y, center) {
    const insideOuter = this.ellipseNorm(x, y, center, this.outerRadiusX, this.outerRadiusY) <= 1;
    const outsideInner = this.ellipseNorm(x, y, center, this.innerRadiusX, this.innerRadiusY) >= 1;
    return insideOuter && outsideInner;
  }

  isInCorridor(x, y) {
    return x >= this.corridor.xMin && x <= this.corridor.xMax && y >= this.corridor.yMin && y <= this.corridor.yMax;
  }

  isOnTrack(x, y) {
    return this.isInLoopRing(x, y, this.leftCenter) || this.isInLoopRing(x, y, this.rightCenter) || this.isInCorridor(x, y);
  }

  getLoopTheta(loop, x = this.car.x, y = this.car.y) {
    const center = loop === 0 ? this.leftCenter : this.rightCenter;
    const nx = (x - center.x) / this.midRadiusX;
    const ny = (y - center.y) / this.midRadiusY;
    return Math.atan2(ny, nx);
  }

  normalizeAngleDelta(delta) {
    if (delta > Math.PI) return delta - 2 * Math.PI;
    if (delta < -Math.PI) return delta + 2 * Math.PI;
    return delta;
  }

  orientedThetaDelta(loop, theta, prevTheta) {
    const raw = this.normalizeAngleDelta(theta - prevTheta);
    return loop === 0 ? raw : -raw;
  }

  getTangentHeadingDeg(loop, theta) {
    let tx = -this.midRadiusX * Math.sin(theta);
    let ty = this.midRadiusY * Math.cos(theta);
    if (loop === 1) {
      tx *= -1;
      ty *= -1;
    }
    return (Math.atan2(ty, tx) * 180) / Math.PI;
  }

  nearestWallDistances(x = this.car.x, y = this.car.y) {
    const loops = [this.leftCenter, this.rightCenter].map((center) => {
      const outer = Math.abs(1 - Math.sqrt(this.ellipseNorm(x, y, center, this.outerRadiusX, this.outerRadiusY))) * ((this.outerRadiusX + this.outerRadiusY) / 2);
      const inner = Math.abs(Math.sqrt(this.ellipseNorm(x, y, center, this.innerRadiusX, this.innerRadiusY)) - 1) * ((this.innerRadiusX + this.innerRadiusY) / 2);
      return { outer, inner };
    });
    const nearestOuter = Math.min(...loops.map((v) => v.outer));
    const nearestInner = Math.min(...loops.map((v) => v.inner));
    const scale = Math.max(this.width, this.height);
    return { outer: Math.max(0, Math.min(1, nearestOuter / scale)), inner: Math.max(0, Math.min(1, nearestInner / scale)) };
  }

  getState() {
    const theta = this.getLoopTheta(this.currentLoop);
    const targetHeading = this.getTangentHeadingDeg(this.currentLoop, theta);
    const headingDiff = (this.normalizeAngleDelta(((this.car.headingDeg - targetHeading) * Math.PI) / 180) * 180) / Math.PI;
    const dists = this.nearestWallDistances();
    return [
      dists.outer,
      dists.inner,
      headingDiff / 180,
      Math.max(0, Math.min(1, this.currentLoopProgress / (Math.PI * 2))),
      this.currentLoop,
      Math.max(0, Math.min(1, this.speed / 3))
    ];
  }

  reset() {
    const theta = -Math.PI / 2 + (Math.random() * 0.04 - 0.02);
    this.car = {
      x: this.leftCenter.x + this.midRadiusX * Math.cos(theta),
      y: this.leftCenter.y + this.midRadiusY * Math.sin(theta),
      headingDeg: this.getTangentHeadingDeg(0, theta)
    };
    this.currentLoop = 0;
    this.currentLoopProgress = 0;
    this.figure8LoopsCompleted = 0;
    this.lastTheta = theta;
    return this.getState();
  }

  canTransitionLoops() {
    return this.isInCorridor(this.car.x, this.car.y) && this.currentLoopProgress > Math.PI * 1.7;
  }

  step(actionDeg) {
    this.car.headingDeg += actionDeg;
    const headingRad = (this.car.headingDeg * Math.PI) / 180;
    this.car.x += this.speed * Math.cos(headingRad);
    this.car.y += this.speed * Math.sin(headingRad);

    const crashed = !this.isOnTrack(this.car.x, this.car.y);
    let reward = 0;
    let done = false;
    let event = 'running';

    if (crashed) {
      reward = -2;
      done = true;
      event = 'crash';
      return { nextState: this.getState(), reward, done, event };
    }

    const theta = this.getLoopTheta(this.currentLoop);
    const thetaDeltaRaw = this.orientedThetaDelta(this.currentLoop, theta, this.lastTheta);
    const thetaDelta = Math.max(0, Math.min(0.1, thetaDeltaRaw));
    this.currentLoopProgress += thetaDeltaRaw;
    reward += thetaDelta * 3.0;
    this.lastTheta = theta;

    if (this.canTransitionLoops()) {
      this.figure8LoopsCompleted += 1;
      reward += 5;
      if (this.currentLoop === 1) {
        reward += 15;
        done = true;
        event = 'finish';
      } else {
        this.currentLoop = 1;
        this.currentLoopProgress = 0;
        this.lastTheta = this.getLoopTheta(1);
        event = 'loop-complete';
      }
    }

    return { nextState: this.getState(), reward, done, event };
  }
}
