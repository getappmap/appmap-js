import { mount } from '@vue/test-utils';
import SubscriptionStatus from '@/components/chat-search/SubscriptionStatus.vue';

describe('components/SubscriptionStatus.vue', () => {
  it('shows loading state', () => {
    const wrapper = mount(SubscriptionStatus, {
      propsData: { subscription: undefined },
    });
    expect(wrapper.find('[data-cy="plan-status-loading"]').exists()).toBe(true);
  });

  it('shows not subscribed state', () => {
    const wrapper = mount(SubscriptionStatus, {
      propsData: { subscription: { subscriptions: [] } },
    });
    expect(wrapper.find('[data-cy="plan-status-free"]').text()).toContain('Limited free plan');
    expect(wrapper.find('[data-cy="plan-status-free"] a').text()).toStrictEqual('Subscribe now');
  });

  it('shows subscribed state when enrolled', () => {
    const wrapper = mount(SubscriptionStatus, {
      propsData: {
        subscription: {
          subscriptions: [{ productName: 'AppMap Pro' }],
        },
      },
    });
    expect(wrapper.find('[data-cy="plan-status-pro"]').text()).toContain('AppMap Pro');
    expect(wrapper.find('[data-cy="plan-status-pro"] a').text()).toStrictEqual(
      'Manage Subscription'
    );
  });

  it('includes the email in the subscribe url', () => {
    const wrapper = mount(SubscriptionStatus, {
      propsData: {
        subscription: {
          subscriptions: [{ productName: 'AppMap Pro' }],
        },
        email: 'test@example.com',
      },
    });
    expect(wrapper.find('[data-cy="plan-status-pro"] a').attributes('href')).toStrictEqual(
      'https://getappmap.com/?email=test%40example.com'
    );
  });

  it('omits the email in the subscribe url when not provided', () => {
    const wrapper = mount(SubscriptionStatus, {
      propsData: {
        subscription: {
          subscriptions: [{ productName: 'AppMap Pro' }],
        },
      },
    });
    expect(wrapper.find('[data-cy="plan-status-pro"] a').attributes('href')).toStrictEqual(
      'https://getappmap.com'
    );
  });
});
