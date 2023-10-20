import formatAPILocation from '../../../src/cmds/compare-report/formatAPILocation';

describe('formatAPILocation', () => {
  it('should format endpoints correctly', async () => {
    const result1 = formatAPILocation('paths./microposts.post.responses.302');
    expect(result1).toEqual('302 POST /microposts');

    const result2 = formatAPILocation('paths./microposts.post.responses.422');
    expect(result2).toEqual('422 POST /microposts');

    const result3 = formatAPILocation('paths./microposts/{id}');
    expect(result3).toEqual('/microposts/{id}');

    const result4 = formatAPILocation('randomString');
    expect(result4).toEqual('randomString');
  });
});
