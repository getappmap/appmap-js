import LlmConfiguration from '@/components/chat-search/LlmConfiguration.vue';
import { mount, createWrapper } from '@vue/test-utils';

describe('components/LlmConfiguration.vue', () => {
  it('it renders a modal', async () => {
    const wrapper = mount(LlmConfiguration, {
      propsData: {},
    });

    wrapper.find('[data-cy="llm-config-button"]').trigger('click');

    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-cy="llm-config-modal"]').exists()).toBe(true);
    expect(wrapper.findAll('[data-cy="llm-modal-option"]').length).toBe(4);
  });

  it('shows the default option when using a custom model', async () => {
    const wrapper = mount(LlmConfiguration, {
      propsData: {
        model: 'mistral',
        baseUrl: 'http://localhost:11434',
      },
    });

    wrapper.find('[data-cy="llm-config-button"]').trigger('click');

    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('[data-cy="llm-modal-option"]').length).toBe(4);
    expect(wrapper.find('[data-cy="llm-modal-option"][data-option="default"]').exists()).toBe(true);
  });

  it('closes the modal when the escape key is pressed', async () => {
    const wrapper = mount(LlmConfiguration, {
      propsData: {},
    });

    wrapper.find('[data-cy="llm-config-button"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-cy="llm-config-modal"]').exists()).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-cy="llm-config-modal"]').exists()).toBe(false);
  });

  it('disables the default option if it is selected', async () => {
    const wrapper = mount(LlmConfiguration);

    wrapper.find('[data-cy="llm-config-button"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(
      wrapper
        .find('[data-cy="llm-modal-option"][data-option="default"] [data-cy="llm-select"]')
        .attributes('disabled')
    ).toBe('disabled');
  });

  it('enables the default option if it is not selected', async () => {
    const wrapper = mount(LlmConfiguration, {
      propsData: {
        model: 'mistral',
        baseUrl: 'http://localhost:11434',
      },
    });

    wrapper.find('[data-cy="llm-config-button"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(
      wrapper
        .find('[data-cy="llm-modal-option"][data-option="default"] [data-cy="llm-select"]')
        .attributes('disabled')
    ).toBe(undefined);
  });

  it('shows the copilot option when selected', async () => {
    const wrapper = mount(LlmConfiguration, {
      propsData: {
        model: 'gpt-4o',
        baseUrl: 'http://localhost:11434/vscode/copilot',
      },
    });

    wrapper.find('[data-cy="copilot-notice"] [data-cy="llm-config-button"]').trigger('click');
    await wrapper.vm.$nextTick();

    const button = wrapper.find(
      '[data-cy="llm-modal-option"][data-option="copilot"] [data-cy="llm-select"]'
    );
    expect(button.exists()).toBe(true);
    expect(button.attributes('disabled')).toBe('disabled');
    expect(button.text()).toBe('Selected');
  });

  it('emits the expected events', async () => {
    const wrapper = mount(LlmConfiguration, {
      propsData: {
        model: 'mistral',
        baseUrl: 'http://localhost:11434',
      },
    });
    const rootWrapper = createWrapper(wrapper.vm.$root);

    async function selectOption(option) {
      wrapper.find('[data-cy="llm-config-button"]').trigger('click');
      await wrapper.vm.$nextTick();

      wrapper
        .find(`[data-cy="llm-modal-option"][data-option="${option}"] [data-cy="llm-select"]`)
        .trigger('click');

      const events = rootWrapper.emitted()['select-llm-option'];
      return events[events.length - 1][0];
    }

    expect(await selectOption('byom')).toEqual('own-model');
    expect(await selectOption('byok')).toEqual('own-key');
    expect(await selectOption('default')).toEqual('default');
    expect(await selectOption('copilot')).toEqual('copilot');
  });

  it('renders a loading state', async () => {
    const wrapper = mount(LlmConfiguration, {
      propsData: { isLoading: true },
    });

    expect(wrapper.find('[data-cy="loading"]').exists()).toBe(true);

    await wrapper.setProps({ isLoading: false });

    expect(wrapper.find('[data-cy="llm-config"]').exists()).toBe(false);
  });

  describe('subscription status', () => {
    describe('default', () => {
      it('is not displayed when displaySubscription feature flag is false', async () => {
        const wrapper = mount(LlmConfiguration, {
          propsData: {
            subscription: {},
          },
          provide: {
            displaySubscription: false,
          },
        });
        expect(wrapper.find('[data-cy="plan-status-free"]').exists()).toBeFalsy();
      });

      it('shows the free plan', async () => {
        const wrapper = mount(LlmConfiguration, {
          propsData: {
            subscription: {
              subscriptions: [],
            },
          },
        });
        expect(wrapper.find('[data-cy="plan-status-free"]').exists()).toBe(true);
      });

      it('shows the pro plan', async () => {
        const wrapper = mount(LlmConfiguration, {
          propsData: {
            subscription: {
              subscriptions: [{ productName: 'AppMap Pro' }],
            },
          },
        });
        expect(wrapper.find('[data-cy="plan-status-pro"]').exists()).toBe(true);
      });
    });

    describe('copilot', () => {
      it('is not displayed when displaySubscription feature flag is false', async () => {
        const wrapper = mount(LlmConfiguration, {
          propsData: {
            model: 'gpt-4o',
            baseUrl: 'http://localhost:11434/vscode/copilot',
            subscription: {
              subscriptions: [],
            },
          },
          provide: {
            displaySubscription: false,
          },
        });
        expect(wrapper.find('[data-cy="plan-status-free"]').exists()).toBeFalsy();
      });

      it('shows the free plan', async () => {
        const wrapper = mount(LlmConfiguration, {
          propsData: {
            model: 'gpt-4o',
            baseUrl: 'http://localhost:11434/vscode/copilot',
            subscription: {
              subscriptions: [],
            },
          },
        });
        expect(
          wrapper.find('[data-cy="copilot-notice"] [data-cy="plan-status-free"]').exists()
        ).toBe(true);
      });

      it('shows the pro plan', async () => {
        const wrapper = mount(LlmConfiguration, {
          propsData: {
            model: 'gpt-4o',
            baseUrl: 'http://localhost:11434/vscode/copilot',
            subscription: {
              subscriptions: [{ productName: 'AppMap Pro' }],
            },
          },
        });
        expect(
          wrapper.find('[data-cy="copilot-notice"] [data-cy="plan-status-pro"]').exists()
        ).toBe(true);
      });
    });
  });
});
