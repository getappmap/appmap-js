import { join } from 'path';
import querySymbols from '../../../src/fulltext/querySymbols';

describe('querySymbols', () => {
  describe('csharp', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.cs');
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        [
          'class',
          'class',
          'class',
          'class',
          'class',
          'class',
          'class',
          'classfour',
          'classone',
          'classthree',
          'classtwo',
          'classwithmethods',
          'classwithmethods',
          'error',
          'errorcode',
          'example',
          'four',
          'four',
          'four',
          'ifour',
          'ione',
          'ithree',
          'itwo',
          'method',
          'method',
          'method',
          'method',
          'methodfour',
          'methodone',
          'methods',
          'methods',
          'methods',
          'methodthree',
          'methodtwo',
          'one',
          'one',
          'one',
          'one',
          'season',
          'struct',
          'struct',
          'struct',
          'structone',
          'structthree',
          'structtwo',
          'three',
          'three',
          'three',
          'three',
          'two',
          'two',
          'two',
          'two',
          '~classwithmethods',
        ].sort()
      );
    });
  });

  describe('c/cpp', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.c');
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        [
          'foo',
          'main',
          'my',
          'my',
          'myotherstruct',
          'mystruct',
          'other',
          'point',
          'struct',
          'struct',
        ].sort()
      );
    });
  });

  describe('rust', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.rs');
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        [
          'foo',
          'function',
          'main',
          'my',
          'my',
          'my',
          'my_function',
          'mytrait',
          'myunion',
          'new',
          'point',
          'trait',
          'union',
          'москва',
        ].sort()
      );
    });
  });

  describe('go', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.go');
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        [
          'impl',
          'interface',
          'lock',
          'locker',
          'locker',
          'lockerimpl',
          'main',
          'my',
          'myinterface',
          'read',
          'reader',
          'readwriter',
          'unicodeβ',
          'unlock',
          'writer',
        ].sort()
      );
    });
  });

  describe('ruby', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.rb');
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        [
          'class',
          'function',
          'method',
          'method',
          'module',
          'module',
          'my',
          'my',
          'my',
          'my',
          'my_method',
          'my_module_method',
          'myclass',
          'mymodule',
          'some',
          'some_function',
        ].sort()
      );
    });
  });

  describe('python', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.py');
      const symbols = querySymbols(srcPath);
      console.log(symbols);
      expect(symbols.sort()).toStrictEqual(
        [
          '__init__',
          '__init__',
          '__main__',
          '__name__',
          'array',
          'array',
          'base',
          'base',
          'class',
          'class',
          'class',
          'function',
          'hello',
          'hello',
          'hello',
          'init',
          'init',
          'main',
          'module',
          'my',
          'my',
          'my',
          'my',
          'my',
          'my',
          'my_array',
          'my_array',
          'my_module',
          'mybaseclass',
          'mybaseclass',
          'myclass',
          'name',
          'name',
          'name',
          'name',
          'name',
          'name',
          'operation',
          'perform',
          'perform',
          'perform',
          'perform_operation',
          'print',
          'print',
          'python',
          'result',
          'result',
          'sample',
          'say',
          'say_hello',
          'script',
          'some',
          'some_function',
          'this',
          'world',
        ].sort()
      );
    });
  });

  describe('java', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.java');
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        [
          'annotation',
          'enum',
          'isample',
          'main',
          'operation',
          'perform',
          'performuseroperation',
          'sample',
          'sample',
          'sample',
          'sample',
          'sampleannotation',
          'sampleenum',
          'user',
        ].sort()
      );
    });
  });

  describe('javascript/typescript', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.ts');
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        [
          '#myclassmethod',
          '$linebreak',
          'braces',
          'break',
          'class',
          'class',
          'constructor',
          'enum',
          'function',
          'function',
          'interface',
          'line',
          'line',
          'method',
          'method',
          'my',
          'my',
          'my',
          'my',
          'my',
          'my',
          'my',
          'my',
          'myclass',
          'myenum',
          'myfunction',
          'myinterface',
          'myobjectmethod',
          'myotherfunction',
          'mytype',
          'new',
          'newlinebraces',
          'object',
          'other',
          'type',
        ].sort()
      );
    });
  });

  describe('kotlin', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.kt');
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        ['color', 'filter', 'main', 'predicate', 'rectangle', 'sort'].sort()
      );
    });
  });

  describe('php', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.php');
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        [
          'class',
          'function',
          'method',
          'my',
          'my',
          'my',
          'myclass',
          'myfunction',
          'mymethod',
          'talk',
          'talk',
        ].sort()
      );
    });
  });

  describe('generic', () => {
    const srcPath = join(__dirname, '../fixtures/source/sample.generic');

    it('identifies symbols', () => {
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        [
          '_init',
          'action',
          'counter',
          'describe',
          'fibonacci',
          'increment',
          'increment',
          'init',
          'mode',
          'other',
          'other_something',
          'perform',
          'perform_action',
          'planet',
          'planettype',
          'reset',
          'resolution',
          'something',
          'something',
          'something',
          'spacecraft',
          'spacecraft',
          'type',
          'video',
          'videomode',
        ].sort()
      );
    });

    it('does not run if allowGeneric is false', () => {
      const symbols = querySymbols(srcPath, false);
      expect(symbols).toStrictEqual([]);
    });
  });
});
