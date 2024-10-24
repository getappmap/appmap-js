import { join } from 'path';
import { symbols } from '../src/tokenize';
import { readFileSync } from 'fs';

describe('querySymbols', () => {
  const fileSymbols = (srcPath: string, allowGeneric = true) => {
    const fileExtension = srcPath.split('.').pop() || '';
    const content = readFileSync(srcPath, 'utf-8');
    return symbols(content, fileExtension, allowGeneric);
  };

  describe('csharp', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, 'fixtures/source/sample.cs');
      const symbols = fileSymbols(srcPath);
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
      const srcPath = join(__dirname, 'fixtures/source/sample.c');
      const symbols = fileSymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        ['foo', 'main', 'MyStruct', 'MyOtherStruct', 'Point'].sort()
      );
    });
  });

  describe('rust', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, 'fixtures/source/sample.rs');
      const symbols = fileSymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        ['Foo', 'new', 'MyUnion', 'MyTrait', 'my_function', 'Point', 'main', 'Москва'].sort()
      );
    });
  });

  describe('go', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, 'fixtures/source/sample.go');
      const symbols = fileSymbols(srcPath);
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
      const srcPath = join(__dirname, 'fixtures/source/sample.rb');
      const symbols = fileSymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        ['MyClass', 'MyModule', 'my_method', 'my_module_method', 'some_function'].sort()
      );
    });
  });

  describe('python', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, 'fixtures/source/sample.py');
      const symbols = fileSymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        ['MyClass', '__init__', 'say_hello', 'some_function'].sort()
      );
    });
  });

  describe('java', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, 'fixtures/source/sample.java');
      const symbols = fileSymbols(srcPath);
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
      const srcPath = join(__dirname, 'fixtures/source/sample.ts');
      const symbols = fileSymbols(srcPath);
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
      const srcPath = join(__dirname, 'fixtures/source/sample.kt');
      const symbols = fileSymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        ['main', 'Rectangle', 'Predicate', 'Color', 'filter', 'sort'].sort()
      );
    });
  });

  describe('php', () => {
    it('identifies symbols', () => {
      const srcPath = join(__dirname, 'fixtures/source/sample.php');
      const symbols = fileSymbols(srcPath);
      expect(symbols.sort()).toStrictEqual(
        ['MyClass', 'myMethod', 'Talk', 'talk', 'myFunction'].sort()
      );
    });
  });

  describe('generic', () => {
    const srcPath = join(__dirname, 'fixtures/source/sample.generic');

    it('identifies symbols', () => {
      const symbols = fileSymbols(srcPath);
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
      const symbols = fileSymbols(srcPath, false);
      expect(symbols).toStrictEqual([]);
    });
  });
});
