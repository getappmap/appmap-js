import URI from '../../src/lib/uri';

describe('URI', () => {
  describe('fromFilePath', () => {
    describe('windows', () => {
      it('works with absolute posix paths', () => {
        const uri = URI.fromFilePath('C:\\foo\\bar.txt');
        expect(uri).toEqual('file:///C:\\foo\\bar.txt');
        expect(URI.parse(uri)).toEqual(
          expect.objectContaining({
            scheme: 'file',
            fsPath: 'C:\\foo\\bar.txt',
          })
        );
      });
    });

    describe('posix', () => {
      it('works with absolute posix paths', () => {
        const uri = URI.fromFilePath('/foo/bar.txt');
        expect(uri).toEqual('file:///foo/bar.txt');
        expect(URI.parse(uri)).toEqual(
          expect.objectContaining({
            scheme: 'file',
            fsPath: '/foo/bar.txt',
          })
        );
      });

      it('works with relative posix paths', () => {
        const uri = URI.fromFilePath('foo/bar.txt');
        expect(uri).toEqual('file:foo/bar.txt');
        expect(URI.parse(uri)).toEqual(
          expect.objectContaining({
            scheme: 'file',
            fsPath: 'foo/bar.txt',
          })
        );
      });

      it('works with line ranges', () => {
        const uri = URI.fromFilePath('foo/bar.txt', { start: 1, end: 2 });
        expect(uri).toEqual('file:foo/bar.txt#L1-L2');
        expect(URI.parse(uri)).toEqual(
          expect.objectContaining({
            scheme: 'file',
            fsPath: 'foo/bar.txt',
            range: { start: 1, end: 2 },
          })
        );
      });
    });
  });
  describe('random', () => {
    it('works', () => {
      expect(URI.random()).toMatch(
        /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });
  });
  describe('file protocol', () => {
    describe('windows', () => {
      it.skip('parses', () => {
        const examples = {
          'file://C:/foo/bar.txt': {
            scheme: 'file',
            path: 'C:/foo/bar.txt',
          },
        };
        Object.entries(examples).forEach(([uri, expected]) => {
          expect(URI.parse(uri)).toEqual(expected);
        });
      });

      it('serializes', () => {});
    });

    describe('posix', () => {});
  });
});
