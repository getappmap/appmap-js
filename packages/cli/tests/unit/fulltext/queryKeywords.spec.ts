import queryKeywords from '../../../src/fulltext/queryKeywords';

describe('queryKeywords', () => {
  it('should sanitize and split keywords correctly', () => {
    const input = 'Hello_World! Welcome to the universe.';
    expect(queryKeywords(input)).toEqual(['hello', 'world', 'helloworld', 'welcome', 'universe']);
  });

  it('should filter out stop words', () => {
    const input = 'the quick brown fox jumps over the lazy dog';
    expect(queryKeywords(input)).toEqual(['quick', 'brown', 'fox', 'jumps', 'lazy', 'dog']);
  });

  it('should handle under_score words', () => {
    const input = 'hello_world this_is_a_test';
    expect(queryKeywords(input)).toEqual([
      'hello',
      'world',
      'helloworld',
      'this',
      'thisis',
      'isa',
      'test',
      'atest',
    ]);
  });

  it('should handle camelCased words', () => {
    const input = 'helloWorld thisIsATest';
    expect(queryKeywords(input)).toEqual([
      'hello',
      'world',
      'helloworld',
      'this',
      'thisis',
      'isa',
      'test',
      'atest',
    ]);
  });

  it('should handle array input', () => {
    const input = ['hello', 'world'];
    expect(queryKeywords(input)).toEqual(['hello', 'world']);
  });

  it('should return empty array for invalid input', () => {
    expect(queryKeywords(undefined)).toEqual([]);
    expect(queryKeywords('')).toEqual([]);
  });

  it('should only return words with length >= 2', () => {
    const input = 'a an i am';
    expect(queryKeywords(input)).toEqual(['am']);
  });

  it('should split camelCased words with consecutive uppercase letters', () => {
    const input = 'dataForUSACounties';
    expect(queryKeywords(input)).toEqual([
      'data',
      'datafor',
      'usa',
      'forusa',
      'counties',
      'usacounties',
    ]);
  });

  it('should handle strings with multiple camelizations', () => {
    const input = 'XMLHttpRequest and HTTPResponseCode';
    expect(queryKeywords(input)).toEqual([
      'xml',
      'http',
      'xmlhttp',
      'request',
      'httprequest',
      'http',
      'response',
      'httpresponse',
      'responsecode',
    ]);
  });
});
