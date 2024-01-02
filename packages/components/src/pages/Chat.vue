<template>
  <div class="chat-container">
    <v-chat ref="vchat" class="chat" :send-message="sendMessage" :suggestions="suggestions" />
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VChat from '@/components/chat/Chat.vue';
import { AI, AIClient } from '@appland/client';
import authenticatedClient from '@/components/mixins/authenticatedClient';

export default {
  name: 'v-chat-page',
  components: {
    VChat,
  },
  props: {
    suggestions: {
      type: Array,
      required: false,
    },
    aiClientFn: {
      type: Function,
    },
  },
  mixins: [authenticatedClient],
  computed: {
    vchat() {
      return this.$refs.vchat as VChat;
    },
  },
  methods: {
    async sendMessage(message: string) {
      const { vchat } = this;
      let myThreadId: string | undefined;
      const client = await this.aiClient({
        onAck: (_messageId: string, threadId: string) => {
          myThreadId = threadId;
          vchat.onAck(_messageId, threadId);
        },
        onToken: (token, messageId) => {
          vchat.addToken(token, myThreadId, messageId);
        },
        onError: vchat.onError.bind(vchat),
        onComplete: vchat.onComplete.bind(vchat),
      });
      client.inputPrompt(message, { threadId: vchat.threadId });
    },
    async aiClient(callbacks: Callbacks): Promise<AIClient> {
      return this.aiClientFn ? this.aiClientFn(callbacks) : AI.connect(callbacks);
    },
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
