<template>
  <div class="chat-search-container">
    <div class="chat-container">
      <v-chat class="chat-search-chat" ref="vchat" :send-message="sendMessage" @clear="clear" />
    </div>
    <div class="search-container">
      <div class="search-results-container">
        <h2>AppMap search results</h2>
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
        <div v-else>
          <div v-if="!searching">Start a conversation to find and explore AppMaps</div>
          <div v-else>Searching...</div>
        </div>
      </div>
      <v-app-map v-if="selectedSearchResult" ref="vappmap" class="appmap"> </v-app-map>
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
  .search-container {
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

    .appmap {
      overflow-y: auto;
      width: 100%;
      border-radius: 10px;
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
</style>
<style lang="scss">
.diagnostics {
  .accordion__header,
  .accordion__body {
    padding: 0.5rem 0;
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
