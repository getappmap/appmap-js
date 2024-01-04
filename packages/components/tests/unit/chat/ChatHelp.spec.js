import VChatHelp from '@/pages/Chat.vue';
import { mount } from '@vue/test-utils';
import { waitFor } from '../support/waitFor';

describe('pages/Chat.vue', () => {
  let question = 'How do I do the thing?';

  let aiClientBuilder = (vm, expectedQuestion, messages) => {
    return (callbacks) => {
      const inputPrompt = async (question, _options) => {
        expect(question).toBe(expectedQuestion);
        while (messages.length) {
          const message = messages.shift();
          const [methodName, ...args] = message;
          callbacks[methodName](...args);
          await vm().$nextTick();
        }
      };

      return {
        inputPrompt,
      };
    };
  };

  async function simulateInteraction(question, messages) {
    const wrapper = mount(VChatHelp, {
      propsData: {
        aiClientFn: aiClientBuilder(() => wrapper.vm, question, messages),
      },
    });

    await wrapper.vm.sendMessage(question);
    await wrapper.vm.$nextTick();

    return wrapper;
  }

  describe('when asked a question', () => {
    it('handles the callback messages', async () => {
      const wrapper = await simulateInteraction(question, [
        ['onAck', 'the-user-message-id', 'the-thread-id'],
        ['onToken', 'Begin by installing the AppMap agent', 'the-message-id'],
        ['onToken', ' then configure your project per the instructions', 'the-message-id'],
        ['onComplete'],
      ]);

      expect(wrapper.find('.status-unauthorized').exists()).toBe(false);
      expect(wrapper.find('.messages .message').exists()).toBe(true);
      expect(wrapper.find(`.messages`).text()).toContain('Begin by installing the AppMap agent');

      await waitFor(
        `.messages should contain " then configure your project per the instructions"`,
        () =>
          wrapper
            .find(`.messages`)
            .text()
            .includes(' then configure your project per the instructions')
      );

      expect(wrapper.find('.spinner-container').exists()).toBe(false);
    });
  });

  describe('error handling', () => {
    describe('401 code', () => {
      it('activates the login instructions', async () => {
        const wrapper = await simulateInteraction(question, [
          ['onError', { message: 'Unauthorized', code: 401 }],
        ]);

        expect(wrapper.find('.status-unauthorized').exists()).toBe(true);
        expect(wrapper.find('.messages .message').exists()).toBe(false);
        expect(wrapper.find('.messages [data-error="true"]').exists()).toBe(false);
        expect(wrapper.find('.spinner-container').exists()).toBe(false);
      });
    });

    describe('in the middle of a response', () => {
      it('prints the error message and hides the loading indicator', async () => {
        const wrapper = await simulateInteraction(question, [
          ['onAck', 'the-message-id', 'the-thread-id'],
          ['onToken', 'Begin by installing the AppMap agent', 'the-message-id'],
          ['onError', { message: 'Server error', code: 500 }],
        ]);

        expect(wrapper.find('.status-unauthorized').exists()).toBe(false);
        expect(wrapper.find('.messages .message').exists()).toBe(true);
        expect(wrapper.find(`.messages`).text()).toContain('Begin by installing the AppMap agent');

        // NOTE: Ideally this would have different formatting than a regular server message.
        await waitFor(`.messages should contain "Server error"`, () =>
          wrapper.find(`.messages`).text().includes('Server error')
        );

        expect(wrapper.find('.spinner-container').exists()).toBe(false);
      });
    });
  });
});
