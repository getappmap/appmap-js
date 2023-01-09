import { win32, posix } from 'path';

jest.setMock('path', win32);

import isAncestorPath from '../../src/lib/isAncestorPath';

describe(isAncestorPath, () => {
  it.each([
    ['C:\\Foo', 'C:\\Foo\\Bar', true],
    ['C:\\Foo', 'C:\\Bar', false],
    ['C:\\Foo', 'D:\\Foo\\Bar', false],
    [
      'D:\\a\\appmap-js\\appmap-js\\packages\\scanner',
      'C:\\Users\\RUNNER~1\\AppData\\Local\\Temp\\pMITIo',
      false,
    ],
  ])('isAncestorPath(%s, %s) = %s', (ancestor, descendant, expected) => {
    expect(isAncestorPath(ancestor, descendant)).toBe(expected);
  });
});

jest.setMock('path', posix);

describe(isAncestorPath, () => {
  it.each([
    ['/foo', '/foo', true],
    ['/foo', '/bar', false],
    ['/foo', '/foobar', false],
    ['/foo', '/foo/bar', true],
    ['/foo', '/foo/../bar', false],
    ['/foo', '/foo/./bar', true],
    ['/bar/../foo', '/foo/bar', true],
    ['/foo', './bar', false],
  ])('isAncestorPath(%s, %s) = %s', (ancestor, descendant, expected) => {
    expect(isAncestorPath(ancestor, descendant)).toBe(expected);
  });
});
