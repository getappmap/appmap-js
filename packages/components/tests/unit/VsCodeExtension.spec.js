import { mount, createWrapper } from '@vue/test-utils';
import VsCodeExtension from '@/pages/VsCodeExtension.vue';
import { VIEW_FLOW } from '@/store/vsCode';
import data from './fixtures/user_page_scenario.appmap.json';

describe('VsCodeExtension.vue', () => {
  let wrapper;
  let rootWrapper;

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

    wrapper.vm.setState(
      '{"currentView":"viewFlow","filters":{"rootObjects":[],"limitRootEvents":false,"hideMediaRequests":true,"hideUnlabeled":false,"hideElapsedTimeUnder":100,"hideName":false}}'
    );
    expect(wrapper.vm.filters.declutter.limitRootEvents.on).toBe(false);
    expect(wrapper.vm.filters.declutter.hideMediaRequests.on).toBe(true);
    expect(wrapper.vm.filters.declutter.hideUnlabeled.on).toBe(false);
    expect(wrapper.vm.filters.declutter.hideElapsedTimeUnder.on).toBe(true);
    expect(wrapper.vm.filters.declutter.hideElapsedTimeUnder.time).toBe(100);
    expect(wrapper.vm.filters.declutter.hideName.on).toBe(false);
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
