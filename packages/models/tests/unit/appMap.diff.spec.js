import buildAppMap from '../../src/appMapBuilder';
import AppMap from '../../src/appMap';
import baseAppMapData from './fixtures/diff_base.appmap.json';
import headAppMapData from './fixtures/diff_working.appmap.json';

const baseAppMap = buildAppMap().source(baseAppMapData).normalize().build();
const headAppMap = buildAppMap().source(headAppMapData).normalize().build();

describe('AppMap.diff', () => {
  it('compares the appmaps', () => {
    const diff = AppMap.getDiff(baseAppMap, headAppMap);
    const normalizedDiff = {};

    const normalizeEvent = (event) => ({
      id: event.id,
      identity_properties: event.gatherIdentityProperties(),
      stable_properties: event.gatherStableProperties(),
    });
    const normalizeEvents = (events) => {
      if (Array.isArray(events)) return events.map(normalizeEvents);

      return normalizeEvent(events);
    };

    Object.keys(diff).forEach(
      // eslint-disable-next-line no-return-assign
      (key) => (normalizedDiff[key] = normalizeEvents(diff[key]))
    );
    console.log(JSON.stringify(normalizedDiff, null, 2));
  });
});
