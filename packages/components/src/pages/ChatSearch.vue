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
      >
        <v-context-status v-if="showStatus" :appmap-stats="appmapStats" />
      </v-chat>
    </div>
    <div
      class="chat-search-container--drag"
      data-cy="resize-handle"
      @mousedown="startResizing"
    ></div>
    <div class="search-container" v-if="targetAppmap || searchResponse">
      <template v-if="targetAppmap || searchResponse.results.length">
        <div class="search-results-container">
          <template v-if="targetAppmap">
            <div class="search-results-header">
              <div class="single-appmap-notification">
                <p>You're asking Navie about a single AppMap</p>
                <div class="divider">|</div>
                <v-button
                  data-cy="full-workspace-context-button"
                  class="create-more-appmaps"
                  size="small"
                  kind="ghost"
                  @click.native="askAboutWorkspace"
                >
                  Include the whole workspace
                </v-button>
              </div>
              <div class="search-results-single-appmap">
                <h2>AppMap Viewer:</h2>
                <p class="target-appmap-name">
                  {{ targetAppmapName }}
                </p>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="search-results-header">
              <v-match-instructions
                v-if="searchResponse"
                :appmap-stats="appmapStats"
                :search-response="searchResponse"
              />
              <div class="search-results-list-container">
                <h2>AppMap Viewer:</h2>
                <select
                  class="search-results-list"
                  v-model="selectedSearchResultId"
                  v-if="selectedSearchResultId"
                  data-cy="appmap-list"
                >
                  <option
                    v-for="result in searchResponse.results"
                    :value="result.id"
                    :key="result.id"
                  >
                    {{ result.metadata.name || result.appmap }}
                  </option>
                </select>
              </div>
            </div>
          </template>
        </div>
        <v-app-map
          v-if="selectedSearchResult || targetAppmap"
          :allow-fullscreen="true"
          default-view="viewSequence"
          :show-ask-navie="false"
          :saved-filters="savedFilters"
          :auto-expand-details-panel="false"
          data-cy="appmap"
          ref="vappmap"
          class="appmap"
        >
        </v-app-map>
        <div v-else class="appmap-empty"></div>
      </template>
      <template v-else>
        <v-no-match-instructions
          class="no-match-instructions"
          :appmap-stats="appmapStats"
          v-if="appmapStats"
        />
      </template>
    </div>
    <v-instructions v-else class="instructions" :appmaps="mostRecentAppMaps" />
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VChat from '@/components/chat/Chat.vue';
import VInstructions from '@/components/chat-search/Instructions.vue';
import VMatchInstructions from '@/components/chat-search/MatchInstructions.vue';
import VNoMatchInstructions from '@/components/chat-search/NoMatchInstructions.vue';
import VContextStatus from '@/components/chat-search/ContextStatus.vue';
import VAppMap from './VsCodeExtension.vue';
import VButton from '@/components/Button.vue';
import AppMapRPC from '@/lib/AppMapRPC';
import authenticatedClient from '@/components/mixins/authenticatedClient';
import type { ITool, CodeSelection } from '@/components/chat/Chat.vue';

import debounce from '@/lib/debounce';

export default {
  name: 'v-chat-search',
  components: {
    VChat,
    VAppMap,
    VInstructions,
    VMatchInstructions,
    VNoMatchInstructions,
    VContextStatus,
    VButton,
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
      return !this.targetAppmap && this.appmapStats && (!this.hasAppMaps || !this.isChatting);
    },
    targetAppmapName() {
      return this.targetAppmap?.metadata?.name;
    },
    inputPlaceholder() {
      return this.targetAppmap ? 'What do you want to know about this AppMap?' : 'How can I help?';
    },
    statusStep() {
      return this.searchStatus ? this.searchStatus.step : undefined;
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

          if (!this.searchResponse && status.searchResponse) {
            this.searchResponse = status.searchResponse;

            // Update the tool status to reflect the fact that we've found some AppMaps
            if (tool) {
              const numResults = this.searchResponse.results.length;
              tool.title = 'Project analysis complete';

              // When asking about a single map, the "Found 1 relevant AppMap" message is redundant
              if (!this.targetAppmap)
                tool.status = `Found ${numResults} relevant AppMap${numResults === 1 ? '' : 's'}`;

              tool.complete = true;
            }
          }
        });
        this.ask.on('complete', onComplete);

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
      this.searchStatus = undefined;
      this.selectedSearchResultId = undefined;
      this.searchId = 0;
      this.searchStatusLabel = undefined;
      this.ask?.removeAllListeners();
      this.searching = false;
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
  },
  async mounted() {
    if (this.$refs.vappmap && this.targetAppmap && this.targetAppmapFsPath) {
      this.includeAppMap(this.targetAppmapFsPath);
      await this.$refs.vappmap.loadData(this.targetAppmap);
    }
    this.loadAppMapStats();
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
    width: 40vw;

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
    grid-template-rows: auto 1fr;
    display: grid;
    flex-direction: column;
    overflow-y: auto;
    background-color: $black;
  }

  .instructions {
    min-width: 20rem;
  }

  .search-container {
    max-height: 100vh;

    h2 {
      font-size: 1.2rem;
      margin-right: 1rem;
    }

    .search-results-container {
      background-color: darken($gray2, 8%);

      .search-results-header {
        display: flex;
        flex-direction: column;
        margin: 0.5rem 0;
        padding: 0 1.75rem;

        .single-appmap-notification {
          font-size: 0.9rem;
          color: lighten($gray4, 20%);
          display: flex;
          flex-direction: row;
          align-items: center;

          .divider {
            margin: 0 0.75rem;
          }
        }

        @media (max-width: 900px) {
          .single-appmap-notification {
            flex-direction: column;
            align-items: flex-start;
            margin-bottom: 1.5rem;

            .divider {
              display: none;
            }
          }
        }

        .search-results-single-appmap {
          display: flex;
          flex-direction: row;
          align-items: center;

          .target-appmap-name {
            font-size: 0.9rem;
            margin: 0;
            font-style: italic;
          }
        }

        .search-results-list-container {
          align-items: center;

          .search-results-list {
            margin: 0.5rem 0;
            width: 30em;
            height: 1.7rem;
            color: white;
            background-color: lighten($gray3, 5%);
            border-radius: 10px;
            padding: 0.3rem;
            border: none;

            &:hover {
              background-color: lighten($gray3, 10%);
              transition: all 0.2s ease-in-out;
            }

            &:focus-visible {
              outline: none;
            }
          }
        }
      }
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
