import { mount } from '@vue/test-utils';
import VWelcomeMessageV2 from '@/components/chat/WelcomeMessageV2.vue';

describe('VWelcomeMessageV2', () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    wrapper = mount(VWelcomeMessageV2, {
      propsData: {
        welcomeMessage: '',
        activityName: '',
        suggestions: [],
      },
    });
  });

  it('renders static message by default', () => {
    expect(wrapper.text()).toContain("Hi, I'm Navie");
    expect(wrapper.find('.welcome-message-dynamic-placeholder').exists()).toBe(true);
  });

  it('renders activity-based message when activityName is provided', async () => {
    await wrapper.setProps({
      activityName: 'coding',
      suggestions: ['Review your code', 'Check for updates'],
    });

    expect(wrapper.text()).toContain("I see you're working on coding.");
    expect(wrapper.findAll('li').length).toBe(2);
  });
});
