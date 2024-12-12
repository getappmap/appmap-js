import { mount } from '@vue/test-utils';
import VWelcomeMessageV1 from '@/components/chat/WelcomeMessageV1.vue';

describe('VWelcomeMessageV1', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(VWelcomeMessageV1, {
      props: {
        dynamicMessage: '',
      },
    });
  });

  it('renders markdown', async () => {
    await wrapper.setProps({
      dynamicMessage: '**Welcome!** This dynamic message is loaded and sanitized.',
    });

    // Verify that the dynamic message is rendered
    expect(wrapper.find('.welcome-message-dynamic').html()).toContain(
      '<strong>Welcome!</strong> This dynamic message is loaded and sanitized.'
    );
  });
});
