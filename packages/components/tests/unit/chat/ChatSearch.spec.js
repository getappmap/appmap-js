import VChatSearch from '@/pages/ChatSearch.vue';
import { mount } from '@vue/test-utils';

describe('ChatSearch.vue', () => {
  it('can be resized', async () => {
    const wrapper = mount(VChatSearch);
    const lhsPanel = wrapper.find('[data-cy="resize-left"]');
    Object.defineProperty(lhsPanel.element, 'offsetWidth', { value: 300 });

    const resizeHandle = wrapper.find('[data-cy="resize-handle"]');
    const resizeBy = 100;

    resizeHandle.trigger('mousedown');
    resizeHandle.trigger('mousemove', { clientX: 0 });
    await wrapper.vm.$nextTick();
    const initialWidth = Number.parseInt(lhsPanel.element.style.width.replace('px', ''), 10);

    resizeHandle.trigger('mousemove', { clientX: resizeBy });
    await wrapper.vm.$nextTick();
    const newWidth = Number.parseInt(lhsPanel.element.style.width.replace('px', ''), 10);

    expect(newWidth).toBe(initialWidth + resizeBy);
  });

  describe('when asked a question', () => {
    let rpcFunction = (messages) => {
      return (method, _, callback) => messages[method].shift()(callback);
    };

    it('makes expected RPC calls', async () => {
      const searchResponse = {
        results: [
          {
            appmap: 'example.appmap.json',
            events: [],
            score: 1.0,
          },
        ],
      };
      const messagesCalled = {
        explain: [(cb) => cb(null, null, 'the-request-id')],
        'explain.status': [
          (cb) => cb(null, null, { step: 'build-vector-terms' }),
          (cb) =>
            cb(null, null, {
              step: 'explain',
              searchResponse,
            }),
          (cb) =>
            cb(null, null, {
              step: 'complete',
              searchResponse,
              explaination: 'Contact IT',
            }),
        ],
        'appmap.metadata': [(cb) => cb(null, null, {})],
        'appmap.data': [(cb) => cb(null, null, '{}')],
      };
      const wrapper = mount(VChatSearch, {
        propsData: {
          appmapRpcFn: rpcFunction(messagesCalled),
        },
      });

      await wrapper.vm.sendMessage('How do I reset my password?', () => {});
      await wrapper.vm.$nextTick();

      Object.values(messagesCalled).forEach((calls) => {
        // Callbacks are consumed on use, so we expect the array to be empty
        expect(calls).toBeArrayOfSize(0);
      });
    });

    describe('error handling', () => {
      async function simulateError(err, error) {
        const messagesCalled = {
          explain: [(cb) => cb(err, error)],
        };

        const wrapper = mount(VChatSearch, {
          propsData: {
            appmapRpcFn: rpcFunction(messagesCalled),
          },
        });

        await wrapper.vm.sendMessage('How do I reset my password?', () => {});
        await wrapper.vm.$nextTick();

        return wrapper;
      }

      describe('401 code', () => {
        it('activates the login instructions', async () => {
          const wrapper = await simulateError(undefined, { code: 401, message: 'Unauthorized' });
          expect(wrapper.find('.status-unauthorized').exists()).toBe(true);
          expect(wrapper.find('.messages .message').exists()).toBe(false);
          expect(wrapper.find('.messages [data-error="true"]').exists()).toBe(false);
        });
      });
      describe('500 code', () => {
        it('prints the error message', async () => {
          const message = 'An unexpected error occurred';
          const wrapper = await simulateError(undefined, {
            code: 500,
            message,
          });
          expect(wrapper.find('.status-unauthorized').exists()).toBe(false);
          expect(wrapper.find(`.messages [data-cy="message-text"]`).text()).toContain(message);
          expect(wrapper.find('.messages [data-error="true"]').exists()).toBe(true);
        });
      });
      describe('uncoded error', () => {
        it('prints the error message', async () => {
          const message = 'An unexpected error occurred';
          const wrapper = await simulateError(undefined, {
            message,
          });
          expect(wrapper.find('.status-unauthorized').exists()).toBe(false);
          expect(wrapper.find(`.messages [data-cy="message-text"]`).text()).toContain(message);
          expect(wrapper.find('.messages [data-error="true"]').exists()).toBe(true);
        });
      });
      describe('malformed coded error', () => {
        it('prints the error message', async () => {
          const message = 'An unexpected error occurred';
          const wrapper = await simulateError(undefined, message);
          expect(wrapper.find('.status-unauthorized').exists()).toBe(false);
          expect(wrapper.find(`.messages [data-cy="message-text"]`).text()).toContain(message);
          expect(wrapper.find('.messages [data-error="true"]').exists()).toBe(true);
        });
      });
      describe('unstructured error', () => {
        it('prints the error message', async () => {
          const message = 'An unexpected error occurred';
          const wrapper = await simulateError(message);
          expect(wrapper.find('.status-unauthorized').exists()).toBe(false);
          expect(wrapper.find(`.messages [data-cy="message-text"]`).text()).toContain(message);
          expect(wrapper.find('.messages [data-error="true"]').exists()).toBe(true);
        });
      });
    });
  });
});
