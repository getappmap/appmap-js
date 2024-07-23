import { ConfigurationRpc } from '@appland/rpc';
import { handler as rpcClientHandler } from '../../src/cmds/rpcClient';
import { join } from 'path';

const workingDirectory = process.cwd();

describe('rpc-client command', () => {
  afterEach(() => process.chdir(workingDirectory));

  describe('for non-existent RPC function', () => {
    test('throws error', async () => {
      const argv = {
        function: 'nonExistentFunction',
        request: '{"key": "value"}',
        directory: [],
        codeEditor: undefined,
      };
      await expect(rpcClientHandler(argv as any)).rejects.toThrow(
        'No such method: nonExistentFunction'
      );
    });
  });

  describe('for existing RPC function', () => {
    test('invokes the function', async () => {
      const argv = {
        function: ConfigurationRpc.V2.Get.Method,
        request: '{}',
        directory: ['dir1', 'dir2'],
        codeEditor: undefined,
      };
      const response = await rpcClientHandler(argv as any);
      expect(response).toEqual(
        expect.objectContaining({
          appmapConfigFiles: [join('dir1', 'appmap.yml'), join('dir2', 'appmap.yml')],
          projectDirectories: ['dir1', 'dir2'],
        })
      );
    });
  });
});
