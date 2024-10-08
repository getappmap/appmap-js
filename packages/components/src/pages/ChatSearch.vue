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
        :metadata="metadata"
        :use-animation="useAnimation"
        @isChatting="setIsChatting"
        @stop="onStop"
      >
        <v-llm-configuration
          data-cy="llm-config"
          v-if="!disableLlmConfig && configLoaded && !isChatting"
          :base-url="baseUrl"
          :model="model"
        />
        <template #not-chatting>
          <div class="message-box__footer">
            <v-welcome-message :message="welcomeMessage" />
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
        <v-popper class="infoHelp" ref="infoPopper" placement="none">
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
import VLlmConfiguration from '@/components/chat-search/LlmConfiguration.vue';
import VPinnedItems from '@/components/chat-search/PinnedItems.vue';
import type { CodeSelection, ITool } from '@/components/chat/Chat.vue';
import VChat from '@/components/chat/Chat.vue';
import { getNextHandle } from '@/components/chat/Handle';
import type { PinEvent, PinFile } from '@/components/chat/PinEvent';
import VWelcomeMessage from '@/components/chat/WelcomeMessage.vue';
import authenticatedClient from '@/components/mixins/authenticatedClient';
import AppMapRPC from '@/lib/AppMapRPC';
import { PinFileRequest } from '@/lib/PinFileRequest';
import debounce from '@/lib/debounce';
import InfoIcon from '../assets/info.svg';

export default {
  name: 'v-chat-search',
  components: {
    InfoIcon,
    VAddFileButton,
    VChat,
    VContext,
    VLlmConfiguration,
    VPinnedItems,
    VPopper,
    VWelcomeMessage,
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
      ask: undefined,
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
      contextResponse: undefined,
      pinnedItems: [] as PinItem[],
      projectDirectories: [] as string[],
      metadata: undefined as NavieRpc.V1.Metadata.Response | undefined,
    };
  },
  provide() {
    return {
      pinnedItems: this.pinnedItems,
      rpcClient: this.rpcClient,
      projectDirectories: this.projectDirectories,
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
    showStatus() {
      return !this.targetAppmap && this.appmapStats && !this.isChatting;
    },
    targetAppmapName() {
      return this.targetAppmap?.metadata?.name;
    },
    inputPlaceholder() {
      return this.targetAppmap
        ? 'What do you want to know about this AppMap?'
        : 'What are you working on today?';
    },
    statusStep() {
      return this.searchStatus ? this.searchStatus.step : undefined;
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
    rpcClient(): AppMapRPC {
      return new AppMapRPC(
        this.appmapRpcFn ? { request: this.appmapRpcFn } : this.appmapRpcPort || 30101
      );
    },
    welcomeMessage(): string {
      return this.metadata?.welcomeMessage ?? '';
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
  },
  methods: {
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
      // This will stop token emission from this.ask immediately
      // and emit a stop event.
      this.ask?.stop();
    },
    async sendMessage(message: string, codeSelections: string[] = [], appmaps: string[] = []) {
      this.ask = this.rpcClient.explain();
      this.searching = true;
      this.lastStatusLabel = undefined;

      let myThreadId: string | undefined;
      return new Promise((resolve, reject) => {
        // If we can't find a system message, this is a new chat.
        // We could potentially use the status to determine whether or not
        // to add a new tool, but this will be more reactive.
        const isNewChat = !Boolean(this.$refs.vchat.getMessage({ isUser: false }));
        const systemMessage = this.$refs.vchat.addSystemMessage();
        let tool: ITool | undefined;

        const contextToolTitle = 'Analyzing your project';
        if (isNewChat) {
          tool = {
            title: contextToolTitle,
          };
          systemMessage.tools.push(tool);
        }

        const onProjectContextComplete = () => {
          if (tool && tool.title === contextToolTitle) {
            tool.title = 'Project analysis complete';
            tool.complete = true;
          }
        };

        const onComplete = () => {
          this.searching = false;
          onProjectContextComplete();
          systemMessage.complete = true;
          resolve();
        };

        const onStop = () => {
          onComplete();
        };

        const onError = (error) => {
          onComplete();
          this.$refs.vchat.onError(error, systemMessage);
          reject();
        };

        this.ask.on('ack', (_messageId: string, threadId: string) => {
          myThreadId = threadId;
          this.$refs.vchat.onAck(_messageId, threadId);
        });
        this.ask.on('token', (token, messageId) => {
          if (!systemMessage.messageId) systemMessage.messageId = messageId;

          onProjectContextComplete();
          this.$refs.vchat.addToken(token, myThreadId, messageId);
        });
        this.ask.on('error', onError);
        this.ask.on('status', (status) => {
          this.searchStatus = status;

          // Only update the context response if one is present.
          if (status.contextResponse)
            this.contextResponse = status.contextResponse || this.createContextResponse();

          if (!this.searchResponse && status.searchResponse) {
            this.searchResponse = status.searchResponse;

            // Update the tool status to reflect the fact that we've found some AppMaps
            if (tool) {
              tool.title = 'Project analysis complete';
              tool.complete = true;
            }
          }

          if (tool && !tool.status) tool.status = this.getToolStatusMessage();
        });
        this.ask.on('complete', onComplete);
        this.ask.on('stop', onStop);

        const explainRequest = {
          question: message
            .replace(/^@generate/, '@generate /format=xml')
            .replace(/^@test/, '@test /format=xml'),
        };
        if (appmaps.length > 0) explainRequest.appmaps = appmaps;

        const userProvidedContext: string[] = [];
        if (this.pinnedItems.length > 0) {
          userProvidedContext.push(
            `<!-- Pinned items are snippets that I have saved from earlier in the conversation -->`,
            ...this.pinnedItems.map(
              (p) => `<pinned-context handle="${p.handle}">\n${p.content}\n</pinned-context>`
            )
          );
        }
        if (codeSelections.length > 0) {
          userProvidedContext.push(
            `<!-- Code selections are snippets that I have selected from the code editor -->`,
            ...codeSelections.map((c) => `<code-selection>\n${c}\n</code-selection>`)
          );
        }
        if (userProvidedContext.length > 0)
          explainRequest.codeSelection = [
            '<user-provided-context>',
            userProvidedContext.join('\n'),
            '</user-provided-context>',
          ].join('\n');

        this.ask.explain(explainRequest, this.$refs.vchat.threadId).catch(onError);
      });
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
      this.$refs.vchat.includeCodeSelection(codeSelection);
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
    async loadMetadata() {
      const metadata = await this.rpcClient.metadata();
      this.metadata = metadata;
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
  },
  async mounted() {
    if (this.$refs.vappmap && this.targetAppmap && this.targetAppmapFsPath) {
      this.includeAppMap(this.targetAppmapFsPath);
      await this.$refs.vappmap.loadData(this.targetAppmap);
    }
    this.loadNavieConfig();
    this.loadMetadata();
    this.$root
      .$on('pin', (pin: PinEvent) => {
        const pinIndex = this.pinnedItems.findIndex((p) => p.handle === pin.handle);
        if (pin.pinned && pinIndex === -1) {
          this.pinnedItems.push(pin);
        } else if (!pin.pinned && pinIndex !== -1) {
          this.pinnedItems.splice(pinIndex, 1);
        }
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
      .$on('pin-files', (requests: PinFileRequests[]) => {
        requests.forEach((r) => {
          const uri = new URL(r.uri);
          const pathname = decodeURIComponent(uri.pathname);
          const eventData: PinEvent & Partial<PinFile> = {
            handle: getNextHandle(),
            pinned: true,
            type: 'file',
            location: pathname,
            content: r.content,
          };
          this.$root.$emit('pin', eventData);
        });
      });
    this.$nextTick(() => {
      this.$root.$emit('chat-search-loaded');
    });
  },
};
</script>

<style lang="scss" scoped>
$border-color: darken($gray4, 10%);

.chat-search-container {
  display: grid;
  grid-template-columns: auto auto 1fr;
  min-width: 100%;
  max-width: 100vw;
  height: 100vh;
  background-color: $gray2;

  .search-header {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: center;
  }

  .search-subheader {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: center;
    &::v-deep .btn {
      margin-top: 0.83rem;
      margin-right: 0.83rem;
    }
  }

  h1 {
    margin: 0.5rem;
    color: $white;
  }

  .info {
    position: relative;
    margin: 0 0.83rem;
    svg {
      width: 18px;
      height: 18px;
      fill: $white;
    }
  }

  .infoHelp {
    &::v-deep {
      .popper__text {
        position: absolute;
        color: $white;
        background: $black;
        left: unset;
        right: 100%;
        transform: translateX(0.65rem) translateY(+1.65rem);
        border: 1px solid;
      }
    }
  }

  h2 {
    margin-left: 0.75rem;
    margin-bottom: 0.5rem;
    color: $white;
  }

  .chat-container {
    overflow: hidden;
    min-width: 375px;
    width: 60vw;

    display: flex;
    flex-direction: column;
    background-color: #292c39;

    .message-box__footer {
      padding: 2rem 2rem;
      padding-top: 0;
    }

    .navie-intro {
      padding: 1rem;
      align-self: center;
      margin: 0 auto;
      padding: 2rem;
      padding-bottom: 0;

      a {
        color: #768ecb;
        text-decoration: none;

        &:hover {
          color: #4362b1;
        }
      }
    }

    .chat-search-chat {
      min-width: auto;
      margin: 0;
      max-width: none !important;
    }
  }
  .chat-search-container--drag {
    width: 4px;
    background: rgba(0, 0, 0, 0.1);
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
    background-color: darken(#292c39, 10%);

    .pinned-items-wrapper,
    .context-wrapper {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      margin-bottom: 0;
    }

    .pinned-items-wrapper .search-container {
      max-height: 33vh;
      border-bottom: 1px dashed rgba($white, 0.33);
    }
  }

  .search-container,
  .context-container {
    font-size: 1rem;
    color: $white;
    flex-direction: column;
    overflow-y: auto;
    background-color: darken(#292c39, 10%);
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
    color: lighten($gray4, 20%);
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
