<template>
  <div class="chat-search-container">
    <v-chat class="chat" :api-key="apiKey" :api-url="apiUrl"> </v-chat>
    <vs-code-extension-vue class="appmap"> </vs-code-extension-vue>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VChat from '@/pages/Chat.vue';
import VsCodeExtensionVue from './VsCodeExtension.vue';
import { DefaultApiURL } from '@appland/client';

export default {
  name: 'v-chat-search',
  components: {
    VChat,
    VsCodeExtensionVue,
  },
  props: {
    apiKey: {
      type: String,
    },
    apiUrl: {
      type: String,
      default: DefaultApiURL,
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-search-container {
  display: flex;
  flex-direction: row;
}

.chat {
}

.appmap {
}
</style>
