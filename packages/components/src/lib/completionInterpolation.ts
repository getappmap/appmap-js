// StreamInterpolation adds artificial latency to a stream of data, to simulate
// a consistent stream of output in small chunks.
export default class CompletionInterpolation {
  private buffer = '';
  private onTokenCallbacks: Array<(token: string) => void> = [];
  private onEndCallbacks: Array<() => void> = [];
  private emitting = false;
  private tps = 0;
  private tokenCount = 0;
  private sampleInterval?: number;

  constructor(
    private readonly sampleRate = 1000,
    private readonly minimumTimeBetweenTokens = 16 /* ms */,
    private readonly charactersPerToken = 3
  ) {}

  public write(data: string): void {
    this.ensureSampling();

    for (let i = 0; i < data.length; i += this.charactersPerToken) {
      this.buffer += data.slice(i, i + this.charactersPerToken);
    }

    this.tokenCount += data.length / this.charactersPerToken;
  }

  private ensureSampling() {
    if (this.sampleInterval) return;

    this.sampleInterval = setInterval(() => {
      const lastTps = this.tps;
      this.tps = this.tokenCount / (this.sampleRate / 1000);

      // Apply a simple moving average to the token rate for some smoothing.
      if (lastTps) this.tps = (this.tps + lastTps) / 2;

      this.tokenCount = 0;
      if (!this.emitting) {
        this.emitting = true;
        this.emitToken();
      }
    }, this.sampleRate) as unknown as number;
    // TODO:            ^^^^^^^^^^^^^^^^^^^^^
    // TypeScript thinks we're in a Node.js environment, thus the cast.
    // https://developer.mozilla.org/en-US/docs/Web/API/setInterval#return_value
  }

  public onToken(cb: (token: string) => void): void {
    this.onTokenCallbacks.push(cb);
  }

  public onEnd(cb: () => void): void {
    this.onEndCallbacks.push(cb);
  }

  private emitToken(): void {
    if (!this.emitting && this.buffer.length === 0) {
      this.onEndCallbacks.forEach((cb) => cb());
      return;
    }

    if (this.tps > 0 && this.buffer.length) {
      const token = this.buffer.slice(0, this.charactersPerToken);
      this.buffer = this.buffer.slice(this.charactersPerToken);
      this.onTokenCallbacks.forEach((cb) => cb(token));
    }

    const nextToken = Math.max(this.minimumTimeBetweenTokens, Math.min(1000 / this.tps, 100));
    setTimeout(() => this.emitToken(), nextToken);
  }

  public dispose(): void {
    if (this.sampleInterval) clearInterval(this.sampleInterval);
    this.emitting = false;
  }
}
