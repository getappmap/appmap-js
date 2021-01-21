const STALE_TIME = 0.33; // seconds

function removeStaleSamples(accumulator) {
  let lastTime = Date.now();
  for (let i = accumulator.values.length - 1; i >= 0; i -= 1) {
    const sample = accumulator.values[i];
    const dt = (lastTime - sample.time) / 60.0;

    // If enough time has passed between the new sample and the last sample,
    // all the existing data is considered stale and removed.
    if (dt > accumulator.staleTime) {
      accumulator.values.splice(0, accumulator.values.length);
      break;
    }

    lastTime = sample.time;
  }
}

// Accumulator keeps a running average of values up to a max number of samples
// samples decay and are removed after the staleTime
export default class Accumulator {
  constructor(maxSamples, staleTime = STALE_TIME) {
    this.maxSamples = maxSamples;
    this.staleTime = staleTime;
    this.reset();
  }

  add(value) {
    removeStaleSamples(this);

    if (this.values.length >= this.maxSamples) {
      this.values.splice(0, this.values.length - this.maxSamples + 1);
    }

    this.values.push({ value, time: Date.now() });
  }

  reset() {
    this.values = [];
  }

  get length() {
    return this.values.length;
  }

  get value() {
    removeStaleSamples(this);
    const length = this.values.length - 1;
    /* eslint-disable no-param-reassign, no-return-assign */
    return length !== 0
      ? this.values.reduce((acc, sample) => (acc += sample.value), 0) / length
      : 0;
    /* eslint-enable no-param-reassign, no-return-assign */
  }
}
