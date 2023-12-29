import VChat from '@/components/chat/Chat.vue';
import { createWrapper, mount } from '@vue/test-utils';

describe('components/Chat.vue', () => {
  describe('addMessage', () => {
    it('updates the DOM', async () => {
      const wrapper = mount(VChat);
      const userMessage = 'Hello from the user';
      const systemMessage = 'Hello from the system';

      wrapper.vm.addMessage(true, userMessage);
      wrapper.vm.addMessage(false, systemMessage);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-actor="user"] [data-cy="message-text"]').text()).toBe(userMessage);
      expect(wrapper.find('[data-actor="system"] [data-cy="message-text"]').text()).toBe(
        systemMessage
      );
    });

    it('scrolls to the bottom of the chat when a new message is added', async () => {
      let timesScrolled = 0;
      const wrapper = mount(VChat, {
        global: {
          stubs: {
            scrollToBottom: () => ++timesScrolled,
          },
        },
      });

      const spy = jest.spyOn(wrapper.find('[data-cy="messages"]').element, 'scrollTop', 'set');

      wrapper.vm.addMessage(true, 'Hello from the user');
      await wrapper.vm.$nextTick();

      // Once on update
      // Once for the new message
      expect(spy).toBeCalledTimes(2);
    });
  });

  describe('addToken', () => {
    it('updates the DOM', async () => {
      const wrapper = mount(VChat);
      const tokens = ['Hello ', 'from ', 'the ', 'system'];
      const message = wrapper.vm.addMessage(false);

      await wrapper.vm.$nextTick();
      for (let i = 0; i < tokens.length; i++) {
        wrapper.vm.addToken(tokens[i], message.id);
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

      tokens.forEach((token) => wrapper.vm.addToken(token));

      await wrapper.vm.$nextTick();

      // Once on update
      // Once for each token
      // Once for the new message
      expect(spy).toBeCalledTimes(tokens.length + 2);
    });
  });

  describe('onAck', () => {
    it('persists a thread id', async () => {
      const userMessageId = 'the-user-message-id';
      const threadId = 'the-thread-id';
      const wrapper = mount(VChat, {
        propsData: {
          sendMessage() {
            wrapper.vm.onAck(userMessageId, threadId);
          },
        },
      });

      await wrapper.vm.onSend();

      expect(wrapper.vm.threadId).toBe(threadId);
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
});
