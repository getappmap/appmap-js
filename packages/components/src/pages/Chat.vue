<template>
  <div class="chat-container">
    <div class="chat">
      <small class="clear" @click="clear" v-if="isChatting">New chat</small>
      <v-user-message
        v-for="(message, i) in messages"
        :key="i"
        :message="message.message"
        :is-user="message.isUser"
      />
      <v-chat-input
        @send="onSend"
        :placeholder="inputPlaceholder"
        :class="inputClasses"
        ref="input"
      />
      <v-suggestion-grid @suggest="onSuggestion" v-if="!isChatting" />
    </div>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VUserMessage from '@/components/chat/UserMessage.vue';
import VChatInput from '@/components/chat/ChatInput.vue';
import VSuggestionGrid from '@/components/chat/SuggestionGrid.vue';
import { AI, setConfiguration, DefaultApiURL } from '@appland/client';

type Message = {
  id?: string;
  isUser: boolean;
  message: string;
  attachments?: string[];
};

export default {
  name: 'v-chat',
  components: {
    VUserMessage,
    VChatInput,
    VSuggestionGrid,
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
  data() {
    return {
      messages: [] as Message[],
      threadId: undefined as string | undefined,
    };
  },
  computed: {
    inputPlaceholder() {
      return 'Where do you want to go?';
    },
    isChatting(): boolean {
      return this.messages.length > 0;
    },
    inputClasses() {
      return {
        chatting: this.isChatting,
      };
    },
    clientConfiguration() {
      return {
        apiKey: this.apiKey,
      };
    },
  },
  methods: {
    onReceiveToken(token: string, messageId: string) {
      let systemMessage = this.messages.find((m) => m.id === messageId);
      if (!systemMessage) {
        systemMessage = this.addMessage(false);
        systemMessage.id = messageId;
      }
      systemMessage.message += token;
      this.scrollToBottom();
    },
    addMessage(isUser: boolean, content?: string) {
      const message = {
        isUser,
        message: content || '',
      };
      this.messages.push(message);

      this.scrollToBottom();
      this.$root.$emit('message', message, isUser);

      return message;
    },
    async onSend(message: string) {
      const userMessage = this.addMessage(true, message);
      const client = await AI.connect({
        onAck: (messageId, threadId) => {
          userMessage.id = messageId;
          this.threadId = threadId;
        },
        onToken: (token, messageId) => {
          this.onReceiveToken(token, messageId);
        },
        onError: (error) => {
          this.addMessage(false, error);
        },
      });
      client.inputPrompt(message, { threadId: this.threadId });
    },
    onReceive(message: string) {
      this.addMessage(message, false);
    },
    onSuggestion(prompt: string) {
      // Make it look like the AI is typing
      this.addMessage(prompt, false);
    },
    clear() {
      this.threadId = undefined;
      this.$set(this, 'messages', []);
    },
    scrollToBottom() {
      // Allow one tick to progress to allow any DOM changes to be applied
      this.$nextTick(() => {
        this.$el.scrollTop = this.$el.scrollHeight;
      });
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

.chat {
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 100%;
  padding: 1rem;
  max-width: 58rem;
  margin: 0 auto;
  padding-bottom: 5rem;

  .chatting {
    position: fixed;
    bottom: 0;
    left: 2rem;
    right: 2rem;
    max-width: 58rem;
    margin: 0 auto;
  }

  .clear {
    color: #0097fa;
    cursor: pointer;
    margin-left: auto;
    position: fixed;
    top: 1rem;
    max-width: 58rem;
    width: 100%;
    padding-right: 2rem;
    text-align: right;

    &:hover {
      color: lighten(#0097fa, 10%);
      text-decoration: underline;
    }
  }
}
</style>
