import helpers from '../../../src/cmds/compare-report/helpers';
import assert from 'assert';
import sinon from 'sinon';
import ReportSection, { ReportOptions } from '../../../src/cmds/compare-report/ReportSection';
import { base64UrlEncode } from '@appland/models';
import { SafeString } from 'handlebars';

describe('pluralize', () => {
  const pluralize = (helpers as any).pluralize;

  it('builds the plural form when count is 0', () => expect(pluralize(0, 'test')).toEqual('tests'));
  it('uses the plural form when count is 0', () =>
    expect(pluralize(0, 'ox', 'oxen')).toEqual('oxen'));
  it('returns the singular form when count is 1', () =>
    expect(pluralize(1, 'test')).toEqual('test'));
  it('returns the singular form when count is 1', () =>
    expect(pluralize(1, 'test', 'oxen')).toEqual('test'));
  it('builds the plural form when count is 2', () => expect(pluralize(0, 'test')).toEqual('tests'));
  it('uses the plural form when count is 2', () =>
    expect(pluralize(0, 'deer', 'deer')).toEqual('deer'));
  it(`ignores the 'plural' argument if it's an object`, () =>
    expect(pluralize(0, 'test', {})).toEqual('tests'));
  it(`ignores the 'plural' argument if it's a function`, () =>
    expect(pluralize(0, 'test', () => true)).toEqual('tests'));
});

describe('ReportSection', () => {
  describe('appmap_url_with_finding helper', () => {
    const appmapURL = new URL('https://getappmap.com');
    const sourceURL = new URL('http://fake.com');
    const mockHash = 'a0b1c2d3e4f5g6h7i8j9k';
    const pathToMap = 'path/to/map';
    const revision = 'head';
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => (sandbox = sinon.createSandbox()));
    afterEach(() => sandbox.restore());

    it('creates the expected URL when appmapURL is set', () => {
      const helpers = ReportSection.helpers({ appmapURL, sourceURL } as ReportOptions);
      assert(helpers);
      expect(helpers).toHaveProperty('appmap_url_with_finding');
      const result = helpers.appmap_url_with_finding(revision, { id: pathToMap }, mockHash);
      expect(result).toBeInstanceOf(SafeString);

      const expectedPath = `${revision}%2F${pathToMap.replace(/\//g, '%2F')}.appmap.json`;
      const expectedStateObject = { selectedObject: `analysis-finding:${mockHash}` };
      const expectedState = base64UrlEncode(JSON.stringify(expectedStateObject));
      expect(result.string).toBe(
        `${appmapURL.toString()}?path=${expectedPath}&state=${expectedState}`
      );
    });

    it('creates the expected URL when state is not created', () => {
      sinon.stub(JSON, 'stringify').throws(new Error('mock error'));
      const helpers = ReportSection.helpers({ appmapURL, sourceURL } as ReportOptions);
      assert(helpers);
      expect(helpers).toHaveProperty('appmap_url_with_finding');
      const result = helpers.appmap_url_with_finding(revision, { id: pathToMap }, mockHash);
      expect(result).toBeInstanceOf(SafeString);

      const expectedPath = `${revision}%2F${pathToMap.replace(/\//g, '%2F')}.appmap.json`;
      expect(result.string).toBe(`${appmapURL.toString()}?path=${expectedPath}`);
    });

    it('creates the expected URL when appmapURL is not set', () => {
      const helpers = ReportSection.helpers({ sourceURL } as ReportOptions);
      assert(helpers);
      expect(helpers).toHaveProperty('appmap_url_with_finding');
      const result = helpers.appmap_url_with_finding('head', { id: pathToMap }, mockHash);
      expect(result).toBeInstanceOf(SafeString);

      expect(result.string).toBe(`${revision}/${pathToMap}.appmap.json`);
    });
  });
});
