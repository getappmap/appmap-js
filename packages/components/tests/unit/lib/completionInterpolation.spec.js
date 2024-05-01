import CompletionInterpolation from '@/lib/completionInterpolation';

describe('CompletionInterpolation', () => {
  const token = 'aaa';

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calculates the token rate', () => {
    const sampleRate = 1000;
    const interp = new CompletionInterpolation(sampleRate);

    const writeTokens = (count) => {
      for (let i = 0; i < count; i++) {
        interp.write(token);
      }
      jest.advanceTimersByTime(sampleRate);
    };

    expect(interp.tps).toBe(0);

    let lastTps = 0;
    for (let i = 0; i < 10; i++) {
      const count = 2 ** i;
      writeTokens(count);

      const expected = lastTps > 0 ? (count + lastTps) / 2 : count;
      expect(interp.tps).toBe(expected);

      lastTps = interp.tps;
    }
  });

  it('emits tokens at the correct rate', () => {
    const sampleRate = 1000;
    const interp = new CompletionInterpolation(sampleRate, 1000);
    const stub = jest.fn();
    interp.onToken(stub);

    const tokenCount = 2000;
    for (let i = 0; i < tokenCount; i++) {
      interp.write(token);
    }

    jest.advanceTimersByTime(sampleRate);
    expect(interp.tps).toBe(tokenCount);
    expect(stub).toHaveBeenCalledTimes(1);
  });

  it('throttles the rate of token emission', () => {
    const sampleRate = 1000;
    const minimumTimeBetweenTokens = 100;
    const interp = new CompletionInterpolation(sampleRate, minimumTimeBetweenTokens);
    const stub = jest.fn();
    interp.onToken(stub);

    const tokenCount = 1000;
    for (let i = 0; i < tokenCount; i++) {
      interp.write(token);
    }

    jest.advanceTimersByTime(sampleRate);
    expect(interp.tps).toBe(tokenCount);

    // Upon completion of the first sample period, token emission begins immediately.
    let totalCalls = 1;
    const secondsUntilComplete = tokenCount / (1000 / minimumTimeBetweenTokens);
    for (let i = 0; i < secondsUntilComplete; i++) {
      expect(stub).toHaveBeenCalledTimes(totalCalls);

      totalCalls += sampleRate / minimumTimeBetweenTokens;
      totalCalls = Math.min(totalCalls, tokenCount);

      jest.advanceTimersByTime(sampleRate);

      expect(stub).toHaveBeenCalledTimes(totalCalls);
    }
  });

  it('emits the entire token stream', () => {
    const sampleRate = 1000;
    const interp = new CompletionInterpolation(sampleRate, 1);
    const completion = Array.from({ length: 128 }, () =>
      Math.random().toString(36).substring(2)
    ).join('');
    let output = '';
    interp.onToken((t) => {
      output += t;
    });

    interp.write(completion);

    // One sample period to calculate the token rate
    // Another sample period to write the entire token stream
    jest.advanceTimersByTime(sampleRate * 2);
    expect(output).toEqual(completion);
  });
});
