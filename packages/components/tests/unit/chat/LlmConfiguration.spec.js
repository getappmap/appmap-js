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
    expect(wrapper.findAll('[data-cy="llm-modal-option"]').length).toBe(2);
    expect(wrapper.find('[data-cy="llm-modal-option"][data-option="default"]').exists()).toBe(
      false
    );
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

    expect(wrapper.findAll('[data-cy="llm-modal-option"]').length).toBe(3);
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
});
