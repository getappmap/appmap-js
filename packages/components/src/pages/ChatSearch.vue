<template>
  <div class="chat-search-container">
    <v-chat class="chat-search-chat" ref="vchat" :send-message="sendMessage" @clear="clear">
    </v-chat>
    <div class="chat-search-appmaps">
      <div class="chat-search-search-results">
        <h2>AppMap search results</h2>
        <div v-if="searching">
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
          </ul>
        </div>
        <div v-if="searchResponse">
          <div>
            <i>
              Showing top {{ searchResponse.results.length }} of
              {{ searchResponse.numResults }}
            </i>
          </div>

          <select class="search-results-list" v-model="selectedSearchResultId">
            <option v-for="result in searchResponse.results" :value="result.id" :key="result.id">
              {{ result.metadata.name || result.appmap }}
            </option>
          </select>
        </div>
        <p v-else>Start a conversation to find and explore AppMaps</p>
      </div>
      <div v-if="selectedSearchResult">
        <v-app-map ref="vappmap" class="chat-search-appmap"> </v-app-map>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VChat from '@/components/chat/Chat.vue';
import VAppMap from './VsCodeExtension.vue';
import Search from '@/lib/Search';
import Index from '@/lib/Index';

export default {
  name: 'v-chat-search',
  components: {
    VChat,
    VAppMap,
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
    };
  },
  watch: {
    selectedSearchResultId: async function (newVal, _oldVal) {
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
  },
  computed: {
    vchat() {
      return this.$refs.vchat as VChat;
    },
    vappmap() {
      return this.$refs.vappmap as VsCodeExtensionVue;
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
    newSearch(): Search {
      this.searchId += 1;
      return new Search(this.searchFn ? { request: this.searchFn } : this.aiPort || 30102);
    },
    newIndex(): Index {
      return new Index(this.indexFn ? { request: this.indexFn } : this.indexPort || 30101);
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-search-container {
  display: flex;
  flex-direction: row;
  min-width: 100%;
  max-width: 100%;
  min-height: 100%;
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: $gray2;
}

.chat-search-search-results {
  .search-results-list {
    margin: 1rem 0;
    width: 30em;
  }
}

.chat-search-chat {
  min-width: auto;
  width: 50%;
  flex: 1;
  padding: 2rem;
}

.chat-search-appmaps {
  font-size: 1rem;
  color: white;
  flex: 2;
}

// TODO: It's not great that these styles need to be overridden and referenced as the id 'app'.
// This could be made more integartion-friendly by refactoring VsCodeExtension.vue into an
// id-less reusable component plus a wrapper class that adds the id.
#app .main-column--left {
  width: auto;
}
#app .main-column--right {
  width: auto;
}
</style>
