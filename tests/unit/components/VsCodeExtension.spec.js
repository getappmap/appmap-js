import { mount } from '@vue/test-utils';
import VsCodeExtension from '@/pages/VsCodeExtension.vue';
import data from '../fixtures/user_page_scenario.appmap.json';

describe('VsCodeExtension.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(VsCodeExtension, {
      stubs: {
        VDiagramComponent: true,
        VDiagramTrace: true,
      },
    });
    wrapper.vm.loadData(data);
  });

  it('sets the selected object by FQID', () => {
    // FQID: Header
    const expected = {
      'label:json': 'json',
      'event:44': 'User.find_by_id!',
      'class:app/models/User': 'User',
    };

    Object.entries(expected).forEach(([fqid, header]) => {
      wrapper.vm.setSelectedObject(fqid);
      expect(wrapper.get('details-label__header-title').text()).toMatch(header);
    });
  });
});
