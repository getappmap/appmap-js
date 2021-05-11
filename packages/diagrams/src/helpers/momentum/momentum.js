import Accumulator from './accumulator';

const FRICTION_COEFFICIENT = 2.5;
const IMPULSE_THRESHOLD = 1;
const EPSILON = 0.2;
const SAMPLES = 8;

export default class Momentum {
  constructor(zoom, selection) {
    this.vX = new Accumulator(SAMPLES);
    this.vY = new Accumulator(SAMPLES);
    this.transform = { x: 0.0, y: 0.0, k: 0.0 };
    this.velocity = { x: 0, y: 0 };
    this.selection = selection;
    this.node = selection.node();
    this.zoom = zoom;
    this.active = false;
    this.ticking = false;
  }

  cancel() {
    if (this.lastTick) {
      delete this.lastTick;
    }

    this.active = false;
    this.ticking = false;
  }

  hold() {
    this.active = false;
    this.holding = true;
    this.vX.reset();
    this.vY.reset();
  }

  release() {
    if (!this.holding) {
      return;
    }

    this.holding = false;
    this.impulse(this.vX.value, this.vY.value);
  }

  impulse(x, y, threshold = IMPULSE_THRESHOLD) {
    if (Math.abs(x) + Math.abs(y) < threshold) {
      return;
    }

    this.velocity.x = x / this.transform.k;
    this.velocity.y = y / this.transform.k;

    if (this.ticking) {
      return;
    }

    this.active = true;
    this.tick();
  }

  tick() {
    if (!this.moving || !this.active) {
      this.cancel();
      return;
    }

    this.ticking = true;

    requestAnimationFrame((t) => {
      if (!this.active) {
        this.cancel();
        return;
      }

      if (!this.lastTick) {
        this.lastTick = t - 1;
      }

      const dt = (t - this.lastTick) / 1000.0;

      this.zoom.translateBy(this.selection, this.velocity.x, this.velocity.y);

      this.velocity.x -= this.velocity.x * FRICTION_COEFFICIENT * dt;
      this.velocity.y -= this.velocity.y * FRICTION_COEFFICIENT * dt;

      this.lastTick = t;
      this.tick();
    });
  }

  updateTransform(transform) {
    // check if translation has changed by checking if scale hasn't
    if (!this.active && transform.k === this.transform.k) {
      this.vX.add(transform.x - this.transform.x);
      this.vY.add(transform.y - this.transform.y);
    }

    this.transform.x = transform.x;
    this.transform.y = transform.y;
    this.transform.k = transform.k;
  }

  get moving() {
    return Math.abs(this.velocity.x) + Math.abs(this.velocity.y) > EPSILON;
  }
}
