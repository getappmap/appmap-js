import { shallowMount } from '@vue/test-utils';
import Button from '@/components/Button.vue';

describe('Button.vue', () => {
  it('renders props.label when passed', () => {
    const label = 'hello world';
    const wrapper = shallowMount(Button, {
      propsData: { label },
    });
    expect(wrapper.text()).toMatch(label);
  });
});
