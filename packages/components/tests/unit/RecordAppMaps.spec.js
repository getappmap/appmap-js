import { shallowMount } from '@vue/test-utils';
import RecordAppMaps from '@/pages/install-guide/RecordAppMaps.vue';

describe('RecordAppMaps.vue', () => {
  it('contains a link to the documentation by default', () => {
    const wrapper = shallowMount(RecordAppMaps, {
      propsData: { editor: 'vscode' },
    });
    expect(wrapper.find('a[href]').text()).toBe('documentation.');
  });
});
