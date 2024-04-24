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

  describe('clicking a mode instruction', () => {
    let wrapper;

    beforeEach(() => {
      // mock the document.createRange function
      global.document.createRange = () => {
        return {
          selectNodeContents: () => {},
          collapse: () => {},
        };
      };

      // mock the window.getSelection function
      global.window.getSelection = () => {
        return {
          removeAllRanges: () => {},
          addRange: () => {},
        };
      };

      wrapper = mount(VChat);
    });

    it('adds the mode prefix to the chat', async () => {
      const chatInput = wrapper.find('[data-cy="chat-input"]');
      const modeInstructions = wrapper.findAll('[data-cy="mode-instruction"]');

      await modeInstructions.at(0).trigger('click');
      expect(chatInput.element.innerText).toBe('@explain ');

      await modeInstructions.at(1).trigger('click');
      expect(chatInput.element.innerText).toBe('@help ');

      await modeInstructions.at(2).trigger('click');
      expect(chatInput.element.innerText).toBe('@generate ');
    });

    it('adds the prefix to the current message', async () => {
      const question = 'Can I ask you a question?';
      const chatInput = wrapper.find('[data-cy="chat-input"]');
      chatInput.element.innerText = question;
      await chatInput.trigger('input');

      // sanity check
      expect(chatInput.element.innerText).toBe(question);

      const modeInstructions = wrapper.findAll('[data-cy="mode-instruction"]');
      await modeInstructions.at(0).trigger('click');
      expect(chatInput.element.innerText).toBe(`@explain ${question}`);

      await modeInstructions.at(1).trigger('click');
      expect(chatInput.element.innerText).toBe(`@help ${question}`);
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

  describe('code snippet attachments', () => {
    const codeSelection = {
      path: 'app/controllers/users_controller.rb',
      lineStart: 6,
      lineEnd: 17,
      code: '...',
    };

    it('are emitted in sendMessage', async () => {
      const sendMessage = jest.fn();
      const wrapper = mount(VChat, { propsData: { sendMessage } });

      wrapper.vm.includeCodeSelection(codeSelection);
      wrapper.vm.onSend('Hello from the user');

      await wrapper.vm.$nextTick();

      expect(sendMessage).toBeCalledWith('Hello from the user', [codeSelection.code], []);
    });

    it('includes pending code snippets in the input area', async () => {
      const wrapper = mount(VChat);
      const selector = '[data-cy="input-attachments"] [data-cy="code-selection"]';

      expect(wrapper.find(selector).exists()).toBe(false);

      wrapper.vm.includeCodeSelection(codeSelection);
      await wrapper.vm.$nextTick();

      expect(wrapper.find(selector).exists()).toBe(true);
    });

    it('flushes pending code snippets from the input area when the user sends a message', async () => {
      const wrapper = mount(VChat, { propsData: { sendMessage: jest.fn() } });
      const selector = '[data-cy="input-attachments"] [data-cy="code-selection"]';

      wrapper.vm.includeCodeSelection(codeSelection);
      await wrapper.vm.$nextTick();

      expect(wrapper.find(selector).exists()).toBe(true);

      wrapper.vm.onSend('Hello from the user');
      await wrapper.vm.$nextTick();

      expect(wrapper.find(selector).exists()).toBe(false);
    });

    it('pipes pending code snippets to the next user message', async () => {
      const wrapper = mount(VChat, { propsData: { sendMessage: jest.fn() } });
      wrapper.vm.includeCodeSelection(codeSelection);
      wrapper.vm.onSend('Hello from the user');

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.messages[0].codeSelections).toStrictEqual([codeSelection]);
      expect(
        wrapper.find('[data-cy="message"][data-actor="user"] [data-cy="code-selection"]').exists()
      ).toBe(true);
    });
  });
});
