<template>
  <div class="chat-container">
    <v-chat
      ref="vchat"
      class="chat"
      suggestion-speaker="user"
      :send-message="sendMessage"
      :suggestions="suggestions"
    />
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
  data() {
    return {
      suggestions: [
        {
          title: 'Getting started with AppMap',
          subTitle: 'First time with AppMap? Navie will help you get up and running smoothly.',
          prompt:
            'Provide me with step by step instructions for installing the AppMap agent and recording my first AppMap.',
        },
        {
          title: 'Learn about AppMap',
          subTitle: 'Navie can teach you new ways to streamline your workflow using AppMap',
          prompt:
            'What are some useful ways that I can use AppMap to improve my workflow? What are some best practices?',
        },
        {
          title: 'Bring AppMap to your team',
          subTitle: `Learn about different ways to integrate AppMap into your team's workflow.`,
          prompt: `What are some ways that I can integrate AppMap into my teams workflow?`,
        },
        {
          title: 'Enhance the performance of AppMap',
          subTitle:
            'Navie can help you optimize AppMap for better efficiency in large-scale and complex projects.',
          prompt:
            'How can I configure `appmap.yml` to speed up instrumentation and exclude noisy or irrelevant data from my recordings?',
        },
      ],
    };
  },
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
