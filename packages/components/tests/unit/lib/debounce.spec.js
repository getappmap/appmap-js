import debounce from '@/lib/debounce';

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('performs the first call immediately', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).toHaveBeenCalled();
  });

  it('performs the last call after the delay', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 1000);
    debounced();
    expect(fn).toHaveBeenCalledTimes(1);

    debounced();
    expect(fn).toHaveBeenCalledTimes(1);

    jest.runAllTimers();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throttles calls', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 1000);
    debounced();
    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    for (let i = 0; i < 10; ++i) debounced();
    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('instantly performs a call after the timeout period', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 1000, true);
    debounced();
    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(2000);

    debounced();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('can debounce with a variable timeout', () => {
    let lastTimeout = 0;
    let nextTimeout = 0;
    let expectedCalls = 0;
    let i = 0;

    const fn = jest.fn();
    const debounced = debounce(fn, () => {
      lastTimeout = nextTimeout;
      nextTimeout = ++i * 100;

      return nextTimeout;
    });

    // First call should be immediate
    debounced();
    expectedCalls += 1;

    for (let i = 0; i < 10; ++i) {
      expect(lastTimeout).not.toEqual(nextTimeout);

      // Move timers 1ms before the timeout ends
      jest.advanceTimersByTime(nextTimeout - 1);
      expect(fn).toHaveBeenCalledTimes(expectedCalls);

      // This call shouldn't call our debounced function
      // because the timeout hasn't been reached yet
      debounced();
      expect(fn).toHaveBeenCalledTimes(expectedCalls);

      // This should push it over the edge. Because we called
      // our debounced function during the timeout period, it
      // will automatically be called again now that the timeout
      // has been reached.
      jest.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(++expectedCalls);
    }
  });
});
