<template>
  <div class="chat">
    <small class="clear" @click="clear" v-if="isChatting">New chat</small>
    <div class="messages">
      <v-user-message
        v-for="(message, i) in messages"
        :key="i"
        :message="message.message"
        :is-user="message.isUser"
      />
      <v-spinner v-if="loading" class="status-container">
        <v-loader-icon class="status-icon" />
      </v-spinner>
      <v-suggestion-grid @suggest="onSuggestion" v-if="!isChatting" />
    </div>
    <v-chat-input
      @send="onSend"
      :placeholder="inputPlaceholder"
      :class="inputClasses"
      ref="input"
    />
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VUserMessage from '@/components/chat/UserMessage.vue';
import VChatInput from '@/components/chat/ChatInput.vue';
import VSuggestionGrid from '@/components/chat/SuggestionGrid.vue';
import { UserMessageHandler } from '@/components/chat/UserMessageHandler';
import VSpinner from '@/components/Spinner.vue';
import VLoaderIcon from '@/assets/eva_loader-outline.svg';

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
    VSpinner,
    VLoaderIcon,
  },
  props: {
    sendMessage: {
      type: UserMessageHandler,
    },
  },
  data() {
    return {
      messages: [] as Message[],
      threadId: undefined as string | undefined,
      loading: false,
    };
  },
  computed: {
    inputPlaceholder() {
      return 'How can I help?';
    },
    isChatting(): boolean {
      return this.messages.length > 0;
    },
    inputClasses() {
      return {
        chatting: this.isChatting,
      };
    },
  },
  methods: {
    addToken(token: string, messageId: string) {
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
      this.addMessage(true, message);
      this.loading = true;
      this.sendMessage(message, (_messageId: string, threadId: string) => {
        this.threadId = threadId;
        this.$root.$emit('send', message, { threadId });
      });
    },
    onSuggestion(prompt: string) {
      // Make it look like the AI is typing
      this.addMessage(false, prompt);
    },
    onComplete() {
      this.loading = false;
    },
    clear() {
      this.threadId = undefined;
      this.$set(this, 'messages', []);
      this.$emit('clear');
    },
    scrollToBottom() {
      // Allow one tick to progress to allow any DOM changes to be applied
      this.$nextTick(() => {
        this.$el.scrollTop = this.$el.scrollHeight;
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.chat {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  padding: 1rem 0rem 2rem 0rem;
  max-width: 58rem;
  margin: 0 auto;
  .clear {
    color: #0097fa;
    cursor: pointer;
    margin-left: auto;
    margin-bottom: 1rem;
    max-width: 58rem;
    width: 100%;
    padding-right: 3rem;
    text-align: right;
    &:hover {
      color: lighten(#0097fa, 10%);
      text-decoration: underline;
    }
  }
  .messages {
    height: 100%;
    overflow-y: auto;
  }
}

.status-container {
  display: inline-block;
  width: 22px;
  height: 2px;
  margin: -4px 0.5em -4px 0.5em;

  path {
    fill: $lightblue;
  }

  &--failure path {
    fill: $bad-status;
  }
}
</style>
