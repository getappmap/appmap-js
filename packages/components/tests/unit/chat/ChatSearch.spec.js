import VChatSearch from '@/pages/ChatSearch.vue';
import { mount } from '@vue/test-utils';
import { randomUUID } from 'crypto';
import EventEmitter from 'events';
import { threadId } from 'worker_threads';

describe('pages/ChatSearch.vue', () => {
  let rpcClient;
  let wrapper;
  let threadListener;
  const activeThreadId = '00000000-0000-0000-0000-000000000000';

  beforeEach(async () => {
    threadListener = new EventEmitter();
    rpcClient = {
      listMethods: jest.fn().mockResolvedValue(['v1.navie.suggest', 'v1.navie.metadata']),
      appmapStats: jest.fn().mockResolvedValue(),
      appmapData: jest.fn().mockResolvedValue(),
      appmapMetadata: jest.fn().mockResolvedValue(),
      configuration: jest.fn().mockResolvedValue({ projectDirectories: [] }),
      register: jest.fn().mockResolvedValue({
        thread: {
          id: activeThreadId,
          permissions: { useNavieAIProxy: true },
          usage: { conversationCounts: [] },
          subscription: { subscriptions: [] },
        },
      }),
      explain: jest.fn().mockResolvedValue(),
      update: jest.fn().mockResolvedValue(),
      metadataV1: jest.fn().mockResolvedValue({
        welcomeMessage: `Welcome to Navie!`,
        inputPlaceholder: 'Type something',
        commands: [
          {
            name: '@example',
            description: 'An example command',
          },
        ],
      }),
      metadataV2: jest.fn().mockResolvedValue(),
      welcome: jest.fn().mockResolvedValue(),
      suggest: jest.fn().mockResolvedValue(),
      loadThread: jest.fn().mockResolvedValue(),
      listModels: jest.fn().mockResolvedValue([
        { id: 'gpt-3.5-turbo', provider: 'OpenAI', name: 'GPT-3.5 Turbo', createdAt: 0 },
        { id: 'gpt-4', provider: 'OpenAI', name: 'GPT-4', createdAt: 0 },
      ]),
      selectModel: jest.fn().mockResolvedValue(),
      getModelConfig: jest.fn().mockResolvedValue([{ provider: 'openai', apiKey: '********' }]),
      thread: {
        subscribe: jest.fn().mockResolvedValue(threadListener),
        pinItem: jest.fn().mockResolvedValue(),
        unpinItem: jest.fn().mockResolvedValue(),
        addMessageAttachment: jest.fn().mockResolvedValue(),
        removeMessageAttachment: jest.fn().mockResolvedValue(),
        sendMessage: jest.fn().mockResolvedValue(),
        stopCompletion: jest.fn().mockResolvedValue(true),
      },
    };
    wrapper = mount(VChatSearch, { data: () => ({ rpcClient }) });
    await wrapper.setData({ rpcClient, activeThreadId });
  });

  // It now takes a couple of event loops to get into a finalized state. This event will be
  // most reliable.
  const waitForInitialized = (wrapper) =>
    new Promise((resolve) => wrapper.vm.$root.$on('chat-search-loaded', resolve));

  afterEach(jest.clearAllMocks);

  const contextItems = [
    {
      directory: '/home/db/dev/applandinc/appmap-js',
      location: 'application_trace.appmap.json',
      type: 'sequence-diagram',
      content: "here's a sequence diagram",
      score: 2.8273219036392425,
    },
    {
      directory: '/home/db/dev/applandinc/appmap-js',
      type: 'code-snippet',
      location:
        'packages/navie/src/services/message-token-reducer-service/token-count-strategies/estimate-token-count.ts:1-10',
      content: "here's a code snippet",
      score: 0.563,
    },
  ];
  const searchEvents = [
    {
      type: 'begin-context-search',
      id: '64d0662f-7862-457f-8c15-4c2865e0c111',
      contextType: 'context', // TODO: This isn't actually included in real data for search results
      request: {
        version: 2,
        type: 'search',
        vectorTerms: ['count', 'ten', 'ruby'],
        tokenCount: 5361,
        labels: [{ name: 'chatting', weight: 'high' }],
        exclude: ['urn:uuid:2bec941a-ea8e-4b71-920f-4aa44af9aa12'],
      },
      time: 1743624802673,
    },
    {
      type: 'complete-context-search',
      id: '64d0662f-7862-457f-8c15-4c2865e0c111',
      result: contextItems,
      time: 1743624802674,
    },
  ];

  // Sends events directly to the event handler. Returns a promise to the next tick
  // if the UI is expected to be updated as a result.
  const emitEvents = (events) => {
    events.forEach((event) => wrapper.vm.onReceiveEvent(event));
    return wrapper.vm.$nextTick();
  };

  const performContextSearch = ({ type = 'context', result = contextItems } = {}) => {
    const id = randomUUID();
    const time = new Date().valueOf();
    return emitEvents([
      { ...searchEvents[0], id, time, contextType: type },
      { ...searchEvents[1], id, time: time + 1, result },
    ]);
  };

  const sendUserMessage = (message = 'hello world') =>
    emitEvents([
      {
        type: 'message',
        role: 'user',
        messageId: randomUUID(),
        content: message,
        time: new Date().valueOf(),
      },
    ]);

  const emitAssistantTokens = ({ tokens = ['hello world'], messageId = randomUUID() } = {}) =>
    emitEvents(
      tokens.map((token) => ({
        type: 'token',
        role: 'assistant',
        messageId,
        tokens,
        time: new Date().valueOf(),
      }))
    );

  const emitError = (error) => emitEvents([{ type: 'error', error, time: new Date().valueOf() }]);

  it('renders context items', async () => {
    performContextSearch();
    await wrapper.vm.$nextTick();

    const contextItems = wrapper.findAll('[data-cy="context-item"]');
    expect(contextItems.length).toBe(2);
    expect(contextItems.at(0).text()).toContain('application trace');
    expect(contextItems.at(1).text()).toContain('estimate-token-count.ts:1-10');
  });

  it('clears context items when a new message is sent', async () => {
    await performContextSearch();

    expect(wrapper.findAll('[data-cy="context-item"]').length).toBe(2);
    expect(wrapper.find('[data-cy="context-notice"]').exists()).toBe(false);

    await sendUserMessage();

    expect(wrapper.findAll('[data-cy="context-item"]').length).toBe(0);
    expect(wrapper.find('[data-cy="context-notice"]').exists()).toBe(true);
  });

  it('de-duplicates context items by location and type', async () => {
    await performContextSearch({ result: [...contextItems, ...contextItems] });

    expect(wrapper.findAll('[data-cy="context-item"]').length).toBe(2);
  });

  it('can be resized', async () => {
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

  it('provides a displaySubscription feature flag via prop', async () => {
    for (const displaySubscription of [true, false]) {
      // `provide` is not reactive unless the value provided is observed.
      // Just remount the component to test the prop.
      const wrapper = mount(VChatSearch, {
        propsData: { displaySubscription },
        data: () => ({ rpcClient }),
      });
      // eslint-disable-next-line no-underscore-dangle
      expect(wrapper.vm._provided.displaySubscription).toBe(displaySubscription);
    }
  });

  it('renders search status', async () => {
    expect(wrapper.find('[data-cy="tool-status"]').exists()).toBe(false);

    await performContextSearch({ type: 'project-info' });

    expect(wrapper.findAll('[data-cy="tool-status"]').length).toBe(1);

    await performContextSearch({ type: 'context' });

    expect(wrapper.findAll('[data-cy="tool-status"]').length).toBe(2);
  });

  it('renders pending search status', async () => {
    expect(wrapper.find('[data-cy="tool-status"]').exists()).toBe(false);

    await emitEvents([searchEvents[0]]);

    expect(wrapper.find('[data-cy="tool-status"]').exists()).toBe(true);
    expect(wrapper.find('[data-cy="tool-status"]').text()).toContain(
      'Searching for relevant content'
    );

    await emitEvents([searchEvents[1]]);

    expect(wrapper.find('[data-cy="tool-status"]').exists()).toBe(true);
    expect(wrapper.find('[data-cy="tool-status"]').text()).toContain('Complete');
  });

  it('calls expected RPC methods upon initialization', async () => {
    await waitForInitialized(wrapper);

    const collectNumberOfCalls = (mockObject) => {
      return Object.entries(mockObject).reduce((acc, [method, fn]) => {
        if (typeof fn === 'object' && fn !== null) {
          acc[method] = collectNumberOfCalls(fn);
        } else if (typeof fn === 'function' && fn.mock) {
          acc[method] = fn.mock.calls.length;
        }
        return acc;
      }, {});
    };

    expect(collectNumberOfCalls(rpcClient)).toStrictEqual({
      client: expect.anything(),
      listMethods: 1,
      configuration: 1,
      register: 1,
      metadataV1: 1,
      listModels: 1,
      getModelConfig: 1,
      appmapStats: 0,
      appmapData: 0,
      appmapMetadata: 0,
      metadataV2: 0,
      explain: 0,
      welcome: 0,
      suggest: 0,
      loadThread: 0,
      selectModel: 0,
      update: 0,
      thread: {
        subscribe: 1,
        pinItem: 0,
        unpinItem: 0,
        addMessageAttachment: 0,
        removeMessageAttachment: 0,
        sendMessage: 0,
        stopCompletion: 0,
      },
    });
  });

  it('loads a parameterized thread on initialization', async () => {
    const threadId = '00000000-0000-0000-0000-000000000001';
    await wrapper.setProps({ threadId });
    expect(rpcClient.thread.subscribe).toHaveBeenCalledWith(threadId, undefined);
  });

  it('replays a thread if the replay prop is true', async () => {
    const threadId = '00000000-0000-0000-0000-000000000001';
    await wrapper.setProps({ threadId, replay: true });
    expect(rpcClient.thread.subscribe).toHaveBeenCalledWith(threadId, true);
  });

  describe('code selections', () => {
    beforeEach(() => {
      rpcClient.thread.addMessageAttachment.mockImplementation((threadId, uri, content) =>
        emitEvents([{ type: 'add-message-attachment', uri, content, time: new Date().valueOf() }])
      );
    });
    it('passes code selections with no path to the chat', () => {
      const codeSelection = { code: 'Hello world' };

      expect(wrapper.vm.$refs.vchat.messageAttachments).toBeArrayOfSize(0);

      wrapper.vm.includeCodeSelection(codeSelection);
      expect(rpcClient.thread.addMessageAttachment).toHaveBeenCalledWith(
        activeThreadId,
        expect.stringMatching(/urn:uuid:[\d-]*/),
        codeSelection.code
      );

      expect(wrapper.vm.$refs.vchat.messageAttachments).toBeArrayOfSize(1);
    });

    it('passes code selections with a path to the chat', () => {
      const codeSelection = { path: 'foo/bar.js', code: 'Hello world' };
      expect(wrapper.vm.$refs.vchat.messageAttachments).toBeArrayOfSize(0);

      wrapper.vm.includeCodeSelection(codeSelection);
      expect(rpcClient.thread.addMessageAttachment).toHaveBeenCalledWith(
        activeThreadId,
        'file:foo/bar.js',
        codeSelection.code
      );
    });

    it('passes code selections with a path and range to the chat', () => {
      const codeSelection = {
        path: 'C:\\Users\\user\\Documents\\foo\\bar.js',
        code: 'Hello world',
        lineStart: 1,
        lineEnd: 24,
      };

      expect(wrapper.vm.$refs.vchat.messageAttachments).toBeArrayOfSize(0);
      wrapper.vm.includeCodeSelection(codeSelection);
      expect(rpcClient.thread.addMessageAttachment).toHaveBeenCalledWith(
        activeThreadId,
        'file://C:\\Users\\user\\Documents\\foo\\bar.js#L1-L24',
        codeSelection.code
      );
      expect(wrapper.vm.$refs.vchat.messageAttachments).toBeArrayOfSize(1);
    });
  });

  describe('error handling', () => {
    describe('401 code', () => {
      it('activates the login instructions', async () => {
        await emitError({ code: 401 });

        expect(wrapper.find('.status-unauthorized').exists()).toBe(true);
        expect(wrapper.find('.messages .message').exists()).toBe(false);
        expect(wrapper.find('.messages [data-error="true"]').exists()).toBe(false);
      });
    });
    describe('500 code', () => {
      it('prints the error message', async () => {
        const message = 'An unexpected error occurred';
        await emitError({ code: 500, message });

        expect(wrapper.find('.status-unauthorized').exists()).toBe(false);
        expect(wrapper.find(`.messages [data-cy="message-text"]`).text()).toContain(message);
        expect(wrapper.find('.messages [data-error="true"]').exists()).toBe(true);
      });
      it('does not display a search status', async () => {
        await emitEvents([searchEvents[0]]);

        expect(wrapper.find('[data-cy="tool-status"]').exists()).toBe(true);

        await emitError({ code: 500, message: 'An unexpected error occurred' });

        expect(wrapper.find('.messages [data-error="true"]').exists()).toBe(true);
        expect(wrapper.find('[data-cy="tool-status"]').exists()).toBe(false);
      });
      it('only contains a single error message', async () => {
        await emitError({ code: 500, message: 'An unexpected error occurred' });
        expect(wrapper.findAll('.messages [data-cy="message"]').length).toBe(1);
      });
    });
    describe('uncoded error', () => {
      it('prints the error message', async () => {
        const message = 'An unexpected error occurred';
        await emitError({ message });

        expect(wrapper.find('.status-unauthorized').exists()).toBe(false);
        expect(wrapper.find(`.messages [data-cy="message-text"]`).text()).toContain(message);
        expect(wrapper.find('.messages [data-error="true"]').exists()).toBe(true);
      });
    });
    describe('string as error', () => {
      it('prints the error message', async () => {
        const message = 'An unexpected error occurred';
        await emitError(message);

        expect(wrapper.find('.status-unauthorized').exists()).toBe(false);
        expect(wrapper.find(`.messages [data-cy="message-text"]`).text()).toContain(message);
        expect(wrapper.find('.messages [data-error="true"]').exists()).toBe(true);
      });
    });
    describe('error as error', () => {
      it('prints the error message', async () => {
        const message = 'An unexpected error occurred';
        await emitError(new Error(message));

        expect(wrapper.find('.status-unauthorized').exists()).toBe(false);
        expect(wrapper.find(`.messages [data-cy="message-text"]`).text()).toContain(message);
        expect(wrapper.find('.messages [data-error="true"]').exists()).toBe(true);
      });
    });
  });

  describe('stop behavior', () => {
    it('should not be applicable after error event', async () => {
      expect(wrapper.find('button[data-cy="stop-response"]').exists()).toBe(false);

      await emitAssistantTokens();
      expect(wrapper.find('button[data-cy="stop-response"]').exists()).toBe(true);

      await emitError('oops');
      expect(wrapper.find('button[data-cy="stop-response"]').exists()).toBe(false);
    });

    it('should call stopCompletion when ChatInput emits stop event', async () => {
      await emitAssistantTokens();

      wrapper.find('button[data-cy="stop-response"]').trigger('click');

      expect(rpcClient.thread.stopCompletion).toHaveBeenCalled();
    });
  });

  it('correctly handles pinned items', async () => {
    const codeBlockUri = 'urn:uuid:2bec941a-ea8e-4b71-920f-4aa44af9aa12';
    const time = new Date().valueOf();
    const content = '```ruby\n(1..10).each do |number|\n  puts number\nend\n```';
    await emitEvents([
      {
        type: 'token',
        token: content,
        messageId: 'c9c6ac67-7669-4156-b9e8-0a91bae886c6',
        codeBlockUri,
        time,
      },
    ]);

    await wrapper
      .find('[data-uri="urn:uuid:2bec941a-ea8e-4b71-920f-4aa44af9aa12"] [data-cy="pin"]')
      .trigger('click');

    expect(rpcClient.thread.pinItem).toHaveBeenCalledWith(activeThreadId, codeBlockUri, content);

    await emitEvents([{ type: 'pin-item', uri: codeBlockUri, time: time + 1 }]);
    expect(wrapper.find('[data-uri][data-reference]').exists()).toBe(true);
  });

  describe('metadata', () => {
    beforeEach(() => {
      document.getSelection = jest.fn().mockReturnValue({ focusOffset: 1 });
    });

    it('renders the metadata', async () => {
      await wrapper.vm.loadStaticMessages();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-cy="welcome-message"]').text()).toBe('Welcome to Navie!');
      expect(wrapper.find(`[data-cy="chat-input"][placeholder="Type something"]`).exists()).toBe(
        true
      );

      const input = wrapper.findComponent(`.chat-input`);
      await input.setData({ input: '@' });

      expect(wrapper.find('[data-cy="autocomplete"]').exists()).toBe(true);
      expect(wrapper.findAll('[data-cy="autocomplete-item"]').length).toBe(1);
    });
  });

  it('renders default metadata when no metadata is available', async () => {
    await wrapper.setData({ commands: undefined, inputPlaceholder: undefined });
    expect(wrapper.find('[data-cy="chat-input"]').attributes('placeholder')).toBe(
      'What are you working on today?'
    );

    const input = wrapper.findComponent(`.chat-input`);
    await input.setData({ input: '@' });

    expect(wrapper.find('[data-cy="autocomplete"]').exists()).toBe(false);
  });

  describe('welcome message versioning', () => {
    it('falls back to v1 if v2 is not available', async () => {
      await waitForInitialized(wrapper);

      expect(rpcClient.metadataV1).toHaveBeenCalled();
      expect(rpcClient.metadataV2).not.toHaveBeenCalled();
      expect(wrapper.find('[data-cy="welcome-message"]').attributes('data-version')).toBe('1');
    });

    it('renders v2 if v2 is available', async () => {
      const activity = 'working on a new feature';
      const suggestions = ['Suggestion 1', 'Suggestion 2'];
      rpcClient.metadataV2.mockResolvedValue({ inputPlaceholder: 'Type something', commands: [] });
      rpcClient.welcome.mockResolvedValue({ activity, suggestions });
      await wrapper.setData({ isWelcomeV2Available: true });
      await wrapper.vm.loadDynamicWelcomeMessages();

      const welcomeMessage = wrapper.find('[data-cy="welcome-message"]');
      expect(welcomeMessage.attributes('data-version')).toBe('2');
      expect(welcomeMessage.text()).toContain(activity);
      expect(welcomeMessage.text()).toContain(suggestions[0]);
      expect(welcomeMessage.text()).toContain(suggestions[1]);
    });
  });
});
