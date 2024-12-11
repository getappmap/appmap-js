import { mount } from '@vue/test-utils';
import VWelcomeMessage from '@/components/chat/WelcomeMessage.vue';

describe('VWelcomeMessage', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(VWelcomeMessage, {
      props: {
        dynamicMessage: '',
      },
    });
  });

  it('renders static message by default', () => {
    expect(wrapper.text()).toContain("Hi, I'm Navie");
    // Check that the dynamic placeholder is shown
    expect(wrapper.find('.welcome-message-dynamic-placeholder').exists()).toBe(true);
  });

  it('renders dynamic message when provided', async () => {
    await wrapper.setProps({
      dynamicMessage: '**Welcome!** This dynamic message is loaded and sanitized.',
    });

    // Verify that the dynamic message is rendered
    expect(wrapper.find('.welcome-message-dynamic').html()).toContain(
      '<strong>Welcome!</strong> This dynamic message is loaded and sanitized.'
    );

    // Check that the placeholder is not visible anymore
    expect(wrapper.find('.welcome-message-dynamic-placeholder').exists()).toBe(false);
  });
});
