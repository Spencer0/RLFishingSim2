export class CarEnvironment {
  constructor({ width = 400, height = 450, speed = 1 } = {}) {
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.trackCenter = { x: width, y: height - 200 };
    this.outerRadiusX = width * 0.5;
    this.outerRadiusY = height * 0.5;
    this.innerRadiusX = width * 0.25;
    this.innerRadiusY = height * 0.25;
    this.midRadiusX = (this.outerRadiusX + this.innerRadiusX) / 2;
    this.midRadiusY = (this.outerRadiusY + this.innerRadiusY) / 2;
    this.startAngle = -Math.PI / 2;

    this.fireTires = [
      {x: 550, y: 95, radius: 16},
      //generate 10 more on the track
      {x: 525, y: 300, radius: 16},
      {x: 350, y: 115, radius: 16},
    ];
    this.reset();
  }

  reset() {
    const jitterAngle = this.startAngle + (Math.random() * 0.04 - 0.02);
    const startX = this.trackCenter.x + this.midRadiusX * Math.cos(jitterAngle);
    const startY = this.trackCenter.y + this.midRadiusY * Math.sin(jitterAngle);
    this.car = {
      x: startX,
      y: startY,
      headingDeg: 0
    };
    this.lastTheta = this.getTrackAngle(this.car.x, this.car.y);
    this.angularProgress = 0;

    return this.getState();
  }

  getState() {
    const theta = this.getTrackAngle(this.car.x, this.car.y);
    const headingDiff = this.getHeadingDifference(theta);
    const outerEdgeDistance = this.getOuterTrackClearance();
    const innerEdgeDistance = this.getInnerTrackClearance();
    return [
      innerEdgeDistance,
      outerEdgeDistance,
      headingDiff / 180,
      Math.min(this.angularProgress / (Math.PI * 2), 1)
    ];
  }

  getTrackAngle(x, y) {
    const normalizedX = (x - this.trackCenter.x) / this.midRadiusX;
    const normalizedY = (y - this.trackCenter.y) / this.midRadiusY;
    return Math.atan2(normalizedY, normalizedX);
  }

  normalizeAngleDelta(delta) {
    if (delta > Math.PI) return delta - Math.PI * 2;
    if (delta < -Math.PI) return delta + Math.PI * 2;
    return delta;
  }

  getTangentHeadingDeg(theta) {
    const tangentX = -this.midRadiusX * Math.sin(theta);
    const tangentY = this.midRadiusY * Math.cos(theta);
    return (Math.atan2(tangentY, tangentX) * 180) / Math.PI;
  }

  getHeadingDifference(theta) {
    const targetHeading = this.getTangentHeadingDeg(theta);
    return this.normalizeAngleDelta(((this.car.headingDeg - targetHeading) * Math.PI) / 180) * (180 / Math.PI);
  }

  getOuterTrackClearance() {
    const dx = this.car.x - this.trackCenter.x;
    const dy = this.car.y - this.trackCenter.y;
    const normalized = (dx * dx) / (this.outerRadiusX * this.outerRadiusX)
      + (dy * dy) / (this.outerRadiusY * this.outerRadiusY);
    return 1 - normalized;
  }

  getInnerTrackClearance() {
    const dx = this.car.x - this.trackCenter.x;
    const dy = this.car.y - this.trackCenter.y;
    const normalized = (dx * dx) / (this.innerRadiusX * this.innerRadiusX)
      + (dy * dy) / (this.innerRadiusY * this.innerRadiusY);
    return normalized - 1;
  }

  isCollidingWithFireTire() {
    const carCollisionRadius = 10;
    return this.fireTires.some((tire) => {
      const dx = this.car.x - tire.x;
      const dy = this.car.y - tire.y;
      const distanceSquared = dx * dx + dy * dy;
      const maxDistance = tire.radius + carCollisionRadius;
      return distanceSquared <= maxDistance * maxDistance;
    });
  }

  step(actionDeg) {
    this.car.headingDeg += actionDeg;
    const headingRad = (this.car.headingDeg * Math.PI) / 180;
    this.car.x += this.speed * Math.cos(headingRad);
    this.car.y += this.speed * Math.sin(headingRad);

    const hitWall = this.getOuterTrackClearance() < 0 || this.getInnerTrackClearance() < 0;
    const hitFireTire = this.isCollidingWithFireTire();
    const crashed = hitWall || hitFireTire;
    const theta = this.getTrackAngle(this.car.x, this.car.y);
    const thetaDelta = this.normalizeAngleDelta(theta - this.lastTheta);
    this.angularProgress += Math.max(thetaDelta, -0.08);
    this.lastTheta = theta;
    const finished = this.angularProgress >= Math.PI * 2;

    let reward = 0;
    let done = false;
    let event = 'running';

    if (crashed) {
      reward = -10;
      done = true;
      event = 'crash';
    } else if (finished) {
      reward = 1;
      done = true;
      event = 'finish';
    } else {
      //Not crashed, not finished,
      reward = Math.max(thetaDelta, 0) * 2.0; //Reward progress around the track, but cap it to prevent weird outliers from destabilizing learning
    }

    return {
      nextState: this.getState(),
      reward,
      done,
      event
    };
  }
}
