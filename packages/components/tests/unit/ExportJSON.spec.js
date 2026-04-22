import { mount } from '@vue/test-utils';
import eventBus from '@/lib/eventBus';
import appMapData from './fixtures/user_page_scenario.appmap.json';
import { AppMapFilter, buildAppMap, serializeFilter } from '@appland/models';

import ExportJSON from '@/components/ExportJSON.vue';

describe('ExportJSON.vue', () => {
  const rubyFilter = new AppMapFilter();
  rubyFilter.declutter.hideExternalPaths.on = true;

  const defaultViewState = {
    filters: serializeFilter(rubyFilter),
  };

  const WrapperComponent = {
    components: { ExportJSON },
    props: ['appMap', 'viewState'],
    template: `
    <ExportJSON ref="export" :appMap="appMap" :viewState="viewState">
      <a>Export JSON</a>
    </ExportJSON>
  `,
  };

  it('exports JSON when clicked', async () => {
    const appMap = buildAppMap().source(appMapData).build();
    const filteredAppMap = rubyFilter.filter(appMap);
    const wrapper = mount(WrapperComponent, {
      props: { appMap: filteredAppMap, viewState: defaultViewState },
    });
    const spy = jest.fn();
    eventBus.on('exportJSON', spy);

    wrapper.vm.$refs.export.download();

    expect(spy).toHaveBeenCalledTimes(1);
    const exportedData = spy.mock.calls[0][0];
    eventBus.off('exportJSON', spy);
    expect(Object.keys(exportedData).sort()).toStrictEqual([
      'classMap',
      'events',
      'metadata',
      // 'version', TODO: version should be exported, but isn't somehow.
      'viewState',
    ]);

    expect(exportedData.events.length).toEqual(22); // 36 without hideExternalPaths
    expect(exportedData.viewState.filters.hideExternalPaths.sort()).toEqual([
      'node_modules',
      'vendor',
    ]);
  });
});
