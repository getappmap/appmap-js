<template>
  <div class="chat-search-container">
    <div class="chat-container">
      <v-chat class="chat-search-chat" ref="vchat" :send-message="sendMessage" @clear="clear" />
    </div>
    <div class="chat-search-appmaps">
      <div class="chat-search-search-results">
        <h2>AppMap search results</h2>
        <ul v-if="searchResponse.numResults">
          <span>
            <i>
              Showing top {{ searchResponse.results.length }} of
              {{ searchResponse.numResults }}
            </i>
          </span>
          <li v-for="result in searchResponse.results" :key="result.id">
            <a href="#" @click.prevent="selectedSearchResult = result">
              {{ result.metadata.name || result.appmap }}
            </a>
          </li>
        </ul>
        <p v-else>Start a conversation to find and explore AppMaps</p>
      </div>
      <v-app-map v-if="selectedSearchResult" ref="vappmap" class="chat-search-appmap"> </v-app-map>
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
      searchResponse: { numResults: 0, results: [] },
      selectedSearchResult: undefined,
    };
  },
  watch: {
    selectedSearchResult: async function (newVal) {
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
        const appmapData = await index.appmapData(newVal.appmap);
        this.vappmap.loadData(appmapData);
        for (const result of newVal.events) {
          this.vappmap.setSelectedObject(result.fqid);
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
  },
  methods: {
    async sendMessage(message: string, ack: AckCallback) {
      const search = this.newSearch();
      const index = this.newIndex();
      const ask = search.ask();
      ask.on('ack', ack);
      ask.on('token', (token, messageId) => {
        this.vchat.addToken(token, messageId);
      });
      ask.on('error', (error) => {
        this.vchat.addMessage(false, error);
      });
      ask.on('complete', async () => {
        this.vchat.onComplete();
        const searchResponse = await search.searchResults();
        for (const result of searchResponse.results) {
          const metadata = await index.appmapMetadata(result.appmap);
          (result as any).metadata = metadata;
        }
        this.searchResponse = searchResponse;
        this.selectedSearchResult = searchResponse.results[0];
      });
      ask.ask(message, this.vchat.threadId);
    },
    clear() {
      this.searchResponse = { numResults: 0, results: [] };
      this.selectedSearchResult = undefined;
    },
    newSearch(): Search {
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
  min-height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  background-color: $gray2;
  .chat-container {
    overflow: auto;
    width: 40%;
    min-width: 375px;
    .chat-search-chat {
      min-width: auto;
      width: 95%;
      flex: 1;
    }
  }
  .chat-search-appmaps {
    font-size: 1rem;
    height: 100vh;
    color: white;
    padding: 0 1rem 1rem 0;
    flex: 2;
    display: flex;
    flex-direction: column;
    .chat-search-search-results {
      padding: 0 0 1rem 1rem;
      ul {
        padding-left: 1rem;
      }
      li {
        margin: 4px 0;
        list-style-type: none;
        cursor: pointer;
      }
      a {
        color: $gray6;
      }
    }
    .chat-search-appmap {
      overflow-y: auto;
      width: 100%;
      border-radius: 10px;
    }
  }
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
