import { shallowMount } from '@vue/test-utils';
import ApplandButton from '@/components/ApplandButton.vue';

describe('ApplandButton.vue', () => {
  it('renders props.label when passed', () => {
    const label = 'hello world';
    const wrapper = shallowMount(ApplandButton, {
      propsData: { label },
    });
    expect(wrapper.text()).toMatch(label);
  });
});
