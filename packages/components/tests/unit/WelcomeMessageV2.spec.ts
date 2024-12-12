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

  it('renders a loading state when all props are empty', async () => {
    expect(wrapper.find('[data-cy="loading"]').exists()).toBe(true);
  });

  it('renders `message` when provided', async () => {
    const welcomeMessage = 'hello world';
    await wrapper.setProps({ welcomeMessage });

    expect(wrapper.text()).toContain("Hi, I'm Navie");
    expect(wrapper.text()).toContain(welcomeMessage);
    expect(wrapper.find('[data-cy="loading"]').exists()).toBe(false);
  });

  it('renders activity-based message when activityName is provided', async () => {
    await wrapper.setProps({
      activityName: 'coding',
      suggestions: ['Review your code', 'Check for updates'],
    });

    expect(wrapper.text()).toContain("I see you're working on coding.");
    expect(wrapper.findAll('li').length).toBe(2);
    expect(wrapper.find('[data-cy="loading"]').exists()).toBe(false);
  });
});
