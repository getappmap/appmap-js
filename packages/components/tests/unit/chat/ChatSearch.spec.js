import VChatSearch from '@/pages/ChatSearch.vue';
import { mount } from '@vue/test-utils';

describe('pages/ChatSearch.vue', () => {
  const chatSearchWrapper = (messagesCalled) => {
    return mount(VChatSearch, {
      propsData: {
        appmapRpcFn: rpcFunction(messagesCalled),
      },
    });
  };

  const rpcFunction = (messages) => {
    const availableMethods = Object.keys(messages);
    return (method, _, callback) => {
      if (!availableMethods.includes(method)) throw new Error(`Unknown method ${method}`);
      const response = messages[method].shift();
      if (!response) throw new Error(`No responses are left for ${method}`);
      callback(...response);
    };
  };

  const threadId = 'the-thread-id';
  const userMessageId = 'the-user-message-id';

  const appmapStatsHasAppMaps = () => [
    [
      null,
      null,
      {
        packages: ['a', 'b', 'c'],
        classes: ['d', 'e', 'f'],
        routes: ['g', 'h', 'i'],
        tables: ['j', 'k', 'l'],
        numAppMaps: 100,
      },
    ],
  ];

  const appmapStatsNoAppMaps = () => [
    [
      null,
      null,
      {
        numAppMaps: 0,
      },
    ],
  ];
  it('can be resized', async () => {
    const wrapper = chatSearchWrapper({
      'appmap.stats': appmapStatsHasAppMaps(),
    });

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

  describe('when no AppMaps are available', () => {
    it('shows a warning that no AppMaps are available', async () => {
      const wrapper = chatSearchWrapper({
        'appmap.stats': appmapStatsNoAppMaps(),
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.instructions [data-cy="no-appmaps"]').exists()).toBe(true);
    });
  });

  describe('when AppMaps are available', () => {
    it('shows instructions', async () => {
      const wrapper = chatSearchWrapper({
        'appmap.stats': appmapStatsHasAppMaps(),
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.instructions [data-cy="no-appmaps"]').exists()).toBe(false);
    });

    describe('and there are matching AppMaps', () => {
      const buildComponent = () => {
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
          'appmap.stats': appmapStatsHasAppMaps(),
          explain: [[null, null, { userMessageId, threadId }]],
          'explain.status': [
            [null, null, { step: 'build-vector-terms' }],
            [
              null,
              null,
              {
                step: 'explain',
                searchResponse,
              },
            ],
            [
              null,
              null,
              {
                step: 'complete',
                searchResponse,
                explanation: ['Contact IT'],
              },
            ],
          ],
          'appmap.metadata': [[null, null, {}]],
          'appmap.data': [[null, null, '{}']],
        };
        const wrapper = chatSearchWrapper(messagesCalled);
        return { messagesCalled, wrapper };
      };

      const performSearch = async () => {
        const { messagesCalled, wrapper } = buildComponent();

        await wrapper.vm.sendMessage('How do I reset my password?');
        await wrapper.vm.$nextTick();

        return { messagesCalled, wrapper };
      };

      it('makes expected RPC calls', async () => {
        const { messagesCalled } = await performSearch();

        Object.values(messagesCalled).forEach((calls) => {
          // Callbacks are consumed on use, so we expect the array to be empty
          expect(calls).toBeArrayOfSize(0);
        });
      });

      it('retains the thread id', async () => {
        const { wrapper } = await performSearch();

        expect(wrapper.vm.$refs.vchat.threadId).toBe('the-thread-id');
      });

      it('shows the "match" instructions', async () => {
        const { wrapper } = await performSearch();

        expect(wrapper.find('[data-cy="match-instructions"]').exists()).toBe(true);
        expect(wrapper.find('[data-cy="no-match-instructions"]').exists()).toBe(false);
      });
    });

    describe('but no AppMaps match the question', () => {
      const buildComponent = () => {
        const emptySearchResponse = {
          results: [],
        };

        const messagesCalled = {
          'appmap.stats': appmapStatsHasAppMaps(),
          explain: [[null, null, { userMessageId, threadId }]],
          'explain.status': [
            [null, null, { step: 'build-vector-terms' }],
            [
              null,
              null,
              {
                step: 'explain',
                searchResponse: emptySearchResponse,
              },
            ],
            [
              null,
              null,
              {
                step: 'complete',
                searchResponse: emptySearchResponse,
                explanation: ['Contact IT'],
              },
            ],
          ],
        };
        const wrapper = chatSearchWrapper(messagesCalled);
        return { messagesCalled, wrapper };
      };

      const performSearch = async () => {
        const { messagesCalled, wrapper } = buildComponent();

        await wrapper.vm.sendMessage('How do I reset my password?');
        await wrapper.vm.$nextTick();

        return { messagesCalled, wrapper };
      };

      it('makes expected RPC calls', async () => {
        const { messagesCalled } = await performSearch();

        Object.values(messagesCalled).forEach((calls) => {
          // Callbacks are consumed on use, so we expect the array to be empty
          expect(calls).toBeArrayOfSize(0);
        });
      });

      it('clears the thread id', async () => {
        const { wrapper } = await performSearch();

        expect(wrapper.vm.$refs.vchat.threadId).toBeUndefined();
      });

      it('shows the "no match" instructions', async () => {
        const { wrapper } = await performSearch();

        expect(wrapper.find('[data-cy="match-instructions"]').exists()).toBe(false);
        expect(wrapper.find('[data-cy="no-match-instructions"]').exists()).toBe(true);
      });
    });

    it('renders the search status', async () => {
      const title = '[data-cy="tool-status"] [data-cy="title"]';
      const status = '[data-cy="tool-status"] [data-cy="status"]';
      const wrapper = chatSearchWrapper({
        'appmap.data': [[null, null, '{}']],
        'appmap.metadata': [[null, null, {}]],
        'appmap.stats': appmapStatsHasAppMaps(),
        explain: [[null, null, { userMessageId, threadId }]],
        'explain.status': [
          [null, null, { step: 'complete', searchResponse: { results: [{ events: [] }] } }],
        ],
      });

      const messageSent = wrapper.vm.sendMessage('How do I reset my password?');

      await wrapper.vm.$nextTick();
      expect(wrapper.find(title).text()).toBe('Searching for AppMaps');
      expect(wrapper.find(status).text()).toBe('');

      await messageSent;
      expect(wrapper.find(title).text()).toBe('Searched for AppMaps');
      expect(wrapper.find(status).text()).toBe('Found 1 relevant recording');
    });
  });

  describe('error handling', () => {
    async function simulateError(err, error) {
      const wrapper = chatSearchWrapper({
        'appmap.stats': appmapStatsHasAppMaps(),
        explain: [[err, error]],
      });

      await wrapper.vm.sendMessage('How do I reset my password?');
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
      it('does not display a search status', async () => {
        const wrapper = await simulateError(undefined, {
          code: 500,
          message: 'An unexpected error occurred',
        });

        expect(wrapper.find('.messages [data-error="true"]').exists()).toBe(true);
        expect(wrapper.find('[data-cy="tool-status"]').exists()).toBe(false);
      });
      it('only contains a single error message', async () => {
        const wrapper = await simulateError(undefined, {
          code: 500,
          message: 'An unexpected error occurred',
        });
        expect(wrapper.findAll('.messages [data-cy="message"]').length).toBe(1);
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
