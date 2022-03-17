import RootScope from '../../src/scope/rootScope';
import { fixtureAppMap } from '../util';

describe('root scope', () => {
  it('emits a scope for each root event', async () => {
    const appmap = await fixtureAppMap(
      'org_springframework_samples_petclinic_owner_OwnerControllerTests_testInitCreationForm.appmap.json'
    );
    const scopes = [...new RootScope().scopes(appmap.events[Symbol.iterator]())];
    expect(scopes.map((scope) => scope.scope.id)).toEqual([1, 9]);
    expect(scopes.map((scope) => scope.scope.toString())).toEqual([
      'GET /owners/new',
      'org/springframework/samples/petclinic/model/BaseEntity#isNew',
    ]);

    const requestEvents = Array.from(scopes[0].events());
    expect(requestEvents.length).toEqual(4);

    const fnEvents = Array.from(scopes[1].events());
    expect(fnEvents.length).toEqual(1);
  });
});
