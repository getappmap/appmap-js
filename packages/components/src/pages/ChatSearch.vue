<template>
  <div
    class="chat-search-container"
    @mousemove="makeResizing"
    @mouseup="stopResizing"
    @mouseleave="stopResizing"
  >
    <div class="chat-container" ref="chatContainer">
      <v-chat
        class="chat-search-chat"
        ref="vchat"
        :send-message="sendMessage"
        :status-label="searchStatusLabel"
        @clear="clear"
      />
    </div>
    <div class="chat-search-container--drag" @mousedown="startResizing"></div>
    <div class="search-container">
      <div class="search-results-container">
        <h2>AppMap search results</h2>
        <div v-if="searchResponse">
          <div class="search-results-header">
            <i>
              Showing top {{ searchResponse.results.length }} of
              {{ searchResponse.numResults }}
            </i>
          </div>

          <div class="search-results-list-container">
            <div class="search-results-list-label">AppMaps:</div>
            <select class="search-results-list" v-model="selectedSearchResultId">
              <option v-for="result in searchResponse.results" :value="result.id" :key="result.id">
                {{ result.metadata.name || result.appmap }}
              </option>
            </select>
          </div>
        </div>
        <div class="search-results-header" v-else>
          <i v-if="!searching">Start a conversation to find and explore AppMaps</i>
          <i v-else>Searching...</i>
        </div>
      </div>
      <v-app-map
        v-if="selectedSearchResult"
        ref="vappmap"
        class="appmap"
        :hide-details-panel="true"
      >
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
import Search from '@/lib/Search';
import Index from '@/lib/Index';

export default {
  name: 'v-chat-search',
  components: {
    VChat,
    VAppMap,
    VAccordion,
  },
  props: {
    aiPort: {
      type: Number,
    },
    indexPort: {
      type: Number,
    },
    // Provide a custom search function, e.g. for mocking
    searchFn: {
      type: Function,
    },
    // Provide a custom index function, e.g. for mocking
    indexFn: {
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
    selectedSearchResultId: async function (newVal) {
      const updateAppMapData = async () => {
        // Something like this may be needed to successfully show the AppMap after
        // "New Chat", but since this isn't working yet, it's commented out.
        // if (!this.defaultState) {
        //   const store = this.vappmap.$store;
        //   this.defaultState = { ...store.state };
        // }

        if (!newVal) {
          // for (const key of Object.keys(this.vappmap.$store.state)) {
          //   this.vappmap.$store[key] = this.defaultState[key];
          // }
          this.vappmap.resetDiagram();
          return;
        }

        const index = this.newIndex();
        const searchResult = this.selectedSearchResult;
        const appmapData = await index.appmapData(searchResult.appmap);
        this.vappmap.loadData(appmapData);
        for (const event of searchResult.events) {
          this.vappmap.setSelectedObject(event.fqid);
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
    vchat() {
      return this.$refs.vchat as VChat;
    },
    vappmap() {
      return this.$refs.vappmap as VsCodeExtensionVue;
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
  },
  methods: {
    async sendMessage(message: string, ack: AckCallback) {
      const search = this.newSearch();
      const index = this.newIndex();
      const ask = search.ask();
      this.searching = true;
      this.lastStatusLabel = undefined;
      ask.on('ack', ack);
      ask.on('token', (token, messageId) => {
        this.vchat.addToken(token, messageId);
      });
      ask.on('error', (error) => {
        this.searching = false;
        this.vchat.addMessage(false, error);
      });
      ask.on('status', (status) => {
        this.searchStatus = status;
      });
      ask.on('complete', async () => {
        this.searching = false;
        this.vchat.onComplete();
        const searchResponse = await search.searchResults();
        let resultId = 0;
        for (const result of searchResponse.results) {
          const metadata = await index.appmapMetadata(result.appmap);
          (result as any).id = ['search-result', this.searchId, resultId].join('_');
          (result as any).metadata = metadata;
          resultId += 1;
        }
        this.searchResponse = searchResponse;
        this.selectedSearchResultId = searchResponse.results[0].id;
      });
      ask.ask(message, this.vchat.threadId);
    },
    clear() {
      this.searchResponse = undefined;
      this.selectedSearchResult = undefined;
    },
    toggleDiagonstics() {
      this.showDiagnostics = !this.showDiagnostics;
    },
    newSearch(): Search {
      this.searchId += 1;
      return new Search(this.searchFn ? { request: this.searchFn } : this.aiPort || 30102);
    },
    newIndex(): Index {
      return new Index(this.indexFn ? { request: this.indexFn } : this.indexPort || 30101);
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

    .chat-search-chat {
      min-width: auto;
      border-right: 1px solid $border-color;
      margin: 0;
      max-width: none !important;
    }
  }
  .chat-search-container--drag {
    width: 3px;
    background: darken($gray4, 10%);
    cursor: col-resize;
    z-index: 100;

    &:hover {
      background: $gray5;
    }
  }
  .search-container {
    font-size: 1rem;
    color: white;
    padding: 0 1rem 1rem 2rem;
    flex: 2;
    display: flex;
    flex-direction: column;
    overflow-y: auto;

    h2 {
      font-size: 1.2rem;
      margin-bottom: 0.4rem;
    }

    .search-results-header {
      font-size: 1.1rem;
      color: $gray4;
      margin: 0.5rem 0 0.5rem 0.05rem;
    }

    .search-results-list-container {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-content: center;
      margin-bottom: 0.5rem;

      .search-results-list-label {
        align-self: center;
        margin-right: 1rem;
      }

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
      border-radius: 10px;
      border: 2px solid $border-color;
    }

    .appmap-empty {
      height: 100%;
      background-color: darken($gray2, 3%);
      border-radius: 10px;
      margin-top: 0rem;
    }
  }
}

.diagnostics {
  background-color: $gray3;
  margin-top: 1rem;
  padding: 0.5rem;

  a {
    color: $lightblue;
    text-decoration: none;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    color: $gray6;
  }
}

.diagnostics {
  .accordion__header,
  .accordion__body {
    padding: 0.5rem 0;
  }
}
</style>
