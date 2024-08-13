import VChatSearch from '@/pages/ChatSearch.vue';
import VChatInput from '@/components/chat/ChatInput.vue';
import { mount, createWrapper } from '@vue/test-utils';
import navieContext from '../../../src/stories/data/navie_context.json';

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

  const noConfig = () => [[null, null, { projectDirectories: [] }]];
  const emptySearchResponse = {
    results: [],
  };

  const buildComponent = (searchResponse, contextResponse, hasMetadata) => {
    const messagesCalled = {
      'v2.configuration.get': noConfig(),
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
            contextResponse,
          },
        ],
      ],
    };

    if (hasMetadata) messagesCalled['appmap.metadata'] = [[null, null, {}]];
    const wrapper = chatSearchWrapper(messagesCalled);
    return { messagesCalled, wrapper };
  };

  it('can change context', async () => {
    const wrapper = mount(VChatSearch, { propsData: { appmapRpcFn: jest.fn() } });
    expect(wrapper.find('[data-cy="context-notice"]').exists()).toBe(true);

    wrapper.vm.sendMessage('Hello world');
    const ask = wrapper.vm.ask;

    ask.emit('status', { contextResponse: [] });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-cy="context-notice"]').exists()).toBe(false);

    ask.emit('status', {
      contextResponse: [
        {
          directory: '/home/user/land-of-apps/sample_app_6th_ed',
          type: 'code-snippet',
          location: 'app/helpers/sessions_helper.rb:54',
          content:
            '# Logs out the current user.\n  def log_out\n    forget(current_user)\n    reset_session\n    @current_user = nil\n  end\n\n  # Stores the URL trying to be accessed.\n  def store_location\n    session[:forwarding_url] = request.original_url if request.get? || request.head?\n  end\nend',
          score: 5.563924544180424,
        },
      ],
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-cy="context-item"]').exists()).toBe(true);
  });

  it('can be resized', async () => {
    const wrapper = chatSearchWrapper({
      'v2.configuration.get': noConfig(),
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

  describe('when AppMaps are available', () => {
    describe('and there are matching AppMaps', () => {
      const searchResponse = {
        results: [
          {
            appmap: 'example.appmap.json',
            events: [],
            score: 1.0,
          },
        ],
      };

      const performSearch = async () => {
        const { messagesCalled, wrapper } = buildComponent(searchResponse, navieContext, true);

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

      it('only renders the search status once', async () => {
        const { wrapper } = await performSearch();

        expect(wrapper.findAll('[data-cy="tool-status"]').length).toBe(1);

        wrapper.vm.sendMessage('How do I reset my password?');
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('[data-cy="tool-status"]').length).toBe(1);
      });

      it('renders the context in the RHS', async () => {
        const { wrapper } = await performSearch();

        expect(wrapper.findAll('[data-cy="context-notice"]').length).toBe(0);
        expect(wrapper.findAll('[data-cy="context-item"]').length).toBe(navieContext.length);
      });

      it('renders the search status', async () => {
        const title = '[data-cy="tool-status"] [data-cy="title"]';
        const status = '[data-cy="tool-status"] [data-cy="status"]';
        const wrapper = chatSearchWrapper({
          'appmap.metadata': [[null, null, {}]],

          'v2.configuration.get': noConfig(),
          explain: [[null, null, { userMessageId, threadId }]],
          'explain.status': [
            [
              null,
              null,
              {
                step: 'complete',
                searchResponse: { results: [{ events: [] }] },
                contextResponse: navieContext,
              },
              ,
            ],
          ],
        });

        const messageSent = wrapper.vm.sendMessage('How do I reset my password?');

        await wrapper.vm.$nextTick();
        expect(wrapper.find(title).text()).toBe('Analyzing your project');
        expect(wrapper.find(status).text()).toBe('');

        await messageSent;
        expect(wrapper.find(title).text()).toBe('Project analysis complete');
        expect(wrapper.find(status).text()).toBe(
          'Found 2 sequence diagrams, 3 data requests, and 22 code snippets'
        );
      });
    });

    describe('but no context is found', () => {
      const performSearch = async () => {
        const { messagesCalled, wrapper } = buildComponent(emptySearchResponse);

        await wrapper.vm.sendMessage('How do I reset my password?');
        await wrapper.vm.$nextTick();

        return { messagesCalled, wrapper };
      };

      it('does not mention context', async () => {
        const { wrapper } = await performSearch();

        expect(wrapper.find('[data-cy="tool-status"]').text()).toBe('Project analysis complete');
      });

      it('shows the context notice', async () => {
        const { wrapper } = await performSearch();

        expect(wrapper.find('[data-cy="context-notice"]').text()).toContain(
          'When you ask Navie a question, this area will reflect the information'
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

  describe('llm configuration', () => {
    it('does not render until the configuration is available', async () => {
      const wrapper = chatSearchWrapper({
        'v2.configuration.get': noConfig(),
      });

      expect(wrapper.find('[data-cy="llm-config"]').exists()).toBe(false);

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-cy="llm-config"]').exists()).toBe(true);
    });

    it('renders a local configuration', async () => {
      const wrapper = chatSearchWrapper({
        'v2.configuration.get': [
          [
            null,
            null,
            { baseUrl: 'http://localhost:11434', model: 'mistral', projectDirectories: [] },
          ],
        ],
      });

      await wrapper.vm.$nextTick();

      const llmConfig = wrapper.find('[data-cy="llm-config"]');
      expect(llmConfig.exists()).toBe(true);
      expect(llmConfig.find('[data-cy="llm-model"]').text()).toBe('mistral');
      expect(llmConfig.find('[data-cy="llm-provider"]').text()).toBe('(via localhost)');
    });

    it('renders the default configuration', async () => {
      const wrapper = chatSearchWrapper({
        'v2.configuration.get': [[null, null, { projectDirectories: [] }]],
      });

      await wrapper.vm.$nextTick();

      const llmConfig = wrapper.find('[data-cy="llm-config"]');
      expect(llmConfig.exists()).toBe(true);
      expect(llmConfig.find('[data-cy="llm-model"]').text()).toBe('GPT-4o');
      expect(llmConfig.find('[data-cy="llm-provider"]').text()).toBe('(default)');
    });

    it('renders an azure configuration', async () => {
      const wrapper = chatSearchWrapper({
        'v2.configuration.get': [
          [
            null,
            null,
            {
              baseUrl: 'https://my-instance.openai.azure.com',
              model: 'my-deployment',
              projectDirectories: [],
            },
          ],
        ],
      });

      await wrapper.vm.$nextTick();

      const llmConfig = wrapper.find('[data-cy="llm-config"]');
      expect(llmConfig.exists()).toBe(true);
      expect(llmConfig.find('[data-cy="llm-model"]').text()).toBe('my-deployment');
      expect(llmConfig.find('[data-cy="llm-provider"]').text()).toBe('(via Azure OpenAI)');
    });

    it('renders an OpenAI configuration', async () => {
      const wrapper = chatSearchWrapper({
        'v2.configuration.get': [
          [
            null,
            null,
            {
              baseUrl: 'https://api.openai.com',
              model: 'gpt-4-turbo',
              projectDirectories: [],
            },
          ],
        ],
      });

      await wrapper.vm.$nextTick();

      const llmConfig = wrapper.find('[data-cy="llm-config"]');
      expect(llmConfig.exists()).toBe(true);
      expect(llmConfig.find('[data-cy="llm-model"]').text()).toBe('gpt-4-turbo');
      expect(llmConfig.find('[data-cy="llm-provider"]').text()).toBe('(via OpenAI)');
    });
  });

  describe('error handling', () => {
    async function simulateError(err, error) {
      const wrapper = chatSearchWrapper({
        'v2.configuration.get': noConfig(),
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

  describe('stop behavior', () => {
    it('should not be applicable after error event', async () => {
      const wrapper = mount(VChatSearch, { propsData: { appmapRpcFn: jest.fn() } });

      wrapper.vm.sendMessage('Hello');

      wrapper.vm.ask.emit('ack', 'the-message-id', 'the-thread-id');
      wrapper.vm.ask.emit('status', { contextResponse: [] });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('button[data-cy="stop-response"]').exists()).toBe(true);

      wrapper.vm.ask.emit('error', new Error('Test Error'));

      await wrapper.vm.$nextTick();
      expect(wrapper.find('button[data-cy="stop-response"]').exists()).toBe(false);
    });

    it('should call this.ask.stop when ChatInput emits stop event', async () => {
      const wrapper = mount(VChatSearch, { propsData: { appmapRpcFn: jest.fn() } });

      wrapper.setData({
        ask: {
          stop: jest.fn(),
        },
      });

      wrapper.findComponent({ name: 'v-chat-input' }).vm.$emit('stop');

      expect(wrapper.vm.ask.stop).toHaveBeenCalled();
    });

    it('should not allow another input while the stop button is active', async () => {
      const wrapper = mount(VChatSearch, { propsData: { appmapRpcFn: jest.fn() } });
      const chatInput = wrapper.findComponent(VChatInput);
      chatInput.setData({ input: 'Hello world' });
      chatInput.vm.send();

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-cy="stop-response"]').exists()).toBe(true);
      expect(chatInput.vm.input).toBe('');

      chatInput.setData({ input: 'Hello world again' });
      chatInput.vm.send();

      await wrapper.vm.$nextTick();

      expect(chatInput.find('[data-cy="stop-response"]').exists()).toBe(true);
      expect(chatInput.vm.input).toBe('Hello world again');
    });
  });

  it('correctly handles pinned items', async () => {
    const wrapper = mount(VChatSearch, {
      propsData: { appmapRpcFn: jest.fn() },
    });
    const systemMessage = wrapper.vm.$refs.vchat.addSystemMessage();
    systemMessage.content = `\`\`\`ruby\nputs "Hello world!"\n\`\`\``;
    await wrapper.vm.$nextTick();

    await wrapper.find('[data-cy="pin"]').trigger('click');
    await wrapper.setData({ contextResponse: [] });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-handle][data-reference]').exists()).toBe(true);
  });
});
