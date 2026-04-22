import VNextPromptButton from '@/components/chat/NextPromptButton.vue';
import { mount } from '@vue/test-utils';
import eventBus from '@/lib/eventBus';

describe('components/VNextPromptButton.vue', () => {
  const propsData = {
    command: '@explain',
    prompt: 'What does this do?',
  };
  const slot = (text) => ({ slots: { default: [text] } });

  it('uses the slot as a label', () => {
    const label = 'Explain this';
    const wrapper = mount(VNextPromptButton, { props: propsData, ...slot(label) });
    expect(wrapper.text()).toBe(label);
  });

  it('emits an event when clicked', async () => {
    const wrapper = mount(VNextPromptButton, { props: propsData });
    const spy = jest.fn();
    eventBus.on('change-input', spy);
    await wrapper.trigger('click');
    expect(spy).toHaveBeenCalled();
    eventBus.off('change-input', spy);
  });

  it('emits an event when shift clicked', async () => {
    const wrapper = mount(VNextPromptButton, { props: propsData });
    const spy = jest.fn();
    eventBus.on('submit-prompt', spy);
    await wrapper.trigger('click', { shiftKey: true });
    expect(spy).toHaveBeenCalled();
    eventBus.off('submit-prompt', spy);
  });

  it('formats the prompt if it starts with a command verb', () => {
    const wrapper = mount(VNextPromptButton, {
      props: { command: 'explain', prompt: 'Explain this' },
    });
    expect(wrapper.vm.formattedPrompt).toBe('@explain this');
  });

  it('does not format the prompt if it does not start with a command verb', () => {
    const wrapper = mount(VNextPromptButton, {
      props: { command: 'explain', prompt: 'Can you explain this?' },
    });
    expect(wrapper.vm.formattedPrompt).toBe('@explain Can you explain this?');
  });
});
