import { shallowMount, mount } from '@vue/test-utils';
import AiHelp from '@/components/install-guide/AiHelp.vue';
import QuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import eventBus from '@/lib/eventBus';

describe('AI Help', () => {
  it('emits the `ai-help` root event from the ask AI button', async () => {
    const wrapper = shallowMount(AiHelp);
    const spy = jest.fn();
    eventBus.on('ai-help', spy);

    await wrapper.find('[data-cy="ai-help-primary"]').trigger('click');

    expect(spy).toHaveBeenCalled();
    eventBus.off('ai-help', spy);
  });

  it('emits the `ai-help` root event from Quickstart layout', async () => {
    const wrapper = shallowMount(QuickstartLayout, {
      global: { provide: { displayAiHelp: true } },
    });
    const spy = jest.fn();
    eventBus.on('ai-help', spy);

    await wrapper.find('[data-cy="ai-help-secondary"]').trigger('click');

    expect(spy).toHaveBeenCalled();
    eventBus.off('ai-help', spy);
  });

  it('only displays the AI help buttons when the AI help feature is enabled', () => {
    const wrapper = mount(QuickstartLayout, {
      global: { provide: { displayAiHelp: true } },
    });
    expect(wrapper.find('[data-cy="ai-help-primary"]').exists()).toBe(true);
    expect(wrapper.find('[data-cy="ai-help-secondary"]').exists()).toBe(true);
  });

  it('does not display the AI help buttons when the AI help feature is disabled', () => {
    const wrapper = mount(QuickstartLayout, {
      global: { provide: { displayAiHelp: false } },
    });
    expect(wrapper.find('[data-cy="ai-help-primary"]').exists()).toBe(false);
    expect(wrapper.find('[data-cy="ai-help-secondary"]').exists()).toBe(false);
  });

  it('does not display the AI help buttons by default', () => {
    const wrapper = mount(QuickstartLayout);
    expect(wrapper.find('[data-cy="ai-help-primary"]').exists()).toBe(false);
    expect(wrapper.find('[data-cy="ai-help-secondary"]').exists()).toBe(false);
  });
});
