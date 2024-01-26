<template>
  <div
    class="chat-search-container"
    @mousemove="makeResizing"
    @mouseup="stopResizing"
    @mouseleave="stopResizing"
  >
    <div class="chat-container" data-cy="resize-left" ref="chatContainer">
      <v-code-snippet
        v-if="codeSnippet"
        ref="vcode-snippet"
        class="chat-code-snippet"
        :code="codeSnippet"
      >
      </v-code-snippet>
      <v-chat
        class="chat-search-chat"
        ref="vchat"
        :send-message="sendMessage"
        :status-label="searchStatusLabel"
        :disable-suggestions="codeSnippet !== undefined"
        @clear="clear"
        :question="question"
      />
    </div>
    <div
      class="chat-search-container--drag"
      data-cy="resize-handle"
      @mousedown="startResizing"
    ></div>
    <div class="search-container" v-if="searchResponse">
      <template v-if="searchResponse.results.length">
        <div class="search-results-container">
          <div class="search-results-header">
            <v-match-instructions :appmap-stats="appmapStats" :search-response="searchResponse" />
            <div class="search-results-list-container">
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
        </div>
        <v-app-map
          v-if="selectedSearchResult"
          :allow-fullscreen="true"
          :saved-filters="savedFilters"
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
      <v-accordion
        v-if="enableDiagnostics"
        class="diagnostics"
        :open="showDiagnostics"
        @toggle="toggleDiagonstics"
      >
        <template #header>
          <a href="" @click.prevent>Diagnostics &raquo;</a>
        </template>

        <ul v-if="searchStatus">
          <li>Step: {{ searchStatus.step }}</li>
          <li v-if="searchStatus.vectorTerms">
            Vector terms: {{ searchStatus.vectorTerms.join(' ') }}
          </li>
          <li v-if="searchStatus.sequenceDiagrams">
            Sequence diagrams: {{ searchStatus.sequenceDiagrams.length }}
          </li>
          <li v-if="searchStatus.codeSnippets">
            Code snippets: {{ Object.keys(searchStatus.codeSnippets).length }}
          </li>
          <li v-if="searchStatus.codeObjects">
            Code objects: {{ searchStatus.codeObjects.length }}
          </li>
          <li v-if="searchStatus.prompt">
            Prompt:
            <ul class="prompt">
              <li v-for="msg in searchStatus.prompt" :key="[msg.role, msg.content].join('->')">
                <code class="role">{{ msg.role }}</code>
                <div class="content">
                  {{ msg.content }}
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </v-accordion>
    </div>
    <v-instructions v-else class="instructions" :appmap-stats="appmapStats" />
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VChat from '@/components/chat/Chat.vue';
import VCodeSnippet from '@/components/chat-search/CodeSnippet.vue';
import VAccordion from '@/components/Accordion.vue';
import VInstructions from '@/components/chat-search/Instructions.vue';
import VMatchInstructions from '@/components/chat-search/MatchInstructions.vue';
import VNoMatchInstructions from '@/components/chat-search/NoMatchInstructions.vue';
import VAppMap from './VsCodeExtension.vue';
import AppMapRPC from '@/lib/AppMapRPC';
import authenticatedClient from '@/components/mixins/authenticatedClient';
import type { ITool } from '@/components/chat/Chat.vue';

export default {
  name: 'v-chat-search',
  components: {
    VChat,
    VCodeSnippet,
    VAppMap,
    VAccordion,
    VInstructions,
    VMatchInstructions,
    VNoMatchInstructions,
  },
  mixins: [authenticatedClient],
  props: {
    question: {
      type: String,
    },
    codeSnippet: {
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
    enableDiagnostics: {
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
      showDiagnostics: false,
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
    };
  },
  watch: {
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
      } else {
        this.$refs.vchat.onNoMatch();
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
    statusStep() {
      return this.searchStatus ? this.searchStatus.step : undefined;
    },
    selectedSearchResult() {
      if (!this.searchResponse || !this.selectedSearchResultId) return;

      return this.searchResponse.results.find(
        (result) => result.id === this.selectedSearchResultId
      );
    },
  },
  methods: {
    getAppMapState() {
      return this.$refs.vappmap?.getState();
    },
    setAppMapState(state) {
      this.$refs.vappmap?.setState(state);
    },
    updateFilters(updatedFilters) {
      this.$store.commit(SET_SAVED_FILTERS, updatedFilters);
    },
    async sendMessage(message: string) {
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

        if (isNewChat) {
          tool = {
            title: 'Searching for AppMaps',
          };
          systemMessage.tools.push(tool);
        }

        const onComplete = () => {
          this.searching = false;
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
              tool.title = 'Searched for AppMaps';
              tool.status = `Found ${numResults} relevant recording${numResults === 1 ? '' : 's'}`;
              tool.complete = true;
            }
          }
        });
        this.ask.on('complete', onComplete);
        this.ask.explain(message, this.$refs.vchat.threadId).catch(onError);
      });
    },
    async loadAppMapStats() {
      const rpc = this.rpcClient();
      this.appmapStats = await rpc.appmapStats();
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
    toggleDiagonstics() {
      this.showDiagnostics = !this.showDiagnostics;
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
  },
  async mounted() {
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
  min-height: 100%;
  max-height: 100vh;
  height: 100%;
  overflow-y: hidden;
  background-color: $gray2;

  .chat-container {
    overflow: hidden;
    min-width: 375px;
    width: 40vw;

    display: flex;
    flex-direction: column;

    background: radial-gradient(circle, lighten($gray2, 10%) 0%, rgba(0, 0, 0, 0) 80%);
    background-repeat: no-repeat, repeat, repeat;
    background-size: 100% 200%;

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
    padding: 0 1rem;
    margin: 1rem auto;
  }

  .search-container {
    max-height: 100vh;
    h2 {
      font-size: 1.2rem;
      margin-bottom: 0.4rem;
    }

    .search-results-header {
      padding: 0 1rem;
      display: grid;
      grid-template-columns: 1fr auto;
      margin-bottom: 1rem;
    }

    .search-results-list-container {
      display: flex;
      flex-direction: column;
      justify-content: end;

      .search-results-list {
        margin: 0.5rem 0;
        width: 30em;
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

    .appmap {
      overflow-y: auto;
      height: 100% !important;
    }

    .appmap-empty {
      height: 100%;
      background-color: $black;
      margin-top: 0rem;
    }
  }
}

.diagnostics {
  background-color: $black;
  padding: 0.5rem;
  margin-left: -1rem; // Hack around v-accordion padding
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  a {
    color: $brightblue;
    text-decoration: none;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    color: $gray6;
  }
}
</style>
