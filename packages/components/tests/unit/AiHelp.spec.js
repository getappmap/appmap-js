import { shallowMount, mount, createWrapper } from '@vue/test-utils';
import AiHelp from '@/components/install-guide/AiHelp.vue';
import QuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';

describe('AI Help', () => {
  it('emits the `ai-help` root event from the ask AI button', () => {
    const wrapper = shallowMount(AiHelp);
    const root = createWrapper(wrapper.vm.$root);

    wrapper.find('[data-cy="ai-help-primary"]').trigger('click');

    const events = root.emitted()['ai-help'];
    expect(events).toHaveLength(1);
  });

  it('emits the `ai-help` root event from Quickstart layout', () => {
    const wrapper = shallowMount(QuickstartLayout, { provide: { displayAiHelp: true } });
    const root = createWrapper(wrapper.vm.$root);

    wrapper.find('[data-cy="ai-help-secondary"]').trigger('click');

    const events = root.emitted()['ai-help'];
    expect(events).toHaveLength(1);
  });

  it('only displays the AI help buttons when the AI help feature is enabled', () => {
    const wrapper = mount(QuickstartLayout, { provide: { displayAiHelp: true } });
    expect(wrapper.find('[data-cy="ai-help-primary"]').exists()).toBe(true);
    expect(wrapper.find('[data-cy="ai-help-secondary"]').exists()).toBe(true);
  });

  it('does not display the AI help buttons when the AI help feature is disabled', () => {
    const wrapper = mount(QuickstartLayout, { provide: { displayAiHelp: false } });
    expect(wrapper.find('[data-cy="ai-help-primary"]').exists()).toBe(false);
    expect(wrapper.find('[data-cy="ai-help-secondary"]').exists()).toBe(false);
  });

  it('does not display the AI help buttons by default', () => {
    const wrapper = mount(QuickstartLayout);
    expect(wrapper.find('[data-cy="ai-help-primary"]').exists()).toBe(false);
    expect(wrapper.find('[data-cy="ai-help-secondary"]').exists()).toBe(false);
  });
});
