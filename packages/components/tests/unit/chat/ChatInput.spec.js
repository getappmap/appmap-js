import VChatInput from '@/components/chat/ChatInput.vue';
import { mount } from '@vue/test-utils';

describe('ChatInput', () => {
  let caretPosition = undefined;
  let wrapper;

  beforeEach(() => {
    document.getSelection = jest.fn().mockImplementation(() => ({ focusOffset: caretPosition }));
    wrapper = mount(VChatInput, {
      propsData: {
        metadata: {
          commands: [
            {
              name: '@example',
              description: 'An example command',
            },
          ],
        },
      },
    });
  });

  afterEach(() => {
    caretPosition = undefined;
    jest.resetAllMocks();
  });

  it('opens an autocomplete when "@" is typed', async () => {
    expect(wrapper.find('[data-cy="autocomplete"]').exists()).toBe(false);

    caretPosition = 1;
    await wrapper.setData({ input: '@' });

    expect(wrapper.find('[data-cy="autocomplete"]').isVisible()).toBe(true);
  });

  it('emits a send event if the user is not typing a command', async () => {
    await wrapper.setData({ input: 'hello' });
    wrapper.vm.send();

    expect(wrapper.emitted('send')).toStrictEqual([['hello']]);
  });

  it('does not emit a send event when the user is typing a command', async () => {
    caretPosition = 1;
    await wrapper.setData({ input: '@' });
    wrapper.vm.send();

    expect(wrapper.emitted('send')).toBeUndefined();
  });
});
