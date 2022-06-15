import buildAppMap from '../../src/appMapBuilder';
import EventNavigator from '../../src/eventNavigator';
import largeScenario from './fixtures/large_scenario.json';
import apiKeyScenario from './fixtures/revoke_api_key.appmap.json';

const largeAppMap = buildAppMap().source(largeScenario).normalize().build();
const apiKeyAppMap = buildAppMap().source(apiKeyScenario).normalize().build();

/**
 * Try to stuff events in the scenario so it goes to given depth.
 * It does so by finding a pair of call/return events and then generating
 * nested copies inside.
 * @param {object} scenario
 * @param {number} targetDepth
 */
function deepen(scenario, targetDepth) {
  const events = [...scenario.events];

  let baseIdx = events.findIndex((event, index) => {
    if (event.event !== 'call' || !event.method_id) return false;
    const next = events[index + 1];
    if (!next) return false;
    if (next.event !== 'return') return false;
    return next.parent_id === event.id;
  });
  const [callTpl, retTpl] = events.slice(baseIdx, baseIdx + 2);
  function splice(...elements) {
    baseIdx += 1;
    events.splice(baseIdx, 0, ...elements);
  }

  let lastId = Math.max(...events.map(({ id }) => id));
  function nextId() {
    lastId += 1;
    return lastId;
  }

  function makePair() {
    const newCall = { ...callTpl, id: nextId() };
    const newRet = { ...retTpl, id: nextId(), parent_id: newCall.id };
    return [newCall, newRet];
  }

  for (let i = 0; i < targetDepth; i += 1) splice(...makePair());

  return { ...scenario, events };
}

describe('EventNavigator', () => {
  test('ancestors', () => {
    const event = largeAppMap.events.find(
      (e) => e.isCall() && e.methodId === 'recover'
    );
    const ancestors = new EventNavigator(event).ancestors();
    const evt = ancestors.next();

    expect(evt.value).toBeInstanceOf(EventNavigator);
    expect(evt.value.event.methodId).toEqual('takeLeadership');
    expect(ancestors.next().done).toEqual(true);
  });

  test('precedingSiblings', () => {
    const event = apiKeyAppMap.events.find(
      (e) => e.isCall() && e.methodId === 'touch'
    );
    const precedingSiblings = new EventNavigator(event).precedingSiblings();

    let evt = precedingSiblings.next();
    expect(evt.value.event.id).toEqual(11);
    evt = precedingSiblings.next();
    expect(evt.value.event.id).toEqual(9);
    evt = precedingSiblings.next();
    expect(evt.done).toEqual(true);
  });

  test('followingSiblings', () => {
    const event = apiKeyAppMap.events.find(
      (e) => e.isCall() && e.methodId === 'touch'
    );
    const followingSiblings = new EventNavigator(event).followingSiblings();

    expect(followingSiblings.next().value.event.id).toEqual(17);
    expect(followingSiblings.next().value.event.id).toEqual(19);
    expect(followingSiblings.next().value.event.id).toEqual(21);
    expect(followingSiblings.next().value.event.id).toEqual(23);
    expect(followingSiblings.next().value.event.id).toEqual(25);
    expect(followingSiblings.next().done).toEqual(true);
  });

  test('inspecting labels on yielded events', () => {
    const event = apiKeyAppMap.events.find(
      (e) => e.isCall() && e.methodId === 'authenticate'
    );
    const self = new EventNavigator(event).self();

    const evt = self.next().value;
    expect(evt.hasLabels('provider.authenticate')).toEqual(true);
    expect(self.next().done).toEqual(true);
  });

  test('descendants', () => {
    const event = largeAppMap.events.find(
      (e) => e.isCall() && e.methodId === 'recover'
    );
    const descendants = new EventNavigator(event).descendants();

    expect(descendants.next().value.event.methodId).toEqual('getTasks');
    expect(descendants.next().done).toEqual(true);
  });

  test('descendants works correctly on a deep structure', () => {
    const scenario = deepen(apiKeyScenario, 8192);
    const appMap = buildAppMap().source(scenario).normalize().build();
    const navigator = new EventNavigator(appMap.rootEvent);
    expect(() => [...navigator.descendants()].length).not.toThrow(RangeError);
  });

  test('chaining axis generators', () => {
    const event = apiKeyAppMap.events.find(
      (e) => e.isCall() && e.methodId === 'authenticate'
    );
    const followingSiblings = new EventNavigator(event).followingSiblings();

    const eventIds = [];
    let followingSibling = followingSiblings.next();
    while (!followingSibling.done) {
      eventIds.push(followingSibling.value.event.id);
      const descendants = followingSibling.value.descendants();
      let descendant = descendants.next();
      while (!descendant.done) {
        eventIds.push(descendant.value.event.id);
        descendant = descendants.next();
      }
      followingSibling = followingSiblings.next();
    }

    expect(eventIds).toEqual([28, 29, 30, 32, 34]);
  });
});
