import { shallowMount } from '@vue/test-utils';
import RecordAppMaps from '@/pages/install-guide/RecordAppMaps.vue';

describe('RecordAppMaps.vue', () => {
  it('shows all languages by default', () => {
    const wrapper = shallowMount(RecordAppMaps, {
      propsData: { editor: 'vscode' },
    });
    expect(wrapper.text()).toContain('Java');
    expect(wrapper.text()).toContain('JavaScript');
    expect(wrapper.text()).toContain('Python');
    expect(wrapper.text()).toContain('Ruby');
  });

  it('hides props.disabledLanguages when passed', () => {
    const wrapper = shallowMount(RecordAppMaps, {
      propsData: { editor: 'vscode', disabledLanguages: ['Python'] },
    });
    expect(wrapper.text()).not.toContain('Python');
  });
});
