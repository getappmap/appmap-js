import codeObjectId from '../../src/codeObjectId';

class CodeObjectStruct {
  constructor(type, name, isStatic, parent) {
    this.type = type;
    this.name = name;
    this.static = isStatic;
    this.parent = parent;
    this.children = [];
    if (parent) parent.children.push(this);
  }
}

function buildCodeObject(data) {
  const result = data.reduce((list, item) => {
    let parent;
    if (list.length > 0) parent = list[list.length - 1];
    list.push(new CodeObjectStruct(item.type, item.name, item.static, parent));
    return list;
  }, []);
  return result[result.length - 1];
}

describe('codeObjectId', () => {
  describe('for', () => {
    it('package', () => {
      expect(codeObjectId(buildCodeObject([{ type: 'package', name: 'foo' }])).join('')).toEqual(
        'foo'
      );
    });
    it('multi-token package', () => {
      expect(
        codeObjectId(
          buildCodeObject([
            { type: 'package', name: 'foo' },
            { type: 'package', name: 'bar' },
          ])
        ).join('')
      ).toEqual('foo/bar');
    });
    it('class', () => {
      expect(
        codeObjectId(
          buildCodeObject([
            { type: 'package', name: 'foo' },
            { type: 'class', name: 'Foo' },
          ])
        ).join('')
      ).toEqual('foo/Foo');
    });
    it('multi-token class', () => {
      expect(
        codeObjectId(
          buildCodeObject([
            { type: 'package', name: 'foo' },
            { type: 'package', name: 'bar' },
            { type: 'class', name: 'Foo' },
            { type: 'class', name: 'Bar' },
          ])
        ).join('')
      ).toEqual('foo/bar/Foo::Bar');
    });
    it('function', () => {
      expect(
        codeObjectId(
          buildCodeObject([
            { type: 'package', name: 'foo' },
            { type: 'class', name: 'Foo' },
            { type: 'function', name: 'gloat' },
          ])
        ).join('')
      ).toEqual('foo/Foo#gloat');
    });
    it('static function', () => {
      expect(
        codeObjectId(
          buildCodeObject([
            { type: 'package', name: 'foo' },
            { type: 'class', name: 'Foo' },
            { type: 'function', name: 'gloat', static: true },
          ])
        ).join('')
      ).toEqual('foo/Foo.gloat');
    });
    it('database', () => {
      expect(
        codeObjectId(buildCodeObject([{ type: 'database', name: 'Database' }])).join('')
      ).toEqual('Database');
    });
    it('query', () => {
      expect(
        codeObjectId(
          buildCodeObject([
            { type: 'database', name: 'Database' },
            { type: 'query', name: 'SELECT * FROM fake' },
          ])
        ).join('')
      ).toEqual('SELECT * FROM fake');
    });
    it('http', () => {
      expect(
        codeObjectId(buildCodeObject([{ type: 'http', name: 'HTTP server requests' }])).join('')
      ).toEqual('HTTP server requests');
    });
    it('route', () => {
      expect(
        codeObjectId(
          buildCodeObject([
            { type: 'http', name: 'HTTP server requests' },
            { type: 'route', name: 'GET /' },
          ])
        ).join('')
      ).toEqual('GET /');
    });
    it('external service', () => {
      expect(
        codeObjectId(buildCodeObject([{ type: 'external-service', name: '127.0.0.1:9515' }])).join(
          ''
        )
      ).toEqual('127.0.0.1:9515');
    });
    it('external route', () => {
      expect(
        codeObjectId(
          buildCodeObject([
            { type: 'external-service', name: '127.0.0.1:9515' },
            { type: 'external-route', name: 'POST http://127.0.0.1:9515/session/1234567890' },
          ])
        ).join('')
      ).toEqual('POST http://127.0.0.1:9515/session/1234567890');
    });
    it('other type', () => {
      expect(
        codeObjectId(
          buildCodeObject([
            { type: 'food', name: 'toast' },
            { type: 'class', name: 'Foo' },
            { type: 'function', name: 'gloat', static: true },
          ])
        ).join('')
      ).toEqual('toast->Foo.gloat');
    });
  });
});
