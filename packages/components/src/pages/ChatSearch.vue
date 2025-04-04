<template>
  <div
    class="chat-search-container"
    @mousemove="makeResizing"
    @mouseup="stopResizing"
    @mouseleave="stopResizing"
    @drop="onDrop"
    @dragover.prevent
    data-cy="chat-search"
  >
    <div class="chat-container" data-cy="resize-left" ref="chatContainer">
      <v-chat
        class="chat-search-chat"
        ref="vchat"
        :open-new-chat="openNewChat"
        :send-message="sendMessage"
        :status-label="searchStatusLabel"
        :question="question"
        :input-placeholder="inputPlaceholder"
        :commands="commands"
        :is-input-disabled="isNavieLoading || !activeThreadId"
        :use-animation="useAnimation"
        :usage="usage"
        :subscription="subscription"
        :email="email"
        :selected-model="selectedModel"
        :thread-id="activeThreadId"
        @isChatting="setIsChatting"
        @stop="onStop"
      >
        <v-model-selector
          :models="models"
          :selected-model="selectedModel"
          @select="onModelSelect"
          :model-configs="modelConfigs"
        />

        <template #not-chatting>
          <div class="message-box__footer">
            <v-welcome-message-v2
              v-if="isWelcomeV2Available"
              :welcomeMessage="welcomeMessage"
              :activityName="activityName"
              :suggestions="suggestedQuestions"
            />
            <v-welcome-message-v1 v-else :dynamicMessage="welcomeMessage" />
          </div>
        </template>
      </v-chat>
    </div>
    <div
      class="chat-search-container--drag"
      data-cy="resize-handle"
      @mousedown="startResizing"
    ></div>
    <div class="search-wrapper">
      <div class="search-header">
        <h1>Navie's Context Sources</h1>
        <v-popper class="info-help" ref="infoPopper" placement="none">
          <div class="info">
            <InfoIcon />
          </div>
          <template #content>
            <p>The Context Window displays data sources that Navie is using to inform responses.</p>
            <p>
              <strong>Pinned Items</strong> - specific content that you select to refine AI
              responses.
            </p>
            <p>
              <strong>Selected by Navie</strong> - code, files, and data relevant to the issue you
              are working on that Navie has discovered in your environment. You can give Navie more
              to work with by creating AppMap data specific to code you are working on.
            </p>
          </template>
        </v-popper>
      </div>
      <div class="pinned-items-wrapper">
        <div class="search-subheader">
          <h2>
            Pinned Items
            <span class="pinned-item__count">{{ pinnedItemCount }}</span>
          </h2>
          <v-add-file-button
            v-if="hasPinnedItems || showAddFilesWhenEmpty"
            @click.native="addFiles"
          />
        </div>
        <div class="search-container">
          <v-pinned-items
            class="no-match-instructions"
            :pinned-items="pinnedItems"
            :editor-type="editorType"
          />
        </div>
      </div>
      <div class="context-wrapper">
        <h2>Selected by Navie</h2>
        <div class="search-container">
          <v-context
            class="no-match-instructions"
            :appmap-stats="appmapStats"
            :context-response="contextResponse"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VAddFileButton from '@/components/AddFileButton.vue';
import VPopper from '@/components/Popper.vue';
import VContext from '@/components/chat-search/Context.vue';
import VPinnedItems from '@/components/chat-search/PinnedItems.vue';
import type { ITool } from '@/components/chat/Chat.vue';
import type { CodeSelection } from '@/components/chat/CodeSelection';
import VChat from '@/components/chat/Chat.vue';
import { getNextHandle } from '@/components/chat/Handle';
import type { PinEvent, PinFile } from '@/components/chat/PinEvent';
import VWelcomeMessageV1 from '@/components/chat/WelcomeMessageV1.vue';
import VWelcomeMessageV2 from '@/components/chat/WelcomeMessageV2.vue';
import authenticatedClient from '@/components/mixins/authenticatedClient';
import AppMapRPC from '@/lib/AppMapRPC';
import { PinFileRequest } from '@/lib/PinFileRequest';
import debounce from '@/lib/debounce';
import InfoIcon from '../assets/info.svg';
import VModelSelector from '@/components/chat-search/ModelSelector.vue';
import { NavieRpc, URI } from '@appland/rpc';
import { pinnedItemRegistry } from '@/lib/pinnedItems';

export default {
  name: 'v-chat-search',
  components: {
    InfoIcon,
    VAddFileButton,
    VChat,
    VContext,
    VPinnedItems,
    VPopper,
    VWelcomeMessageV1,
    VWelcomeMessageV2,
    VModelSelector,
  },
  mixins: [authenticatedClient],
  props: {
    openNewChat: {
      type: Function,
    },
    question: {
      type: String,
    },
    appmapRpcPort: {
      type: Number,
    },
    // Provide a custom search function, e.g. for mocking
    appmapRpcFn: {
      type: Function,
    },
    appmaps: {
      type: Array,
      default: () => [],
    },
    targetAppmapData: {
      type: Object,
    },
    targetAppmapFsPath: {
      type: String,
    },
    appmapYmlPresent: Boolean,
    disableLlmConfig: {
      type: Boolean,
      default: false,
    },
    useAnimation: {
      type: Boolean,
      default: true,
    },
    editorType: {
      type: String,
      default: 'vscode',
      validator: (value) => ['vscode', 'intellij'].indexOf(value) !== -1,
    },
    threadId: {
      type: String as PropType<string | undefined>,
      default: undefined,
      required: false,
    },
    replay: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
      required: false,
    },
    // See `initializeModels` for details
    preselectedModelId: {
      type: String,
      default: undefined,
    },
    presubmittedPrompt: {
      type: String,
      default: undefined,
    },
    displaySubscription: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      searchResponse: undefined,
      searching: false,
      searchStatus: undefined,
      searchId: 0,
      selectedSearchResultId: undefined,
      isPanelResizing: false,
      initialPanelWidth: 0,
      initialClientX: 0,
      searchStatusLabel: undefined,
      appmapStats: undefined,
      searchStatusLabels: {
        'build-vector-terms': 'Optimizing search terms',
        'search-appmaps': 'Searching AppMaps',
        'collect-context': 'Collecting context',
        'expand-context': 'Expanding context',
        'build-prompt': 'Building prompt',
        explain: 'Explaining with AI',
      },
      isChatting: false,
      loadAppMapStats: debounce(
        async () => {
          try {
            this.appmapStats = await this.rpcClient.appmapStats();
          } catch (e) {
            console.error('Error loading appmap stats', e);
          }
        },
        () => {
          // 1000ms or 5ms per appmap, whichever is greater
          return Math.max(1000, (this.appmapStats?.numAppMaps ?? 0) * 5);
        }
      ),
      targetAppmap: this.targetAppmapData,
      configLoaded: false,
      baseUrl: undefined,
      model: undefined,
      models: [] as NavieRpc.V1.Models.ListModel[],
      contextItems: {},
      pinnedItems: [] as NavieRpc.V1.UserContext.ContextItem[],
      projectDirectories: [] as string[],
      rpcMethodsAvailable: undefined,
      inputPlaceholder: undefined,
      commands: undefined,
      welcomeMessage: undefined,
      activityName: undefined,
      suggestedQuestions: undefined,
      isWelcomeV2Available: false,
      registrationData: undefined,
      modelConfigs: undefined,
      selectedModel: undefined as undefined | NavieRpc.V1.Models.ListModel,
      activeThreadId: undefined,
      threadListener: undefined,
      rpcClient: new AppMapRPC(this.appmapRpcPort ?? 30101),
    };
  },
  provide() {
    return {
      pinnedItems: this.pinnedItems,
      rpcClient: this.rpcClient,
      projectDirectories: this.projectDirectories,
      displaySubscription: this.displaySubscription,
    };
  },
  watch: {
    searchResponse: async function (newVal) {
      if (!newVal) {
        this.selectedSearchResultId = undefined;
        return;
      }

      const searchResponse = newVal;

      let resultId = 0;
      for (const result of searchResponse.results) {
        const metadata = await this.rpcClient.appmapMetadata(result.appmap);
        (result as any).id = ['search-result', this.searchId, resultId].join('_');
        (result as any).metadata = metadata;
        resultId += 1;
      }
      if (searchResponse.results.length > 0) {
        this.selectedSearchResultId = searchResponse.results[0].id;
      }
    },
    selectedSearchResultId: async function (newVal) {
      const updateAppMapData = async () => {
        if (!this.$refs.vappmap) return;

        if (!newVal) {
          this.$refs.vappmap.resetDiagram();
          return;
        }

        const searchResult = this.selectedSearchResult;
        const appmapData = await this.rpcClient.appmapData(searchResult.appmap);
        await this.$refs.vappmap.loadData(appmapData);
        this.$refs.vappmap.setState(
          JSON.stringify({ selectedObjects: searchResult.events.map((e) => e.fqid) })
        );
      };

      this.$nextTick(updateAppMapData.bind(this));
    },
    statusStep: function (newVal) {
      if (!newVal) {
        this.searchStatusLabel = undefined;
        return;
      }

      if (newVal) {
        if (this.searchStatus?.step) {
          const label = this.searchStatusLabels[this.searchStatus.step];
          if (label) this.searchStatusLabel = [label, '...'].join('');
        } else {
          this.searchStatusLabel = undefined;
        }
      }
    },
  },
  computed: {
    isNavieLoading() {
      return !this.configLoaded;
    },
    showStatus() {
      return !this.targetAppmap && this.appmapStats && !this.isChatting;
    },
    targetAppmapName() {
      return this.targetAppmap?.metadata?.name;
    },
    statusStep() {
      return this.searchStatus ? this.searchStatus.step : undefined;
    },
    subscription() {
      return this.registrationData ? this.registrationData.thread.subscription : undefined;
    },
    usage() {
      return this.registrationData ? this.registrationData.thread.usage : undefined;
    },
    numCodeSnippets() {
      return this.getContextItems('code-snippet').length;
    },
    numSequenceDiagrams() {
      return this.getContextItems('sequence-diagram').length;
    },
    numDataRequests() {
      return this.getContextItems('data-request').length;
    },
    selectedSearchResult() {
      if (!this.searchResponse || !this.selectedSearchResultId) return;

      return this.searchResponse.results.find(
        (result) => result.id === this.selectedSearchResultId
      );
    },
    hasAppMaps() {
      return this.appmapStats?.some(({ numAppMaps }) => numAppMaps > 0) ?? false;
    },
    hasPinnedItems() {
      return this.pinnedItemCount > 0;
    },
    pinnedItemCount() {
      return this.pinnedItems.length;
    },
    showAddFilesWhenEmpty() {
      return this.editorType !== 'intellij';
    },
    contextResponse() {
      const values = Object.values(this.contextItems);
      return values.length ? Array.from(values) : undefined;
    },
  },
  methods: {
    // Clear all stateful chat information to return to the base screen
    clear() {
      const chatApi = this.$refs.vchat;
      chatApi.clear();
      this.pinnedItems = [];
      this.contextItems = [];
    },
    async initConversationThread() {
      try {
        this.registrationData = await this.rpcClient.register();
      } catch (error) {
        console.error('Failed to register conversation thread', error);
        this.registrationData = {
          thread: {
            subscription: { subscriptions: [] },
            usage: { conversationCounts: [] },
          },
        };
        return;
      }

      const { registrationData } = this;

      this.subscribeToThread(registrationData.thread.id);
    },
    async subscribeToThread(threadId: string) {
      if (this.threadListener) {
        throw new Error(`Tried to subscribe to thread ${threadId} but already subscribed`);
      }

      this.threadListener = await this.rpcClient.thread.subscribe(threadId, this.replay);
      this.threadListener
        .on('event', (e) => this.onReceiveEvent(e))
        .on('connected', () => {
          console.log('Listening to thread', threadId);
          this.activeThreadId = threadId;
          this.$root.$emit('on-thread-subscription', threadId);
        });
    },
    unsubscribeFromThread() {
      if (!this.threadListener) return;
      this.threadListener.close();
      this.threadListener = undefined;
      this.clear();
    },
    onNavieRestarting() {
      this.configLoaded = false;
    },
    async loadThread(threadId: string) {
      const thread = await this.rpcClient.loadThread(threadId);
      const chat = this.$refs.vchat;
      chat.restoreThread(threadId, thread);
    },
    // This converts the old search context into the new context format
    createContextResponse() {
      if (!this.searchStatus) return;

      const { codeObjects, sequenceDiagrams, codeSnippets } = this.searchStatus;
      const result = [];

      codeObjects?.forEach((codeObject) => {
        result.push({
          type: 'data-request',
          content: codeObject,
        });
      });

      sequenceDiagrams?.forEach((sequenceDiagram) => {
        result.push({
          type: 'sequence-diagram',
          content: sequenceDiagram,
        });
      });

      if (codeSnippets) {
        Object.keys(codeSnippets).forEach((location) => {
          result.push({
            location,
            type: 'code-snippet',
            content: this.searchStatus.codeSnippets[location],
          });
        });
      }

      if (result.length === 0) return;

      return result;
    },
    getContextItems(type) {
      return this.contextResponse?.filter((contextItem) => contextItem.type === type) || [];
    },
    getToolStatusMessage() {
      const codeSnippets =
        this.numCodeSnippets > 0
          ? `${this.numCodeSnippets} code snippet${this.numCodeSnippets === 1 ? '' : 's'}`
          : '';

      const sequenceDiagrams =
        this.numSequenceDiagrams > 0
          ? `${this.numSequenceDiagrams} sequence diagram${
              this.numSequenceDiagrams === 1 ? '' : 's'
            }`
          : '';

      const dataRequests =
        this.numDataRequests > 0
          ? `${this.numDataRequests} data request${this.numDataRequests === 1 ? '' : 's'}`
          : '';

      const messageSegments = [sequenceDiagrams, dataRequests, codeSnippets].filter(Boolean);
      if (messageSegments.length === 0) {
        return;
      } else if (messageSegments.length === 1) {
        return `Found ${messageSegments[0]}`;
      } else if (messageSegments.length === 2) {
        return `Found ${messageSegments.join(' and ')}`;
      } else {
        return `Found ${messageSegments.slice(0, -1).join(', ')}, and ${messageSegments.slice(-1)}`;
      }
    },
    askAboutWorkspace() {
      this.targetAppmap = undefined;
      this.$refs.vchat.resetAppMaps();
      this.$refs.vchat.clear();
    },
    getAppMapState() {
      return this.$refs.vappmap?.getState();
    },
    setAppMapState(state) {
      this.$refs.vappmap?.setState(state);
    },
    onStop() {
      this.rpcClient.thread.stopCompletion(this.activeThreadId);
    },
    async sendMessage(
      message: string,
      messageAttachments: { uri: string; content?: string }[] = [],
      _appmaps: string[] = [] // eslint-disable-line @typescript-eslint/no-unused-vars
    ) {
      const userContext = this.pinnedItems.concat(messageAttachments);
      try {
        await this.rpcClient.thread.sendMessage(
          this.activeThreadId,
          message
            .replace(/^@generate/, '@generate /format=xml')
            .replace(/^@test/, '@test /format=xml'),
          userContext
        );
      } catch (e) {
        console.error('Failed to send message', e);
      }
    },
    setAppMapStats(stats) {
      this.appmapStats = stats;
    },
    startResizing(event) {
      document.body.style.userSelect = 'none';
      this.isPanelResizing = true;
      this.initialPanelWidth = this.$refs.chatContainer.offsetWidth;
      this.initialClientX = event.clientX;
    },
    makeResizing(event) {
      if (this.isPanelResizing) {
        const MIN_PANEL_WIDTH = 280;
        const MAX_PANEL_WIDTH = window.innerWidth * 0.75;

        let newWidth = this.initialPanelWidth + (event.clientX - this.initialClientX);
        newWidth = Math.max(MIN_PANEL_WIDTH, newWidth);
        newWidth = Math.min(MAX_PANEL_WIDTH, newWidth);

        this.$refs.chatContainer.style.width = `${newWidth}px`;
      }
    },
    stopResizing() {
      document.body.style.userSelect = '';
      this.isPanelResizing = false;
    },
    includeCodeSelection(codeSelection: CodeSelection) {
      if (!this.activeThreadId)
        throw new Error('Failed to include code selection, no active thread ID');

      let range: { start: number; end?: number } | undefined;
      if (codeSelection.lineStart) {
        range = { start: codeSelection.lineStart };
        if (codeSelection.lineEnd) {
          range.end = codeSelection.lineEnd;
        }
      }

      const uri = codeSelection.path ? URI.file(codeSelection.path, range) : URI.random();

      this.rpcClient.thread.addMessageAttachment(
        this.activeThreadId,
        uri.toString(),
        codeSelection.code
      );
    },
    includeAppMap(appmap: string) {
      this.$refs.vchat.includeAppMap(appmap);
    },
    setIsChatting(isChatting: boolean) {
      this.isChatting = isChatting;
    },
    async loadNavieConfig() {
      const { baseUrl, model, projectDirectories } = await this.rpcClient.configuration();
      this.baseUrl = baseUrl;
      this.model = model;

      // projectDirectories is reactive and injected into child components so
      // don't outright reassign it to a new array. It'll lose the bound observers.
      this.projectDirectories.splice(0, this.projectDirectories.length);
      this.projectDirectories.push(...(projectDirectories ?? []));

      this.configLoaded = true;
    },
    async loadModelConfig() {
      this.modelConfigs = await this.rpcClient.getModelConfig().catch((e) => {
        console.error(e);
      });
    },
    async listRpcMethods() {
      if (this.rpcMethodsAvailable !== undefined) {
        return this.rpcMethodsAvailable;
      }

      try {
        this.rpcMethodsAvailable = await this.rpcClient.listMethods();
      } catch (e) {
        console.error(e);
        this.rpcMethodsAvailable = [];
      }

      this.isWelcomeV2Available = this.rpcMethodsAvailable.includes('v2.navie.welcome');
    },
    async initializeModels() {
      try {
        this.models = await this.rpcClient.listModels();
      } catch (e) {
        console.error(e);
      }

      // This function may be called again if Navie restarts. If we already have a selected model,
      // do nothing.
      if (this.selectedModel) {
        return;
      }

      let modelId;
      let provider;
      // If we're provided a "preselected" model identifier, select it.
      if (this.preselectedModelId) {
        // The model ID should be formatted as `${provider}:${modelId}` or `${modelId}`. Each
        // individual component may be URI encoded, because some model identifiers may contain a
        // colon (e.g., deepseek-r1:8b)
        const delimiterIndex = this.preselectedModelId.indexOf(':');
        if (delimiterIndex === -1) {
          modelId = decodeURIComponent(this.preselectedModelId);
        } else {
          modelId = decodeURIComponent(this.preselectedModelId.slice(delimiterIndex + 1));
          provider = decodeURIComponent(this.preselectedModelId.slice(0, delimiterIndex));
        }
      } else {
        // Find the model tagged 'primary'. This is really only used in development, where the
        // model is set in the RPC service, but the frontend reloads.
        const primaryModel = this.models.find((model) => model.tags?.includes('primary'));
        if (primaryModel) {
          modelId = primaryModel.id;
          provider = primaryModel.provider;
        }
      }

      if (modelId) this.selectModel(provider, modelId);
    },
    async isRpcMethodAvailable(methodName) {
      return this.rpcMethodsAvailable.includes(methodName);
    },
    async loadStaticMessages() {
      if (this.isWelcomeV2Available) {
        const metadata = await this.rpcClient.metadataV2();
        this.inputPlaceholder = metadata.inputPlaceholder;
        this.commands = metadata.commands;
      } else {
        // If only the old metadata method is available, both the static and dynamic welcome
        // messages will be loaded from the same method. Also the welcome message is a string
        // which we will do the best we can to display.
        const metadata = await this.rpcClient.metadataV1();
        this.inputPlaceholder = metadata.inputPlaceholder;
        this.commands = metadata.commands;
        this.welcomeMessage = metadata.welcomeMessage;
      }
    },
    async loadDynamicWelcomeMessages() {
      if (!this.isWelcomeV2Available) return;

      // The code editor may not immediately add a code selection to the chat. Wait a frame.
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const codeSelections = this.$refs.vchat.codeSelections || [];
      const codeSelection = codeSelections.length
        ? codeSelections.map((c) => c.code).join('\n')
        : undefined;
      const welcome = await this.rpcClient.welcome(codeSelection);
      // The welcome message is provided as a fallback, in case there is not discernable activity.
      this.welcomeMessage = welcome.message;
      // If the activity is available, the welcome message should be undefined and the activity
      // name should be used to construct the greeting.
      this.activityName = welcome.activity;
      this.suggestedQuestions = welcome.suggestions;
    },
    async onDrop(evt: any) {
      const items = evt.dataTransfer.items;
      const len = items.length;
      type DropPinFileRequest = PinFileRequest & { file: File };
      let promises: Promise<DropPinFileRequest[]>[] = [];
      for (let i = 0; i < len; i++) {
        const item = items[i];
        if (item.kind === 'string' && item.type?.match('^application/vnd.code.uri-list')) {
          promises.push(
            new Promise((resolve) => {
              item.getAsString((s: string) => {
                resolve(
                  s.split(/[\r\n]+/).map((uri) => {
                    const name = new URL(uri).pathname.split('/').slice(-1)[0];
                    return {
                      name,
                      uri,
                    };
                  })
                );
              });
            })
          );
        } else if (item.kind === 'file') {
          const file = item.getAsFile();
          const name = file.name;
          const uri = file.path ? 'file://' + file.path : undefined;
          promises.push(Promise.resolve([{ name, uri, file }]));
        }
      }
      await Promise.all(promises).then((requests) => {
        const reqs = requests.flat(Infinity);
        reqs.forEach((r) => {
          if (r.file && !r.uri) {
            r.file.text().then((text) => {
              r.content = text;
              this.$root.$emit('fetch-pinned-files', [new PinFileRequest(r)]);
            });
          } else {
            this.$root.$emit('fetch-pinned-files', [new PinFileRequest(r)]);
          }
        });
      });
    },
    onMouseEnter() {
      this.$refs.infoPopper.show();
    },
    onMouseLeave() {
      this.$refs.infoPopper.hide();
    },
    addFiles() {
      this.$root.$emit('choose-files-to-pin');
    },

    /**
     * Runs all the necessary initialization steps, mainly loading data from the RPC server.
     */
    async initialize() {
      try {
        // v1.navie.models.list
        await this.initializeModels();

        // v1.navie.models.getConfig
        this.loadModelConfig();

        // v2.configuration.get
        this.loadNavieConfig();

        // system.listMethods
        await this.listRpcMethods();

        // If v2.navie.welcome is available: v2.navie.metadata
        // otherwise: v1.navie.metadata
        this.loadStaticMessages();

        if (this.threadId) {
          // v1.navie.thread.subscribe
          this.subscribeToThread(this.threadId);
          return;
        }

        // v1.navie.register
        this.initConversationThread();

        // v2.navie.welcome
        this.loadDynamicWelcomeMessages();
      } catch (e) {
        console.error(e);
      }
    },
    selectModel(provider: string | undefined, id: string) {
      const lowerProvider = provider?.toLowerCase();
      const lowerId = id.toLowerCase();

      // if provider is `undefined`, only match the first result on id.
      // otherwise, match both.
      this.selectedModel = this.models.find(
        (model) =>
          model.id.toLowerCase() === lowerId &&
          (!provider || model.provider.toLowerCase() === lowerProvider)
      );

      this.$root.$emit('select-model', this.selectedModel);
    },
    async onModelSelect(provider: string | undefined, id: string) {
      this.selectModel(provider, id);

      try {
        await this.rpcClient.selectModel(this.selectedModel);
      } catch (e) {
        console.error(e);
      }
    },
    onReceiveEvent(event) {
      const chatApi = this.$refs.vchat;
      switch (event.type) {
        case 'message': {
          if (event.role === 'assistant') {
            chatApi.addSystemMessage(event.content);
          } else if (event.role === 'user') {
            chatApi.addUserMessage(event.content, event.userContext);

            // Clear the context after a new user message is sent
            this.$set(this, 'contextItems', []);
          }
          break;
        }

        case 'begin-context-search': {
          let message = chatApi.getMessage({ isUser: false, complete: false });
          if (!message) {
            message = chatApi.addSystemMessage();
          }
          let title;
          if (event.contextType === 'project-info') {
            title = 'Gathering project information';
          } else if (event.contextType === 'help') {
            title = 'Searching AppMap documentation';
          } else if (event.contextType === 'context') {
            const req = event.request ?? {};
            if (Array.isArray(req.vectorTerms) && req.vectorTerms.length > 0) {
              title = 'Searching for relevant content';
            } else if (Array.isArray(req.locations) && req.locations.length > 0) {
              title = 'Locating source files';
            }
          }
          if (!title) {
            return;
          }
          message.tools.push({
            title,
            id: event.id,
            status: 'Working...',
          });
          break;
        }

        case 'complete-context-search': {
          if (!Array.isArray(this.contextItems)) {
            this.$set(this, 'contextItems', []);
          }

          if (event.result.length) {
            const deduplicatedResults = new Map<string, Record<string, unknown>>();
            event.result.forEach((result) => {
              const key = `${result.type}:${result.directory}/${result.location}`;
              if (!deduplicatedResults.has(key)) {
                deduplicatedResults.set(key, result);
              }
            });
            this.contextItems.push(...Array.from(deduplicatedResults.values()));
          }

          const message = chatApi.getMessage({ isUser: false, complete: false });
          if (!message) {
            throw new Error(
              `Tried to complete context search for ${event.id}, but no message was found`
            );
          }

          const tool = message.tools.find((tool) => tool.id === event.id);
          if (!tool) {
            throw new Error(
              `Tried to complete context search for ${event.id}, but no tool was found`
            );
          }
          tool.status = 'Complete';
          tool.complete = true;
          break;
        }

        case 'token-metadata': {
          const metadata = event.metadata;
          if (!metadata) return;

          Object.entries(metadata).forEach(([key, value]) => {
            pinnedItemRegistry.setMetadata(event.codeBlockUri, key, value);
          });

          break;
        }

        case 'token': {
          const { codeBlockUri } = event;
          let newToken = event.token;
          if (codeBlockUri) {
            pinnedItemRegistry.appendContent(codeBlockUri, event.token);
            chatApi.addToken({ type: 'code-block', uri: codeBlockUri }, event.messageId);
            newToken = { type: 'hidden', content: event.token };
          }

          // If an unidentified, incomplete non-user message is available, claim it.
          // TODO: This should be handled automatically by `chatApi.addToken`.
          const orphanedMessage = chatApi.getMessage({
            messageId: undefined,
            complete: false,
            isUser: false,
          });
          if (orphanedMessage) {
            orphanedMessage.messageId = event.messageId;
          }

          chatApi.addToken(newToken, event.messageId);
          break;
        }

        case 'message-complete': {
          const message = chatApi.getMessage({ messageId: event.messageId });
          if (!message) {
            throw new Error(
              `Tried to mark message ${event.messageId} as complete, but it was not found`
            );
          }
          message.complete = true;
          break;
        }

        case 'pin-item': {
          const pinIndex = this.pinnedItems.findIndex((p) => p.uri === event.uri);
          if (pinIndex === -1) {
            this.pinnedItems.push({ uri: event.uri, content: event.content });
          }
          break;
        }

        case 'unpin-item': {
          const pinIndex = this.pinnedItems.findIndex((p) => p.uri === event.uri);
          if (pinIndex !== -1) {
            this.pinnedItems.splice(pinIndex, 1);
          }
          break;
        }

        case 'add-message-attachment': {
          this.$refs.vchat.includeCodeSelection(event);
          break;
        }

        case 'remove-message-attachment': {
          this.$refs.vchat.removeCodeSelection(event.attachmentId);
          break;
        }

        case 'prompt-suggestions': {
          const message = chatApi.getMessage({ messageId: event.messageId });
          if (!message) {
            console.error(`Received prompt suggestions for unknown message ${event.messageId}`);
            return;
          }

          let suggestions = event.suggestions ?? [];
          message.setPromptSuggestions(suggestions);
          break;
        }

        case 'error': {
          if (event.code === 'missing-thread') {
            console.error('The requested thread does not exist:', this.activeThreadId);
            console.error('Registering a new thread');
            this.unsubscribeFromThread();
            this.initConversationThread();
            return;
          }

          const assistantMessage = chatApi.getMessage({
            isUser: false,
            complete: false,
          });

          chatApi.onError(event.error, assistantMessage);
          break;
        }
      }
    },
  },
  async mounted() {
    if (this.$refs.vappmap && this.targetAppmap && this.targetAppmapFsPath) {
      this.includeAppMap(this.targetAppmapFsPath);
      await this.$refs.vappmap.loadData(this.targetAppmap);
    }

    this.$root
      .$on('pin', (pin: PinEvent) => {
        pin.pinned
          ? this.rpcClient.thread.pinItem(
              this.activeThreadId,
              pin.uri,
              pinnedItemRegistry.get(pin.uri)?.content
            )
          : this.rpcClient.thread.unpinItem(this.activeThreadId, pin.uri);
      })
      .$on('jump-to', (handle: number) => {
        document
          .querySelector(`[data-handle="${handle}"]:not([data-reference])`)
          ?.scrollIntoView({ behavior: 'smooth' });
      })
      .$on('submit-prompt', (prompt: string) => {
        this.$refs.vchat.onSend(prompt);
        this.$refs.vchat.scrollToBottom();
      })
      .$on('change-input', (prompt: string) => {
        this.$refs.vchat.setInput(prompt);
      })
      .$on('pin-files', (requests: { uri: string }[]) => {
        requests.forEach((r) => {
          this.rpcClient.thread.pinItem(this.activeThreadId, r);
        });
      });

    await this.initialize();

    this.$nextTick(() => {
      this.$root.$emit('chat-search-loaded');
    });
  },
};
</script>

<style lang="scss">
@import '~highlight.js/styles/base16/snazzy.css';
pre code {
  background-color: transparent;
  color: #e2e4e5; // snazzy
}
</style>

<style lang="scss" scoped>
$border-color: darken($gray4, 10%);

.chat-search-container {
  display: grid;
  grid-template-columns: auto auto 1fr;
  min-width: 100%;
  max-width: 100vw;
  height: 100vh;
  background-color: $color-background;
  color: $color-foreground;

  .search-header {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(black, 0.25);
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(white, 0.1);
  }

  .search-subheader {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: center;
    padding-right: 1em;
  }

  h1 {
    color: $color-foreground;
    margin: 0.5rem;
    font-size: 1.17em;
  }

  .info {
    position: relative;
    margin: 0 0.83rem;
    display: flex;
    svg {
      width: 18px;
      height: 18px;
      fill: $color-foreground;
    }
  }

  .info-help {
    &::v-deep {
      .popper__text {
        position: absolute;
        color: $color-foreground;
        background: $color-background;
        left: unset;
        right: 100%;
        transform: translateX(0.65rem) translateY(+1.65rem);
        border: 1px solid $color-border;
      }
    }
  }

  h2 {
    margin-left: 0.75rem;
    margin-bottom: 0.5rem;
    color: $color-foreground;
    font-size: 1.17em;
  }

  .chat-container {
    overflow: hidden;
    min-width: 375px;
    width: 60vw;

    display: flex;
    flex-direction: column;
    background-color: $color-background;

    .message-box__footer {
      padding: 1rem 2rem;
      padding-top: 0;
    }

    .navie-intro {
      padding: 1rem;
      align-self: center;
      margin: 0 auto;
      padding: 2rem;
      padding-bottom: 0;

      a {
        color: $color-link;
        text-decoration: none;

        &:hover {
          color: $color-link-hover;
        }
      }
    }

    .chat-search-chat {
      min-width: auto;
      margin: 0;
      max-width: none !important;
    }
  }

  .configuration-container {
    padding: 1em 0 0 2em;
  }

  .chat-search-container--drag {
    width: 4px;
    background: rgba(0, 0, 0, 0.2);
    cursor: col-resize;
    z-index: 100;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .search-wrapper {
    display: grid;
    grid-template-rows: min-content min-content 1fr;

    max-height: 100vh;
    background-color: $color-background-dark;

    .pinned-items-wrapper,
    .context-wrapper {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      margin-bottom: 0;
    }

    .pinned-items-wrapper .search-container {
      max-height: 33vh;
      border-bottom: 1px solid $color-border;
    }
  }

  .search-container,
  .context-container {
    font-size: 1em;
    flex-direction: column;
    overflow-y: auto;
  }

  .instructions {
    min-width: 20rem;
  }

  .search-container {
    max-height: 100vh;
    display: flex;
    flex-direction: column;

    h2 {
      font-size: 1.2rem;
      margin-right: 1rem;
    }

    .appmap {
      padding-top: 0.4rem;
      height: 100% !important;
    }

    .appmap-empty {
      height: 100%;
      background-color: $black;
      margin-top: 0rem;
    }
  }

  .pinned-item__count {
    font-size: 0.8rem;
    font-weight: 400;
    margin-left: 0.5rem;
    background-color: rgb(168, 168, 255, 0.15);
    border-radius: 4rem;
    width: 1.25rem;
    height: 1.25rem;
    display: inline-flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
