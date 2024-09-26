import VNextPromptButton from '@/components/chat/NextPromptButton.vue';
import { createWrapper, mount } from '@vue/test-utils';

describe('components/VNextPromptButton.vue', () => {
  const propsData = {
    command: '@explain',
    prompt: 'What does this do?',
  };
  const slot = (text) => ({ slots: { default: [text] } });

  it('uses the slot as a label', () => {
    const label = 'Explain this';
    const wrapper = mount(VNextPromptButton, { propsData, ...slot(label) });
    expect(wrapper.text()).toBe(label);
  });

  it('emits an event when clicked', async () => {
    const wrapper = mount(VNextPromptButton, { propsData });
    const rootWrapper = createWrapper(wrapper.vm.$root);
    await wrapper.trigger('click');
    expect(rootWrapper.emitted('change-input')).toBeTruthy();
  });

  it('emits an event when shift clicked', async () => {
    const wrapper = mount(VNextPromptButton, { propsData });
    const rootWrapper = createWrapper(wrapper.vm.$root);
    await wrapper.trigger('click', { shiftKey: true });
    expect(rootWrapper.emitted('submit-prompt')).toBeTruthy();
  });

  it('formats the prompt if it starts with a command verb', () => {
    const wrapper = mount(VNextPromptButton, {
      propsData: { command: 'explain', prompt: 'Explain this' },
    });
    expect(wrapper.vm.formattedPrompt).toBe('@explain this');
  });

  it('does not format the prompt if it does not start with a command verb', () => {
    const wrapper = mount(VNextPromptButton, {
      propsData: { command: 'explain', prompt: 'Can you explain this?' },
    });
    expect(wrapper.vm.formattedPrompt).toBe('@explain Can you explain this?');
  });
});
