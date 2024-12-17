import { mount } from '@vue/test-utils';
import SubscriptionStatus from '@/components/chat-search/SubscriptionStatus.vue';

describe('components/SubscriptionStatus.vue', () => {
  it('renders loading state', () => {
    const wrapper = mount(SubscriptionStatus, {
      propsData: { subscription: null },
    });
    expect(wrapper.find('.loading').exists()).toBe(true);
    expect(wrapper.find('.subscription-status p').text()).toBe('Loading...');
  });

  it('shows not subscribed state', () => {
    const wrapper = mount(SubscriptionStatus, {
      propsData: {
        subscription: { subscriptions: [] },
        usage: {
          conversationCounts: [],
        },
      },
    });
    expect(wrapper.find('.not-subscribed').exists()).toBe(true);
    expect(wrapper.find('.subscription-link a').text()).toContain('Subscribe now');
  });

  it('shows subscribed state when enrolled', () => {
    const wrapper = mount(SubscriptionStatus, {
      propsData: {
        subscription: {
          subscriptions: [
            {
              productName: 'AppMap Pro',
            },
          ],
        },
        usage: {},
      },
    });
    expect(wrapper.find('.subscribed').exists()).toBe(true);
    expect(wrapper.find('.subscribed').text()).toBe("You're subscribed");

    // It doesn't show the product name right now
    expect(wrapper.find('.subscription-status').text()).not.toContain('AppMap Pro');
  });

  it('shows correct usage and limit', () => {
    const wrapper = mount(SubscriptionStatus, {
      propsData: {
        subscription: { subscriptions: [] },
        usage: {
          conversationCounts: [{ daysAgo: 7, count: 3 }],
        },
      },
    });
    expect(wrapper.find('.not-subscribed span').text()).toContain(
      'The free plan includes 7 chats per week.'
    );
    expect(wrapper.find('.subscription-status').text()).toContain("You've used 3.");
  });

  it('applies the correct class when usage is over the limit', () => {
    const wrapper = mount(SubscriptionStatus, {
      propsData: {
        subscription: { subscriptions: [] },
        usage: {
          conversationCounts: [{ daysAgo: 7, count: 10 }],
        },
      },
    });
    expect(wrapper.find('.usage-over').exists()).toBe(true);
    expect(wrapper.find('.usage-over').text()).toContain("You've used 10.");
  });
});
