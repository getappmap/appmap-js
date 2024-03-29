import VChatSearch from '@/pages/ChatSearch.vue';
import { mount, createWrapper } from '@vue/test-utils';
import appmapData from '../fixtures/user_page_scenario.appmap.json';

describe('pages/ChatSearch.vue', () => {
  const chatSearchWrapper = (messagesCalled) => {
    const extraPropsData = messagesCalled.propsData || {};
    delete messagesCalled.propsData;

    return mount(VChatSearch, {
      propsData: {
        ...extraPropsData,
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
      [
        {
          name: 'project',
          packages: ['a', 'b', 'c'],
          classes: ['d', 'e', 'f'],
          routes: ['g', 'h', 'i'],
          tables: ['j', 'k', 'l'],
          numAppMaps: 100,
        },
      ],
    ],
  ];

  const appmapStatsNoAppMaps = () => [
    [
      null,
      null,
      [
        {
          numAppMaps: 0,
        },
      ],
    ],
  ];

  it('can be resized', async () => {
    const wrapper = chatSearchWrapper({
      'v2.appmap.stats': appmapStatsHasAppMaps(),
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

  describe('when opened with a target Appmap', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = chatSearchWrapper({
        'v2.appmap.stats': appmapStatsNoAppMaps(),
        propsData: {
          targetAppmapData: appmapData,
          targetAppmapFsPath: 'test',
        },
      });
    });

    it('shows the target Appmap without ask navie buttons', async () => {
      expect(wrapper.find('[data-cy="appmap"]').exists()).toBe(true);

      expect(wrapper.find('[data-cy="ask-navie-control-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-cy="collapsed-sidebar-ask-navie"]').exists()).toBe(false);

      // Open the details panel
      wrapper.find('[data-cy="sidebar-hamburger-menu-icon');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-cy="details-panel-ask-navie-button"]').exists()).toBe(false);
    });

    it('changes the placeholder text', () => {
      const placeholder = wrapper.find('[data-cy="chat-input"]').attributes('placeholder');
      expect(placeholder).toBe('What do you want to know about this AppMap?');
    });

    it('does not show the status bar', () => {
      expect(wrapper.find('[data-cy="status-bar"]').exists()).toBe(false);
    });

    it('has a button to switch the context to the full workspace', async () => {
      const fullWorkspaceContextButton = wrapper.find('[data-cy="full-workspace-context-button"]');
      expect(fullWorkspaceContextButton.exists()).toBe(true);
      fullWorkspaceContextButton.trigger('click');
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-cy="appmap"]').exists()).toBe(false);
      expect(wrapper.find('[data-cy="status-bar"]').exists()).toBe(true);
      const placeholder = wrapper.find('[data-cy="chat-input"]').attributes('placeholder');
      expect(placeholder).toBe('How can I help?');
    });
  });

  describe('when no AppMaps are available', () => {
    it('shows a warning that no AppMaps are available', async () => {
      const wrapper = chatSearchWrapper({
        'v2.appmap.stats': appmapStatsNoAppMaps(),
      });
      await wrapper.vm.$nextTick();
      wrapper.find('[data-cy="status-bar-header"]').trigger('click');
      expect(wrapper.find('[data-cy="status-no-data"]').exists()).toBe(true);
    });

    it('emits an event when the user clicks the "Create some" button', async () => {
      const wrapper = chatSearchWrapper({
        'v2.appmap.stats': appmapStatsNoAppMaps(),
      });
      await wrapper.vm.$nextTick();

      const createSomeButton = wrapper.find('[data-cy="record-guide"]');
      expect(createSomeButton.exists()).toBe(true);

      await createSomeButton.trigger('click');
      const rootWrapper = createWrapper(wrapper.vm.$root);
      expect(rootWrapper.emitted()['open-record-instructions']).toEqual([[]]);
    });

    it("shows Navie's context", async () => {
      const wrapper = chatSearchWrapper({
        'v2.appmap.stats': appmapStatsNoAppMaps(),
      });
      await wrapper.vm.$nextTick();

      wrapper.find('[data-cy="status-bar-header"]').trigger('click');
      expect(wrapper.findAll('[data-cy="fail-icon"]').length).toBe(3);
    });
  });

  describe('when AppMaps are available', () => {
    it('shows instructions', async () => {
      const wrapper = chatSearchWrapper({
        'v2.appmap.stats': appmapStatsHasAppMaps(),
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.instructions [data-cy="no-appmaps"]').exists()).toBe(false);
    });

    it("shows Navie's context", async () => {
      const wrapper = chatSearchWrapper({
        'v2.appmap.stats': appmapStatsHasAppMaps(),
      });
      await wrapper.vm.$nextTick();

      wrapper.find('[data-cy="status-bar-header"]').trigger('click');
      expect(wrapper.findAll('[data-cy="success-icon"]').length).toBe(3);
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
          'v2.appmap.stats': appmapStatsHasAppMaps(),
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

      it('only renders the search status once', async () => {
        const { wrapper } = await performSearch();

        expect(wrapper.findAll('[data-cy="tool-status"]').length).toBe(1);

        wrapper.vm.sendMessage('How do I reset my password?');
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('[data-cy="tool-status"]').length).toBe(1);
      });

      it('emits an event when the user clicks the "Create more" button', async () => {
        const { wrapper } = await performSearch();

        await wrapper.vm.$nextTick();

        const createMoreButton = wrapper.find('[data-cy="create-more-appmaps-btn"]');
        expect(createMoreButton.exists()).toBe(true);

        await createMoreButton.trigger('click');
        const rootWrapper = createWrapper(wrapper.vm.$root);
        expect(rootWrapper.emitted()['open-record-instructions']).toEqual([[]]);
      });
    });

    describe('but no AppMaps match the question', () => {
      const buildComponent = () => {
        const emptySearchResponse = {
          results: [],
        };

        const messagesCalled = {
          'v2.appmap.stats': appmapStatsHasAppMaps(),
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

      it('states that no matches were found', async () => {
        const { wrapper } = await performSearch();

        expect(wrapper.find('[data-cy="tool-status"]').text()).toContain(
          'Found 0 relevant AppMaps'
        );
      });

      it('makes expected RPC calls', async () => {
        const { messagesCalled } = await performSearch();

        Object.values(messagesCalled).forEach((calls) => {
          // Callbacks are consumed on use, so we expect the array to be empty
          expect(calls).toBeArrayOfSize(0);
        });
      });

      it('retains the thread id', async () => {
        const { wrapper } = await performSearch();

        expect(wrapper.vm.$refs.vchat.threadId).toEqual(threadId);
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
        'v2.appmap.stats': appmapStatsHasAppMaps(),
        explain: [[null, null, { userMessageId, threadId }]],
        'explain.status': [
          [null, null, { step: 'complete', searchResponse: { results: [{ events: [] }] } }],
        ],
      });

      const messageSent = wrapper.vm.sendMessage('How do I reset my password?');

      await wrapper.vm.$nextTick();
      expect(wrapper.find(title).text()).toBe('Analyzing your project');
      expect(wrapper.find(status).text()).toBe('');

      await messageSent;
      expect(wrapper.find(title).text()).toBe('Project analysis complete');
      expect(wrapper.find(status).text()).toBe('Found 1 relevant AppMap');
    });
  });

  describe('code selections', () => {
    it('passes code selections to the chat', () => {
      const wrapper = mount(VChatSearch, { propsData: { appmapRpcFn: jest.fn() } });
      const codeSelection = { code: 'Hello world' };

      expect(wrapper.vm.$refs.vchat.codeSelections).toBeArrayOfSize(0);

      wrapper.vm.includeCodeSelection(codeSelection);

      expect(wrapper.vm.$refs.vchat.codeSelections).toBeArrayOfSize(1);
    });
  });

  describe('reactiveness', () => {
    it('does not display stats until they are available', async () => {
      jest.useFakeTimers();

      const delay = 1000;
      const wrapper = mount(VChatSearch, {
        propsData: {
          appmapRpcFn: (method, __, callback) => {
            expect(method).toBe('v2.appmap.stats');
            const [args] = appmapStatsHasAppMaps();
            setTimeout(() => callback(...args), delay);
          },
        },
      });

      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-cy="status-bar"]').exists()).toBe(false);

      jest.advanceTimersByTime(delay + 1);
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-cy="status-bar"]').exists()).toBe(true);
    });

    it('reloads stats as most recent AppMaps are updated', async () => {
      jest.useFakeTimers();

      const [first] = appmapStatsNoAppMaps();
      const [second] = appmapStatsHasAppMaps();
      const wrapper = chatSearchWrapper({
        'v2.appmap.stats': [first, second],
        propsData: {
          appmapYmlPresent: true,
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-cy="status-no-data"]').exists()).toBe(true);

      wrapper.setProps({
        mostRecentAppMaps: [
          {
            name: 'appmap1',
            path: 'path1',
            createdAt: new Date(2020, 0, 1).toUTCString(),
            recordingMethod: 'tests',
          },
        ],
      });

      await wrapper.vm.$nextTick();

      // The stats request should have been debounced - it'll still say no data
      expect(wrapper.find('[data-cy="status-no-data"]').exists()).toBe(true);

      jest.advanceTimersByTime(1100);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-cy="status-no-data"]').exists()).toBe(false);
    });
  });

  describe('error handling', () => {
    async function simulateError(err, error) {
      const wrapper = chatSearchWrapper({
        'v2.appmap.stats': appmapStatsHasAppMaps(),
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
