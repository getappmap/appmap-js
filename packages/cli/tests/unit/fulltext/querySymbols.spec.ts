import { join } from 'path';
import querySymbols from '../../../src/fulltext/querySymbols';

describe('querySymbols', () => {
  describe('csharp', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.cs');
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        [
          'ClassOne',
          'ClassTwo',
          'ClassThree',
          'ClassFour',
          'StructOne',
          'StructTwo',
          'StructThree',
          'IOne',
          'ITwo',
          'IThree',
          'IFour',
          'Example',
          'Season',
          'ErrorCode',
          'ClassWithMethods',
          'ClassWithMethods',
          '~ClassWithMethods',
          'MethodOne',
          'MethodTwo',
          'MethodThree',
          'MethodFour',
        ].sort()
      );
    });
  });

  describe('c/cpp', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.c');
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        ['foo', 'main', 'MyStruct', 'MyOtherStruct', 'Point'].sort()
      );
    });
  });

  describe('rust', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.rs');
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        ['Foo', 'new', 'MyUnion', 'MyTrait', 'my_function', 'Point', 'main', 'Москва'].sort()
      );
    });
  });

  describe('go', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.go');
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        [
          'Locker',
          'MyInterface',
          'LockerImpl',
          'Lock',
          'Unlock',
          'Reader',
          'ReadWriter',
          'main',
          'unicodeβ',
        ].sort()
      );
    });
  });

  describe('ruby', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.rb');
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        ['MyClass', 'MyModule', 'my_method', 'my_module_method', 'some_function'].sort()
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
          'Hello',
          'Hello',
          'MyBaseClass',
          'MyBaseClass',
          'MyClass',
          'Python',
          'This',
          '__init__',
          '__init__',
          '__main__',
          '__name__',
          'my_array',
          'my_array',
          'my_module',
          'name',
          'name',
          'name',
          'name',
          'name',
          'perform',
          'perform',
          'perform_operation',
          'print',
          'print',
          'result',
          'result',
          'sample',
          'say_hello',
          'script',
          'some_function',
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
          'SampleEnum',
          'SampleAnnotation',
          'ISample',
          'Sample',
          'main',
          'performUserOperation',
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
          'MyClass',
          'constructor',
          '#myClassMethod',
          'myFunction',
          'myOtherFunction',
          'MyType',
          'MyInterface',
          'MyEnum',
          'myObjectMethod',
          'newLineBraces',
          '$lineBreak',
        ].sort()
      );
    });
  });

  describe('kotlin', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.kt');
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        ['main', 'Rectangle', 'Predicate', 'Color', 'filter', 'sort'].sort()
      );
    });
  });

  describe('php', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, '../fixtures/source/sample.php');
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        ['MyClass', 'myMethod', 'Talk', 'talk', 'myFunction'].sort()
      );
    });
  });

  describe('generic', () => {
    const srcPath = join(__dirname, '../fixtures/source/sample.generic');

    it('identifies symbols', () => {
      const symbols = querySymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        [
          'fibonacci',
          'Spacecraft',
          'Spacecraft',
          'describe',
          'PlanetType',
          'Resolution',
          'VideoMode',
          'Counter',
          'increment',
          'increment',
          'reset',
          'Something',
          '_init',
          'other_something',
          'something',
          'perform_action',
        ].sort()
      );
    });

    it('does not run if allowGeneric is false', () => {
      const symbols = querySymbols(srcPath, false);
      expect(symbols).toStrictEqual([]);
    });
  });
});
