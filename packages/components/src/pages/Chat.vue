<template>
  <div class="chat-container">
    <v-chat ref="vchat" class="chat" :send-message="sendMessage" :suggestions="suggestions" />
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VChat from '@/components/chat/Chat.vue';
import { AIClient } from '@appland/client';
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
    suggestions: {
      type: Array,
      required: false,
    },
    aiClientFn: {
      type: Function,
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
    async sendMessage(message: string) {
      const { vchat } = this;
      let myThreadId: string | undefined;
      let newMessageId: string | undefined;
      const client = await this.aiClient({
        onAck: (messageId: string, threadId: string) => {
          myThreadId = threadId;
          vchat.onAck(messageId, threadId);
        },
        onToken: (token, messageId) => {
          newMessageId = messageId;
          vchat.addToken(token, myThreadId, messageId);
        },
        onError: vchat.onError.bind(vchat),
        onComplete: () => vchat.onComplete(newMessageId),
      });
      client.inputPrompt(message, { threadId: vchat.threadId });
    },
    async aiClient(callbacks: Callbacks): Promise<AIClient> {
      return this.aiClientFn ? this.aiClientFn(callbacks) : AI.connect(callbacks);
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
  background: radial-gradient(circle, lighten($gray2, 10%) 0%, rgba(0, 0, 0, 0) 80%);
  background-color: $gray2;
  background-repeat: no-repeat, repeat, repeat;
  background-size: 100% 200%;
}
</style>
