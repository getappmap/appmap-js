import CommandScope from '../../src/scope/commandScope';
import { fixtureAppMap } from '../util';

describe('command scope', () => {
  it('emits http_server_request command with child events', async () => {
    const appmap = await fixtureAppMap(
      'org_springframework_samples_petclinic_owner_OwnerControllerTests_testInitCreationForm.appmap.json'
    );
    const scopes = [...new CommandScope().scopes(appmap.events[Symbol.iterator]())];
    expect(scopes.map((scope) => scope.scope.id)).toEqual([1]);
    expect(scopes.map((scope) => scope.scope.toString())).toEqual(['GET /owners/new']);

    const requestEvents = Array.from(scopes[0].events());
    expect(requestEvents.length).toEqual(4);
  });
});
