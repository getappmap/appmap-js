import updateInGetRequest from '../../src/rules/updateInGetRequest';
import describeRule from '../support/describeRule';

describeRule(updateInGetRequest, [
  [
    'correctly recognizes an update in a GET request',
    [{ http: 'GET /foobar' }, [{ sql: 'UPDATE things SET col=4' }]],
    1,
  ],
  [
    'correctly recognizes an update deeper in a GET request',
    [{ http: 'GET /foobar' }, [[{ fn: 'Foo.check' }, [{ sql: 'UPDATE things SET col=4' }]]]],
    1,
  ],
  [
    'does not flag an update in a POST request',
    [{ http: 'POST /foobar' }, [{ sql: 'UPDATE things SET col=4' }]],
    0,
  ],
]);
