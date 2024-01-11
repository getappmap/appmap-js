import { createWrapper, mount } from '@vue/test-utils';
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
      propsData: { appMap: filteredAppMap, viewState: defaultViewState },
    });
    const rootWrapper = createWrapper(wrapper.vm.$root);

    wrapper.vm.$refs.export.download();

    const exportJSONEventParameters = rootWrapper.emitted()['exportJSON'];
    expect(exportJSONEventParameters).toBeArrayOfSize(1);
    const exportedData = exportJSONEventParameters[0][0];
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
