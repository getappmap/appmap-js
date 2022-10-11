import { mount, createWrapper } from '@vue/test-utils';
import VsCodeExtension from '@/pages/VsCodeExtension.vue';
import { VIEW_FLOW } from '@/store/vsCode';
import data from './fixtures/user_page_scenario.appmap.json';
import Vue from 'vue';

describe('VsCodeExtension.vue', () => {
  let wrapper;
  let rootWrapper;

  function serialize(json) {
    return Buffer.from(JSON.stringify(json), 'utf-8').toString('base64url');
  }

  beforeEach(() => {
    wrapper = mount(VsCodeExtension, {
      stubs: {
        'v-diagram-component': true,
        'v-diagram-trace': true,
      },
    });
    rootWrapper = createWrapper(wrapper.vm.$root);
    wrapper.vm.loadData(data);
  });

  it('sets the selected object by FQID', () => {
    wrapper.vm.setState('{"selectedObject":"label:json"}');
    expect(wrapper.vm.selectedLabel).toMatch('json');

    wrapper.vm.setState('{"selectedObject":"event:44"}');
    expect(wrapper.vm.selectedObject.toString()).toMatch('User.find_by_id!');

    wrapper.vm.setState('{"selectedObject":"class:app/models/User"}');
    expect(wrapper.vm.selectedObject.id).toMatch('app/models/User');

    wrapper.vm.clearSelection();

    const appState =
      '{"currentView":"viewComponent","filters":{"rootObjects":["package:app/controllers"],"limitRootEvents":false,"hideMediaRequests":false,"hideUnlabeled":true,"hideElapsedTimeUnder":100,"hideName":["package:json"]}}';

    wrapper.vm.setState(appState);

    expect(wrapper.vm.filters.declutter.rootObjects).toContain('package:app/controllers');
    expect(wrapper.vm.filters.declutter.limitRootEvents.on).toBe(false);
    expect(wrapper.vm.filters.declutter.hideMediaRequests.on).toBe(false);
    expect(wrapper.vm.filters.declutter.hideUnlabeled.on).toBe(true);
    expect(wrapper.vm.filters.declutter.hideElapsedTimeUnder.on).toBe(true);
    expect(wrapper.vm.filters.declutter.hideElapsedTimeUnder.time).toBe(100);
    expect(wrapper.vm.filters.declutter.hideName.on).toBe(true);
    expect(wrapper.vm.filters.declutter.hideName.names).toContain('package:json');

    expect(wrapper.vm.getState()).toEqual(
      'eyJmaWx0ZXJzIjp7InJvb3RPYmplY3RzIjpbInBhY2thZ2U6YXBwL2NvbnRyb2xsZXJzIl0sImxpbWl0Um9vdEV2ZW50cyI6ZmFsc2UsImhpZGVNZWRpYVJlcXVlc3RzIjpmYWxzZSwiaGlkZVVubGFiZWxlZCI6dHJ1ZSwiaGlkZUVsYXBzZWRUaW1lVW5kZXIiOjEwMCwiaGlkZU5hbWUiOlsicGFja2FnZTpqc29uIl19fQ'
    );
  });

  it('default state results in an empty string', () => {
    expect(wrapper.vm.getState()).toEqual('');
  });

  it('serializes selectedObject state', async () => {
    const state = { selectedObject: 'event:44' };
    await wrapper.vm.setState(JSON.stringify(state));
    expect(wrapper.vm.selectedObject.toString()).toMatch('User.find_by_id!');
    expect(wrapper.vm.getState()).toEqual(serialize(state));
  });

  it('serializes rootObjects state', async () => {
    const state = { filters: { rootObjects: ['package:app/controllers'] } };
    await wrapper.vm.setState(JSON.stringify(state));
    expect(wrapper.vm.filters.declutter.rootObjects).toContain('package:app/controllers');
    expect(wrapper.vm.getState()).toEqual(serialize(state));
  });

  it('serializes limitRootEvents state', async () => {
    const state = { filters: { limitRootEvents: false } };
    await wrapper.vm.setState(JSON.stringify(state));
    expect(wrapper.vm.getState()).toEqual(serialize(state));
  });

  it('serializes hideMediaRequests state', async () => {
    const state = { filters: { hideMediaRequests: false } };
    await wrapper.vm.setState(JSON.stringify(state));
    expect(wrapper.vm.getState()).toEqual(serialize(state));
  });

  it('serializes hideUnlabeled state', async () => {
    const state = { filters: { hideUnlabeled: true } };
    await wrapper.vm.setState(JSON.stringify(state));
    expect(wrapper.vm.getState()).toEqual(serialize(state));
  });

  it('serializes hideElapsedTimeUnder state', async () => {
    const state = { filters: { hideElapsedTimeUnder: 100 } };
    await wrapper.vm.setState(JSON.stringify(state));
    expect(wrapper.vm.getState()).toEqual(serialize(state));
  });

  it('serializes hideName state', async () => {
    const state = { filters: { hideName: ['package:json', 'class:User'] } };
    await wrapper.vm.setState(JSON.stringify(state));
    expect(wrapper.vm.getState()).toEqual(serialize(state));
  });

  it('accepts a base64 encoded JSON object as state', async () => {
    const state = serialize({ filters: { hideName: ['package:json', 'class:User'] } });
    await wrapper.vm.setState(state);
    expect(wrapper.vm.getState()).toEqual(state);
  });

  it('changes views and modifies the trace filter after setState', async () => {
    const appState = '{"currentView":"viewFlow","traceFilter":"id:44"}';
    wrapper.vm.setState(appState);

    await Vue.nextTick();

    expect(wrapper.vm.isViewingFlow).toBe(true);
    expect(wrapper.vm.$refs.traceFilter).toBeTruthy();
  });

  it('toggles filters off if selectedObject is outside of the filtered set', async () => {
    wrapper.vm.setState('{"selectedObject":"event:3"}');
    expect(wrapper.vm.selectedObject.toString()).toMatch('Net::HTTP#request');

    Object.values(wrapper.vm.filters.declutter).forEach((filter) => {
      expect(filter.on).toBe(false);
    });

    await Vue.nextTick();

    expect(wrapper.text()).toMatch('Net::HTTP#request');
  });

  it('emits user events', () => {
    // Sanity checks
    expect(rootWrapper.emitted().showInstructions).toBeUndefined();
    expect(rootWrapper.emitted().changeTab).toBeArrayOfSize(1);
    expect(rootWrapper.emitted().selectedObject).toBeUndefined();

    wrapper.vm.showInstructions();
    expect(rootWrapper.emitted().showInstructions).toBeArrayOfSize(1);

    wrapper.vm.onChangeTab(wrapper.vm.$refs[VIEW_FLOW]);
    expect(rootWrapper.emitted().changeTab[1]).toContain(VIEW_FLOW);
  });
});
