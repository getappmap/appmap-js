import VChatInput from '@/components/chat/ChatInput.vue';
import { mount } from '@vue/test-utils';

describe('ChatInput', () => {
  let caretPosition = undefined;

  beforeEach(() => {
    document.getSelection = jest.fn().mockImplementation(() => ({ focusOffset: caretPosition }));
  });

  afterEach(() => {
    caretPosition = undefined;
    jest.resetAllMocks();
  });

  it('opens an autocomplete when "@" is typed', async () => {
    const wrapper = mount(VChatInput);

    expect(wrapper.find('[data-cy="autocomplete"]').exists()).toBe(false);

    caretPosition = 1;
    await wrapper.setData({ input: '@' });

    expect(wrapper.find('[data-cy="autocomplete"]').isVisible()).toBe(true);
  });

  it('emits a send event if the user is not typing a command', async () => {
    const wrapper = mount(VChatInput);

    await wrapper.setData({ input: 'hello' });
    wrapper.vm.send();

    expect(wrapper.emitted('send')).toStrictEqual([['hello']]);
  });

  it('does not emit a send event when the user is typing a command', async () => {
    const wrapper = mount(VChatInput);

    caretPosition = 1;
    await wrapper.setData({ input: '@' });
    wrapper.vm.send();

    expect(wrapper.emitted('send')).toBeUndefined();
  });
});
