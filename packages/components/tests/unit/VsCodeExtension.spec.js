import { mount } from '@vue/test-utils';
import VsCodeExtension from '@/pages/VsCodeExtension.vue';
import { store, VIEW_FLOW, SET_VIEW, DEFAULT_VIEW } from '@/store/vsCode';
import data from './fixtures/user_page_scenario.appmap.json';
import { nextTick } from 'vue';
import eventBus from '@/lib/eventBus';
import { RESET_FILTERS } from '../../src/store/vsCode';
import { AppMapFilter, serializeFilter, base64UrlEncode } from '@appland/models';

describe('VsCodeExtension.vue', () => {
  let wrapper; // Wrapper<Vue>

  function stateObjectToBase64(stateObject) {
    return Buffer.from(JSON.stringify(stateObject), 'utf-8').toString('base64url');
  }

  const defaultFilter = new AppMapFilter();
  const serialized = serializeFilter(defaultFilter);
  const base64encoded = base64UrlEncode(JSON.stringify({ filters: serialized }));
  const appmapFsPath = '/some/fake/path';

  const defaultFilterObject = {
    filterName: 'AppMap default',
    state: base64encoded,
    default: true,
  };

  beforeEach(async () => {
    wrapper = mount(VsCodeExtension, {
      global: {
        plugins: [store],
        stubs: {
          'v-diagram-component': true,
          'v-diagram-trace': true,
        },
      },
      props: {
        appmapFsPath,
      },
    });
    await wrapper.vm.loadData(data);
    wrapper.vm.$store.commit(RESET_FILTERS);
    wrapper.vm.$store.commit(SET_VIEW, DEFAULT_VIEW);
  });

  it('emits the "ask-navie-about-map" event when the buttons are clicked', async () => {
    const spy = jest.fn();
    eventBus.on('ask-navie-about-map', spy);

    await wrapper.find('[data-cy="ask-navie-control-button"]').trigger('click');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(appmapFsPath);

    await wrapper.find('[data-cy="collapsed-sidebar-ask-navie"]').trigger('click');
    expect(spy).toHaveBeenCalledTimes(2);

    // Open the details panel
    await wrapper.find('[data-cy="sidebar-hamburger-menu-icon"]').trigger('click');
    await nextTick();

    await wrapper.find('[data-cy="ask-navie-button"]').trigger('click');
    expect(spy).toHaveBeenCalledTimes(3);
    eventBus.off('ask-navie-about-map', spy);
  });

  it('sets the selected object by FQID', () => {
    wrapper.vm.setState('{"selectedObject":"label:json"}');
    expect(wrapper.vm.selectedLabel).toMatch('json');
    expect(wrapper.vm.getState()).toEqual(
      base64UrlEncode('{"currentView":"viewComponent","selectedObject":"label:json"}')
    );

    wrapper.vm.setState('{"selectedObject":"event:44"}');
    expect(wrapper.vm.selectedObject.toString()).toMatch('User.find_by_id!');
    expect(wrapper.vm.getState()).toEqual(
      base64UrlEncode('{"currentView":"viewComponent","selectedObject":"event:44"}')
    );

    wrapper.vm.setState('{"selectedObject":"class:app/models/User"}');
    expect(wrapper.vm.selectedObject.id).toMatch('app/models/User');
    expect(wrapper.vm.getState()).toEqual(
      base64UrlEncode(
        '{"currentView":"viewComponent","selectedObjects":["event:44","class:app/models/User"]}'
      )
    );

    wrapper.vm.setState('{"selectedObject":"analysis-finding:fakeHash"}');
    expect(wrapper.vm.selectedObject.id).toMatch('fakeHash');
    expect(wrapper.vm.getState()).toEqual(
      base64UrlEncode(
        '{"currentView":"viewComponent","selectedObjects":["event:44","class:app/models/User","analysis-finding:fakeHash"]}'
      )
    );

    wrapper.vm.clearSelection();

    const appState =
      '{"currentView":"viewComponent","filters":{"rootObjects":["package:app/controllers"],"limitRootEvents":false,"hideMediaRequests":false,"hideUnlabeled":true,"hideElapsedTimeUnder":100,"hideName":["package:json"]}}';

    wrapper.vm.setState(appState);

    expect(wrapper.vm.filters.rootObjects).toContain('package:app/controllers');
    expect(wrapper.vm.filters.declutter.limitRootEvents.on).toBe(false);
    expect(wrapper.vm.filters.declutter.hideMediaRequests.on).toBe(false);
    expect(wrapper.vm.filters.declutter.hideUnlabeled.on).toBe(true);
    expect(wrapper.vm.filters.declutter.hideElapsedTimeUnder.on).toBe(true);
    expect(wrapper.vm.filters.declutter.hideElapsedTimeUnder.time).toBe(100);
    expect(wrapper.vm.filters.declutter.hideName.on).toBe(true);
    expect(wrapper.vm.filters.declutter.hideName.names).toContain('package:json');

    expect(wrapper.vm.getState()).toEqual(
      'eyJjdXJyZW50VmlldyI6InZpZXdDb21wb25lbnQiLCJmaWx0ZXJzIjp7InJvb3RPYmplY3RzIjpbInBhY2thZ2U6YXBwL2NvbnRyb2xsZXJzIl0sImxpbWl0Um9vdEV2ZW50cyI6ZmFsc2UsImhpZGVNZWRpYVJlcXVlc3RzIjpmYWxzZSwiaGlkZVVubGFiZWxlZCI6dHJ1ZSwiaGlkZUVsYXBzZWRUaW1lVW5kZXIiOjEwMCwiaGlkZU5hbWUiOlsicGFja2FnZTpqc29uIl19fQ'
    );
  });

  it('default state encodes the current view', () => {
    expect(wrapper.vm.getState()).toEqual(stateObjectToBase64({ currentView: 'viewComponent' }));
  });

  it('serializes selectedObject state', async () => {
    const state = { selectedObject: 'event:44' };
    await wrapper.vm.setState(JSON.stringify(state));
    expect(wrapper.vm.selectedObject.toString()).toMatch('User.find_by_id!');
    expect(wrapper.vm.getState()).toEqual(
      stateObjectToBase64({ ...{ currentView: 'viewComponent' }, ...state })
    );
  });

  it('serializes rootObjects state', async () => {
    const state = { filters: { rootObjects: ['package:app/controllers'] } };
    await wrapper.vm.setState(JSON.stringify(state));
    expect(wrapper.vm.filters.rootObjects).toContain('package:app/controllers');
    expect(wrapper.vm.getState()).toEqual(
      stateObjectToBase64({ ...{ currentView: 'viewComponent' }, ...state })
    );
  });

  it('serializes limitRootEvents state', async () => {
    const state = { filters: { limitRootEvents: false } };
    await wrapper.vm.setState(JSON.stringify(state));
    expect(wrapper.vm.getState()).toEqual(
      stateObjectToBase64({ ...{ currentView: 'viewComponent' }, ...state })
    );
  });

  it('serializes hideMediaRequests state', async () => {
    const state = { filters: { hideMediaRequests: false } };
    await wrapper.vm.setState(JSON.stringify(state));
    expect(wrapper.vm.getState()).toEqual(
      stateObjectToBase64({ ...{ currentView: 'viewComponent' }, ...state })
    );
  });

  it('serializes hideUnlabeled state', async () => {
    const state = { filters: { hideUnlabeled: true } };
    await wrapper.vm.setState(JSON.stringify(state));
    expect(wrapper.vm.getState()).toEqual(
      stateObjectToBase64({ ...{ currentView: 'viewComponent' }, ...state })
    );
  });

  it('serializes hideElapsedTimeUnder state', async () => {
    const state = { filters: { hideElapsedTimeUnder: 100 } };
    await wrapper.vm.setState(JSON.stringify(state));
    expect(wrapper.vm.getState()).toEqual(
      stateObjectToBase64({ ...{ currentView: 'viewComponent' }, ...state })
    );
  });

  it('serializes hideName state', async () => {
    const state = {
      filters: { hideName: ['package:json', 'class:User'] },
    };
    await wrapper.vm.setState(JSON.stringify(state));
    expect(wrapper.vm.getState()).toEqual(
      stateObjectToBase64({ ...{ currentView: 'viewComponent' }, ...state })
    );
  });

  it('accepts a base64 encoded JSON object as state', async () => {
    const state = { filters: { hideName: ['package:json', 'class:User'] } };
    await wrapper.vm.setState(stateObjectToBase64(state));
    expect(wrapper.vm.getState()).toEqual(
      stateObjectToBase64({ ...{ currentView: 'viewComponent' }, ...state })
    );
  });

  it('changes views and modifies the search bar after setState', async () => {
    let appState = '{"currentView":"viewFlow","traceFilter":"id:44"}';
    expect(wrapper.vm.isViewingFlow).toBe(false);
    await wrapper.vm.setState(appState);

    await nextTick();
    expect(wrapper.vm.isViewingFlow).toBe(true);

    await nextTick();
    expect(wrapper.vm.eventFilterText).toBe('id:44 ');

    appState = '{"currentView":"viewSequence","searchBar":"id:42"}';
    await wrapper.vm.setState(appState);

    await nextTick();
    expect(wrapper.vm.isViewingSequence).toBe(true);

    await nextTick();
    expect(wrapper.vm.eventFilterText).toBe('id:42 ');
  });

  it('toggles filters off if selectedObject is outside of the filtered set', async () => {
    wrapper.vm.setState('{"selectedObject":"event:3"}');
    expect(wrapper.vm.selectedObject.toString()).toMatch('Net::HTTP#request');

    Object.values(wrapper.vm.filters.declutter).forEach((filter) => {
      expect(filter.on).toBe(false);
    });

    await nextTick();

    expect(wrapper.text()).toMatch('Net::HTTP#request');
  });

  it('emits user events', () => {
    const showInstructionsSpy = jest.fn();
    const changeTabSpy = jest.fn();
    eventBus.on('showInstructions', showInstructionsSpy);
    eventBus.on('changeTab', changeTabSpy);

    wrapper.vm.showInstructions();
    expect(showInstructionsSpy).toHaveBeenCalledTimes(1);

    wrapper.vm.onChangeTab(wrapper.vm.$refs[VIEW_FLOW]);
    expect(changeTabSpy).toHaveBeenCalledWith(VIEW_FLOW);

    eventBus.off('showInstructions', showInstructionsSpy);
    eventBus.off('changeTab', changeTabSpy);
  });

  it('creates a default filter', () => {
    // saveFilter is emitted during mounted(); check via spy in beforeEach if needed
    // This test verifies the filter object structure
    expect(wrapper.vm.$store.state.savedFilters).toEqual([defaultFilterObject]);
  });

  it('sets a single selected object by fqid when passed as an array', () => {
    wrapper.vm.setState('{"selectedObjects":["label:json"]}');
    expect(wrapper.vm.selectedLabel).toMatch('json');

    wrapper.vm.setState('{"selectedObjects":["event:44"]}');
    expect(wrapper.vm.selectedObject.toString()).toMatch('User.find_by_id!');

    wrapper.vm.setState('{"selectedObjects":["class:app/models/User"]}');
    expect(wrapper.vm.selectedObject.id).toMatch('app/models/User');

    wrapper.vm.setState('{"selectedObjects":["analysis-finding:fakeHash"]}');
    expect(wrapper.vm.selectedObject.id).toMatch('fakeHash');

    wrapper.vm.clearSelection();
  });

  it('sets multiple objects as selected when passed an array', () => {
    const objectsToSelect = ['event:44', 'class:app/models/User', 'analysis-finding:fakeHash'];
    const objectsToSelectString = JSON.stringify({ selectedObjects: objectsToSelect });
    wrapper.vm.setState(objectsToSelectString);

    const actualSelectedObjects = wrapper.vm.selectionStack.map(wrapper.vm.codeObjectToIdentifier);
    const actualSelectedObjectsString = JSON.stringify({ selectedObjects: actualSelectedObjects });
    expect(actualSelectedObjectsString).toMatch(objectsToSelectString);

    expect(wrapper.vm.selectedObject.id).toMatch('fakeHash');

    wrapper.vm.clearSelection();
  });

  it('renders the `unlicensed` notice when the user is unlicensed', async () => {
    await wrapper.setProps({ isLicensed: false });
    expect(wrapper.find('[data-cy="notice-unlicensed"]').exists()).toBe(true);
  });

  it('renders the `configuration required` notice when the user is unlicensed', async () => {
    await wrapper.setProps({ isConfigured: false });
    expect(wrapper.find('[data-cy="notice-configuration"]').exists()).toBe(true);
  });

  it('provides a button to export the sequence diagram by default', async () => {
    const state = { currentView: 'viewSequence' };
    await wrapper.vm.setState(JSON.stringify(state));

    await wrapper.find('[data-cy="export-button"] [data-cy="popper-button"]').trigger('click');
    expect(wrapper.find('[data-cy="exportSVG"]').exists()).toBe(true);
  });

  it('hides the export button when `allowExport` is false', async () => {
    const state = { currentView: 'viewSequence' };
    await wrapper.vm.setState(JSON.stringify(state));
    await wrapper.setProps({ allowExport: false });

    expect(wrapper.find('[data-cy="exportSVG"]').exists()).toBe(false);
  });

  it('can export the current AppMap data as JSON', async () => {
    const state = { filters: { hideExternalPaths: ['node_modules', 'vendor'] } };
    await wrapper.vm.setState(JSON.stringify(state));

    await wrapper.find('[data-cy="export-button"]').trigger('click');
    const exportJSON = wrapper.find('[data-cy="exportJSON"]');
    expect(exportJSON.exists()).toBe(true);
    const exportSpy = jest.fn();
    eventBus.on('exportJSON', exportSpy);
    await exportJSON.trigger('click');
    expect(exportSpy).toHaveBeenCalledTimes(1);
    const exportedData = exportSpy.mock.calls[0][0];
    eventBus.off('exportJSON', exportSpy);

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

  describe('when in the browser', () => {
    function mountWithProps(props) {
      // Override window.location.protocol to simulate browser environment
      Object.defineProperty(window, 'location', {
        value: { ...window.location, protocol: 'http:' }, writable: true,
      });
      wrapper = mount(VsCodeExtension, {
        global: {
          plugins: [store],
          stubs: {
            'v-diagram-component': true,
            'v-diagram-trace': true,
          },
        },
        props,
      });
      wrapper.vm.loadData(data);
      wrapper.vm.$store.commit(RESET_FILTERS);
    }

    beforeEach(() => {
      window.localStorage.clear();
    });

    it('does create a default filter when in the browser and one does not exist', () => {
      mountWithProps();
      expect(wrapper.vm.$store.state.savedFilters).toEqual([defaultFilterObject]);
    });

    it('does not create a default filter when in the browser and one already exists', () => {
      const spy = jest.fn();
      eventBus.on('saveFilter', spy);
      mountWithProps({ savedFilters: [defaultFilterObject] });
      expect(spy).not.toHaveBeenCalled();
      eventBus.off('saveFilter', spy);
    });
  });
});
