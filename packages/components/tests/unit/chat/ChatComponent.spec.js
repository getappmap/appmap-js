import VChat from '@/components/chat/Chat.vue';
import { mount } from '@vue/test-utils';
import { AI } from '@appland/client';

describe('components/Chat.vue', () => {
  const threadId = 'the-thread-id';
  const messageId = 'the-message-id';

  describe('onAck', () => {
    it('persists a thread id', async () => {
      const wrapper = mount(VChat, {
        propsData: {
          sendMessage() {
            wrapper.vm.onAck(messageId, threadId);
          },
        },
      });

      await wrapper.vm.onSend('Hello from the user');

      expect(wrapper.vm.threadId).toBe(threadId);
    });
  });

  describe('addUserMessage', () => {
    it('scrolls to the bottom of the chat', async () => {
      let timesScrolled = 0;
      const wrapper = mount(VChat, {
        global: {
          stubs: {
            scrollToBottom: () => ++timesScrolled,
          },
        },
      });

      const spy = jest.spyOn(wrapper.find('[data-cy="messages"]').element, 'scrollTop', 'set');

      wrapper.vm.onAck('the-user-message-id', threadId);
      wrapper.vm.addUserMessage('Hello from the user');
      await wrapper.vm.$nextTick();

      expect(spy).toBeCalledTimes(1);
    });
  });

  describe('addToken', () => {
    it('updates the DOM', async () => {
      const wrapper = mount(VChat);
      const userMessage = 'Hello from the user';
      const systemMessage = 'Hello from the system';

      wrapper.vm.addUserMessage(userMessage);
      wrapper.vm.onAck('the-user-message-id', threadId);
      wrapper.vm.addToken(systemMessage, threadId, messageId);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-actor="user"] [data-cy="message-text"]').text()).toBe(userMessage);
      expect(wrapper.find('[data-actor="system"] [data-cy="message-text"]').text()).toBe(
        systemMessage
      );
    });

    it('updates the DOM on each tick', async () => {
      const wrapper = mount(VChat);
      const tokens = ['Hello ', 'from ', 'the ', 'system'];

      wrapper.vm.onAck('the-user-message-id', threadId);
      wrapper.vm.addToken('', threadId, messageId);

      await wrapper.vm.$nextTick();
      for (let i = 0; i < tokens.length; i++) {
        wrapper.vm.addToken(tokens[i], threadId, messageId);
        await wrapper.vm.$nextTick();
        expect(wrapper.find('[data-cy="message-text"]').text()).toBe(
          tokens
            .map((t) => t.trim())
            .slice(0, i + 1)
            .join(' ')
        );
      }
    });

    it('scrolls to the bottom of the chat', async () => {
      let timesScrolled = 0;
      const wrapper = mount(VChat, {
        global: {
          stubs: {
            scrollToBottom: () => ++timesScrolled,
          },
        },
      });

      const spy = jest.spyOn(wrapper.find('[data-cy="messages"]').element, 'scrollTop', 'set');
      const tokens = ['Hello ', 'from ', 'the ', 'system'];

      wrapper.vm.onAck('the-user-message-id', threadId);
      tokens.forEach((token) => wrapper.vm.addToken(token, threadId, messageId));

      await wrapper.vm.$nextTick();

      // Once on update
      // Once for each token
      expect(spy).toBeCalledTimes(tokens.length);
    });
  });

  describe('Clear ("New Chat")', () => {
    const newThreadId = 'new-thread-id';
    let wrapper;

    beforeEach(async () => {
      wrapper = mount(VChat, {
        propsData: {
          sendMessage: (_message) => {
            wrapper.vm.onAck('the-user-message-id', threadId);
          },
        },
      });

      wrapper.vm.onSend('Hello from the user');
      wrapper.vm.addToken('Hello from the system', threadId, messageId);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-actor="user"] [data-cy="message-text"]').exists()).toBe(true);
      expect(wrapper.find('[data-actor="system"] [data-cy="message-text"]').exists()).toBe(true);

      wrapper.vm.clear();
      await wrapper.vm.$nextTick();
    });

    it('removes the DOM elements', async () => {
      expect(wrapper.find('[data-actor="user"] [data-cy="message-text"]').exists()).toBe(false);
      expect(wrapper.find('[data-actor="system"] [data-cy="message-text"]').exists()).toBe(false);
    });

    it('clears the thread id', async () => {
      expect(wrapper.vm.threadId).toBeUndefined();
    });

    it('ignores subsequent messages on the old thread-id', async () => {
      wrapper.vm.onAck('new-user-message-id', newThreadId);
      wrapper.vm.addToken('Hello from the system', threadId, messageId);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-actor="user"] [data-cy="message-text"]').exists()).toBe(false);
      expect(wrapper.find('[data-actor="system"] [data-cy="message-text"]').exists()).toBe(false);
    });
  });

  describe('clicking a suggestion', () => {
    it('adds a fake message to the chat', async () => {
      const wrapper = mount(VChat);

      wrapper.find('[data-cy="prompt-suggestion"]').trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-actor="system"] [data-cy="message-text"]').exists()).toBe(true);
    });
  });

  describe('setAuthorized', () => {
    describe('(false)', () => {
      it('activates the login prompt', async () => {
        const wrapper = mount(VChat);

        wrapper.vm.setAuthorized(false);

        await wrapper.vm.$nextTick();

        expect(wrapper.find('.status-unauthorized').exists()).toBe(true);
      });
    });
  });

  describe('onSentimentChange', () => {
    it('calls the API as expected', async () => {
      const api = jest.spyOn(AI, 'sendMessageFeedback').mockResolvedValue({});
      const wrapper = mount(VChat);
      const messageId = 'the-message-id';
      const threadId = 'the-thread-id';

      wrapper.vm.onAck('Faking the thread ID', threadId);
      wrapper.vm.addToken('Hello from the system', 'the-thread-id', messageId);

      await wrapper.vm.$nextTick();

      wrapper.find('[data-cy="feedback-good"]').trigger('click');

      expect(api).toBeCalledWith(messageId, 1);
    });
  });

  describe('suggested prompts', () => {
    it('can emit the prompt as the user', async () => {
      const sendMessage = jest.fn();
      const prompt = 'the-prompt';
      const wrapper = mount(VChat, {
        propsData: {
          suggestionSpeaker: 'user',
          sendMessage,
          suggestions: [{ title: 'title', subtitle: 'subtitle', prompt }],
        },
      });
      wrapper.find('[data-cy="prompt-suggestion"]').trigger('click');

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-actor="user"] [data-cy="message-text"]').exists()).toBe(true);
      expect(sendMessage).toBeCalledWith(prompt);
    });

    it('can emit the prompt as the system', async () => {
      const wrapper = mount(VChat); // default is system
      wrapper.find('[data-cy="prompt-suggestion"]').trigger('click');

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-actor="system"] [data-cy="message-text"]').exists()).toBe(true);
    });
  });
});
