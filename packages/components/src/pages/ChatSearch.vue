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
      />
    </div>
    <div
      class="chat-search-container--drag"
      data-cy="resize-handle"
      @mousedown="startResizing"
    ></div>
    <div class="search-container">
      <div class="search-results-container">
        <div class="search-results-header">
          <div>
            <h2>AppMap search results</h2>
            <div v-if="searchResponse">
              <div class="search-results-subheader">
                Showing top {{ searchResponse.results.length }} of
                {{ searchResponse.numResults }}
              </div>
            </div>
            <div class="search-results-subheader" v-else>
              <p v-if="!searching">Start a conversation to find and explore AppMaps</p>
              <p v-else>Searching...</p>
            </div>
          </div>
          <div class="search-results-list-container" v-if="searchResponse">
            <select
              class="search-results-list"
              v-model="selectedSearchResultId"
              v-if="selectedSearchResultId"
              data-cy="appmap-list"
            >
              <option v-for="result in searchResponse.results" :value="result.id" :key="result.id">
                {{ result.metadata.name || result.appmap }}
              </option>
            </select>
          </div>
        </div>
      </div>
      <v-app-map v-if="selectedSearchResult" :allow-fullscreen="true" ref="vappmap" class="appmap">
      </v-app-map>
      <div v-else class="appmap-empty"></div>
      <v-accordion class="diagnostics" :open="showDiagnostics" @toggle="toggleDiagonstics">
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
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VChat from '@/components/chat/Chat.vue';
import VAccordion from '@/components/Accordion.vue';
import VAppMap from './VsCodeExtension.vue';
import AppMapRPC from '@/lib/AppMapRPC';

export default {
  name: 'v-chat-search',
  components: {
    VChat,
    VAppMap,
    VAccordion,
  },
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
      searchStatusLabels: {
        'build-vector-terms': 'Optimizing search terms',
        'search-appmaps': 'Searching AppMaps',
        'collect-context': 'Collecting context',
        'expand-context': 'Expanding context',
        'build-prompt': 'Building prompt',
        explain: 'Explaining with AI',
      },
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
      if (searchResponse.results.length > 0)
        this.selectedSearchResultId = searchResponse.results[0].id;
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
        for (const event of searchResult.events) {
          this.$refs.vappmap.setSelectedObject(event.fqid);
        }
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
    async sendMessage(message: string, ack: AckCallback) {
      const search = this.rpcClient();
      const ask = search.explain();
      this.searching = true;
      this.lastStatusLabel = undefined;

      return new Promise((resolve, reject) => {
        const onComplete = () => {
          this.searching = false;
          this.$refs.vchat.onComplete();
          resolve();
        };

        const onError = (error) => {
          onComplete();
          this.$refs.vchat.onError(error);
          reject();
        };

        ask.on('ack', ack);
        ask.on('token', (token, messageId) => {
          this.$refs.vchat.addToken(token, messageId);
        });
        ask.on('error', onError);
        ask.on('status', (status) => {
          this.searchStatus = status;
          if (!this.searchResponse && status.searchResponse)
            this.searchResponse = status.searchResponse;
        });
        ask.on('complete', onComplete);
        ask.explain(message, this.$refs.vchat.threadId).catch(onError);
      });
    },
    clear() {
      this.searchResponse = undefined;
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
};
</script>

<style lang="scss" scoped>
$border-color: darken($gray4, 10%);

.chat-search-container {
  display: flex;
  flex-direction: row;
  min-width: 100%;
  max-width: 100%;
  min-height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  background-color: $gray2;

  .chat-container {
    overflow: hidden;
    width: 40%;
    min-width: 375px;

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
  .search-container {
    font-size: 1rem;
    color: $white;
    // padding: 0 1rem 1rem 2rem;
    flex: 2;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    background-color: $black;

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

    .search-results-subheader {
      font-size: 0.8rem;
      color: $gray4;
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
