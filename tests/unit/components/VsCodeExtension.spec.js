import { shallowMount } from '@vue/test-utils';
import VsCodeExtension from '@/pages/VsCodeExtension.vue';
import data from '../fixtures/user_page_scenario.appmap.json';

describe('VsCodeExtension.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallowMount(VsCodeExtension);
    wrapper.vm.loadData(data);
  });

  it('sets the selected object by FQID', () => {
    wrapper.vm.setSelectedObject('label:json');
    expect(wrapper.vm.selectedLabel).toMatch('json');

    wrapper.vm.setSelectedObject('event:44');
    expect(wrapper.vm.selectedObject.toString()).toMatch('User.find_by_id!');

    wrapper.vm.setSelectedObject('class:app/models/User');
    expect(wrapper.vm.selectedObject.id).toMatch('app/models/User');
  });
});
