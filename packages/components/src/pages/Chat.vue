<template>
  <div class="chat-container">
    <v-chat ref="vchat" class="chat" />
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
      const systemMessage = vchat.addSystemMessage();
      const client = await this.aiClient({
        onAck: (_messageId: string, threadId: string) => {
          myThreadId = threadId;
          vchat.onAck(_messageId, threadId);
        },
        onToken: (token, messageId) => {
          if (!systemMessage.messageId) systemMessage.messageId = messageId;

          vchat.addToken(token, myThreadId, messageId);
        },
        onError(error: Error) {
          vchat.onError(error, systemMessage);
        },
        onComplete() {
          systemMessage.complete = true;
        },
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
  background-color: #292c39;
}
</style>
