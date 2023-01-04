import updateInGetRequest from '../../src/rules/updateInGetRequest';
import testRule from '../support/testRule';

describe(updateInGetRequest.title, () => {
  it('correctly recognizes an update in a GET request', async () => {
    const findings = await testRule(updateInGetRequest, [
      { http: 'GET /foobar' },
      [{ sql: 'UPDATE things SET col=4' }],
    ]);
    expect(findings[0].checkId).toEqual(updateInGetRequest.id);
  });

  it('correctly recognizes an update deeper in a GET request', async () => {
    const findings = await testRule(updateInGetRequest, [
      { http: 'GET /foobar' },
      [[{ fn: 'Foo.check' }, [{ sql: 'UPDATE things SET col=4' }]]],
    ]);
    expect(findings[0].checkId).toEqual(updateInGetRequest.id);
  });

  it('does not flag an update in a POST request', async () => {
    const findings = await testRule(updateInGetRequest, [
      { http: 'POST /foobar' },
      [{ sql: 'UPDATE things SET col=4' }],
    ]);
    expect(findings.length).toEqual(0);
  });
});
