import assert from 'assert';
import { queue } from 'async';

describe('async', () => {
  it('hangs if you drain an idle queue', async () => {
    const q = queue(async () => {}, 1);
    expect(q.idle()).toBe(true);
    let drained = false;
    q.drain().then(() => (drained = true));
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => (drained ? reject(`drain should not have resolved yet`) : resolve()), 50);
    });
  });
});
