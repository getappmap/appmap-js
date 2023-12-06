<template>
  <div class="chat-container">
    <v-chat ref="vchat" class="chat" :send-message="sendMessage" />
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VChat from '@/components/chat/Chat.vue';
import { AckCallback } from '@/components/chat/UserMessageHandler';
import { AI, setConfiguration, DefaultApiURL } from '@appland/client';

export default {
  name: 'v-chat-page',
  components: {
    VChat,
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
  watch: {
    apiKey() {
      this.updateConfiguration();
    },
  },
  computed: {
    clientConfiguration() {
      return {
        apiKey: this.apiKey,
      };
    },
    vchat() {
      return this.$refs.vchat as VChat;
    },
  },
  methods: {
    async sendMessage(message: string, ack: AckCallback) {
      const { vchat } = this;
      const client = await AI.connect({
        onAck: ack,
        onToken: (token, messageId) => {
          this.vchat.addToken(token, messageId);
        },
        onError: (error) => {
          this.vchat.addMessage(false, error);
        },
      });
      client.inputPrompt(message, { threadId: vchat.threadId });
    },
    updateConfiguration() {
      setConfiguration({ apiKey: this.apiKey, apiURL: this.apiUrl });
    },
  },
  mounted() {
    this.updateConfiguration();
  },
};
</script>

<style lang="scss" scoped>
.chat-container {
  min-width: 100%;
  max-width: 100%;
  min-height: 100%;
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: $gray2;
}
</style>
