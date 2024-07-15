<template>
  <div
    class="chat-search-container"
    @mousemove="makeResizing"
    @mouseup="stopResizing"
    @mouseleave="stopResizing"
  >
    <div class="chat-container" data-cy="resize-left" ref="chatContainer">
      <v-chat
        class="chat-search-chat"
        ref="vchat"
        :send-message="sendMessage"
        :status-label="searchStatusLabel"
        @clear="clear"
        :question="question"
        @isChatting="setIsChatting"
        :input-placeholder="inputPlaceholder"
        @stop="onStop"
      >
        <v-context-status v-if="showStatus" :appmap-stats="appmapStats" />
        <v-llm-configuration
          data-cy="llm-config"
          v-if="!disableLlmConfig && configLoaded && !isChatting"
          :base-url="baseUrl"
          :model="model"
        />
      </v-chat>
    </div>
    <div
      class="chat-search-container--drag"
      data-cy="resize-handle"
      @mousedown="startResizing"
    ></div>
    <div class="search-container">
      <v-context
        class="no-match-instructions"
        :appmap-stats="appmapStats"
        :context-response="contextResponse"
        :pinned-items="pinnedItems"
      />
    </div>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VChat from '@/components/chat/Chat.vue';
import VContextStatus from '@/components/chat-search/ContextStatus.vue';
import VContext from '@/components/chat-search/Context.vue';
import VLlmConfiguration from '@/components/chat-search/LlmConfiguration.vue';
import AppMapRPC from '@/lib/AppMapRPC';
import authenticatedClient from '@/components/mixins/authenticatedClient';
import type { ITool, CodeSelection } from '@/components/chat/Chat.vue';
import type { PinEvent } from '@/components/chat/PinEvent';

import debounce from '@/lib/debounce';

export default {
  name: 'v-chat-search',
  components: {
    VChat,
    VContext,
    VContextStatus,
    VLlmConfiguration,
  },
  mixins: [authenticatedClient],
  props: {
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
    savedFilters: {
      type: Array,
      default: () => [],
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
    mostRecentAppMaps: Array,
    disableLlmConfig: {
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
      ask: undefined,
      isChatting: false,
      loadAppMapStats: debounce(
        async () => {
          const rpc = this.rpcClient();
          try {
            this.appmapStats = await rpc.appmapStats();
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
      pinnedItems: [],
    };
  },
  provide() {
    return {
      pinnedItems: this.pinnedItems,
    };
  },
  watch: {
    mostRecentAppMaps() {
      this.loadAppMapStats();
    },
    searchResponse: async function (newVal) {
      if (!newVal) {
        this.selectedSearchResultId = undefined;
        return;
      }

      const searchResponse = newVal;
      const rpc = this.rpcClient();

      let resultId = 0;
      for (const result of searchResponse.results) {
        const metadata = await rpc.appmapMetadata(result.appmap);
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

        const index = this.rpcClient();
        const searchResult = this.selectedSearchResult;
        const appmapData = await index.appmapData(searchResult.appmap);
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
  },
  methods: {
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
    updateFilters(updatedFilters) {
      this.$store.commit(SET_SAVED_FILTERS, updatedFilters);
    },
    onStop() {
      // This will stop token emission from this.ask immediately
      // and emit a stop event.
      this.ask?.stop();
    },
    async sendMessage(message: string, codeSelections: string[] = [], appmaps: string[] = []) {
      this.ask = this.rpcClient().explain();
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

            // With some models there is a long delay before the first token is generated.
            // Adding something (such as a zwnj) to the message makes sure a blinking cursor
            // is shown while waiting.
            systemMessage.append('‌');
          }

          if (tool && !tool.status) tool.status = this.getToolStatusMessage();
        });
        this.ask.on('complete', onComplete);
        this.ask.on('stop', onStop);

        const explainRequest = {
          question: message,
        };
        if (appmaps.length > 0) explainRequest.appmaps = appmaps;
        if (codeSelections.length > 0) explainRequest.codeSelection = codeSelections.join('\n\n');

        this.ask.explain(explainRequest, this.$refs.vchat.threadId).catch(onError);
      });
    },
    setAppMapStats(stats) {
      this.appmapStats = stats;
    },
    clear() {
      this.searching = false;
      this.searchStatus = undefined;
      this.searchResponse = undefined;
      this.selectedSearchResultId = undefined;
      this.searchId = 0;
      this.searchStatusLabel = undefined;
      this.contextResponse = undefined;
      this.ask?.removeAllListeners();
      this.searching = false;
      this.pinnedItems = [];
      this.loadAppMapStats();
    },
    rpcClient(): AppMapRPC {
      return new AppMapRPC(
        this.appmapRpcFn ? { request: this.appmapRpcFn } : this.appmapRpcPort || 30101
      );
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
      const { baseUrl, model } = await this.rpcClient().configuration();
      this.baseUrl = baseUrl;
      this.model = model;
      this.configLoaded = true;
    },
  },
  async mounted() {
    if (this.$refs.vappmap && this.targetAppmap && this.targetAppmapFsPath) {
      this.includeAppMap(this.targetAppmapFsPath);
      await this.$refs.vappmap.loadData(this.targetAppmap);
    }
    this.loadAppMapStats();
    this.loadNavieConfig();
    this.$root.$on('pin', (pin: PinEvent) => {
      const pinIndex = this.pinnedItems.findIndex((p) => p.handle === pin.handle);
      if (pin.pinned && pinIndex === -1) {
        this.pinnedItems.push(pin);
      } else if (!pin.pinned && pinIndex !== -1) {
        this.pinnedItems.splice(pinIndex, 1);
      }
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

  .chat-container {
    overflow: hidden;
    min-width: 375px;
    width: 60vw;

    display: flex;
    flex-direction: column;
    background-color: #292c39;

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
}
</style>
