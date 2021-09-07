import { join } from 'path';
import sinon from 'sinon';
import AssertCommand from '../src/command';

describe('smoke test', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('runs as expected', async () => {
    const processExit = sinon.stub(process, 'exit');
    await AssertCommand.handler({
      appmapDir: join(__dirname, 'fixtures', 'appmaps'),
      config: join(__dirname, '..', 'src', 'defaultAssertions.ts'),
      format: 'progress',
    } as any);

    expect(processExit.calledWith(0)).toBe(true);
  });

  it('runs as expected with default config', async () => {
    const processExit = sinon.stub(process, 'exit');
    await AssertCommand.handler({
      appmapDir: join(__dirname, 'fixtures', 'appmaps'),
      format: 'progress',
      config: '../defaultAssertions.ts', // need to pass it explicitly
    } as any);

    expect(processExit.calledWith(0)).toBe(true);
  });
});
