import * as client from '@appland/client';
import Sinon from 'sinon';
import emitUsage from '../../../src/lib/emitUsage';

jest.mock('@appland/client');
const Usage = jest.mocked(client.Usage);

describe('emitUsage', () => {
  afterEach(Sinon.restore);

  beforeEach(() => {
    Usage.update.mockResolvedValue();
  });

  it('emits the expected usage information', async () => {
    const numEvents = 1;
    const numAppMaps = 2;
    const metadata = { app: 'test', foo: 'bar' };

    await emitUsage(process.cwd(), numEvents, numAppMaps, metadata as any);

    expect(Usage.update).toHaveBeenCalled();
    const [dto] = Usage.update.mock.calls[0];
    expect(dto).toMatchObject({
      events: numEvents,
      appmaps: numAppMaps,
      contributors: expect.any(Number),
      ci: Boolean(process.env.CI),
    });
    expect(JSON.parse(dto.metadata ?? '{}')).toMatchObject({
      app: metadata.app,
      git: {
        repository: expect.any(String),
        branch: expect.any(String),
        commit: expect.any(String),
      },
    });
  });
});
