<template>
  <div class="chat-search-container">
    <v-chat class="chat" ref="vchat" :send-message="sendMessage"> </v-chat>
    <div class="appmaps">
      <div class="appmaps-header">
        <h2>AppMap search results</h2>
        <ul v-if="searchResponse.numResults">
          <span>
            Showing {{ searchResponse.results.length }} of
            {{ searchResponse.numResults }}
          </span>
          <li v-for="result in searchResponse.results" :key="result.id">
            <a href="#" @click.prevent="selectedSearchResult = result">
              {{ result.appmap }}
            </a>
          </li>
        </ul>
        <p v-else>Start a conversation to find and explore AppMaps</p>
      </div>
      <div v-if="selectedSearchResult">
        <v-app-map ref="vappmap" class="appmap"> </v-app-map>
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
  },
  data() {
    return {
      searchResponse: { numResults: 0, results: [] },
      selectedSearchResult: undefined,
    };
  },
  watch: {
    selectedSearchResult: async function (newVal, _oldVal) {
      if (!newVal) return;

      const index = new Index(this.indexPort || 30101);
      const appmapData = await index.appmapData(newVal.appmap);
      this.vappmap.loadData(appmapData);
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
      const search = new Search(this.aiPort || 30102, {
        onAck: ack,
        onToken: (token, messageId) => {
          this.vchat.addToken(token, messageId);
        },
        onError: (error) => {
          this.vchat.addMessage(false, error);
        },
        onComplete: async () => {
          this.vchat.onComplete();
          this.searchResponse = await search.searchResults();
          this.selectedSearchResult = this.searchResponse.results[0];
        },
      });

      search.ask(this.vchat.threadId, message);
    },
    clear() {
      this.searchResponse = { numResults: 0, results: [] };
      this.selectedSearchResult = undefined;
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

.chat {
  min-width: auto;
  width: 50%;
}

.appmaps {
  font-size: 1rem;
  color: white;
}
</style>
