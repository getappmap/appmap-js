<template>
  <div class="chat">
    <div class="button-panel" v-if="isChatting">
      <v-button class="clear" size="small" kind="ghost" @click.native="clear">New chat</v-button>
    </div>
    <div class="messages" data-cy="messages" ref="messages">
      <v-user-message
        v-for="(message, i) in messages"
        :key="i"
        :message="message.message"
        :is-user="message.isUser"
        :id="message.id"
        :sentiment="message.sentiment"
        @change-sentiment="onSentimentChange"
      />
      <div v-if="loading" class="status-container">
        <div class="spinner-container">
          <v-spinner>
            <v-loader-icon class="status-icon" />
          </v-spinner>
        </div>
        <div class="status-label" v-if="statusLabel" data-cy="explain-status">
          {{ statusLabel }}
        </div>
      </div>
      <v-suggestion-grid @suggest="onSuggestion" v-if="!isChatting" />
    </div>
    <v-chat-input
      @send="onSend"
      :placeholder="inputPlaceholder"
      :class="inputClasses"
      :question="question"
      ref="input"
    />
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VUserMessage from '@/components/chat/UserMessage.vue';
import VChatInput from '@/components/chat/ChatInput.vue';
import VSuggestionGrid from '@/components/chat/SuggestionGrid.vue';
import VSpinner from '@/components/Spinner.vue';
import VLoaderIcon from '@/assets/eva_loader-outline.svg';
import VButton from '@/components/Button.vue';
import { AI } from '@appland/client';

type Message = {
  id?: string;
  isUser: boolean;
  message: string;
  sentiment: number;
};

export default {
  name: 'v-chat',
  components: {
    VUserMessage,
    VChatInput,
    VSuggestionGrid,
    VSpinner,
    VLoaderIcon,
    VButton,
  },
  props: {
    // Initial question to ask
    question: {
      type: String,
    },
    sendMessage: {
      type: Function, // UserMessageHandler
    },
    statusLabel: {
      type: String,
    },
  },
  data() {
    return {
      messages: [] as Message[],
      threadId: undefined as string | undefined,
      loading: false,

      // This is used for differentiating messages not ACK'd by the server.
      // E.g., in a mocked environment.
      pendingMessageId: 0,
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
        id: this.pendingMessageId++,
        isUser,
        message: content || '',
        sentiment: 0,
      };
      this.messages.push(message);

      this.scrollToBottom();
      this.$root.$emit('message', message, isUser);

      return message;
    },
    async ask(message: string) {
      this.onSend(message);
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
        this.$refs.messages.scrollTop = this.$refs.messages.scrollHeight;
      });
    },
    async onSentimentChange(messageId: string, sentiment: number) {
      if (!messageId) return;

      const message = this.messages.find((m) => m.id === messageId);
      if (!message || message.sentiment === sentiment) return;

      await AI.sendMessageFeedback(message.id, sentiment);

      message.sentiment = sentiment;
    },
  },
  updated() {
    this.scrollToBottom();
  },
};
</script>

<style lang="scss" scoped>
$border-color: darken($gray4, 10%);

.chat {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  padding: 0;
  max-width: 58rem;
  margin: 0 auto;

  ::-webkit-scrollbar-thumb {
    width: 2px;
    background-color: rgba(255, 255, 255, 0.2) !important;
  }

  ::-webkit-scrollbar-track {
    border-radius: 0 0 $border-radius $border-radius;
    background-color: transparent !important;
  }

  .button-panel {
    $panel-bg: rgba(0, 0, 0, 0.1);
    position: relative;
    justify-content: end;
    display: flex;
    width: 100%;
    padding: 0.25rem 0.5rem;
    background-color: $panel-bg;
    border-bottom: 1px solid fade-in($panel-bg, 0.11);
  }

  .clear {
    //   color: white;
    //   cursor: pointer;
    padding: 0.5rem 1rem;
    //   text-align: right;
    //   border: none;
    //   border-radius: 10px;
    //   background-color: lighten($gray3, 5%);
    //   &:hover {
    //     background-color: lighten($gray3, 10%);
    //     transition: all 0.2s ease-in-out;
    //   }
  }
  .messages {
    height: 100%;
    overflow: auto;
    padding-right: 1rem;
  }
  ::-webkit-scrollbar-thumb {
    background: lighten($gray4, 25%);
  }
  ::-webkit-scrollbar-thumb:hover,
  ::-webkit-scrollbar-thumb:active {
    background: white;
  }
  ::-webkit-scrollbar-track {
    background: $border-color;
  }
}

.status-container {
  display: inline-block;
  position: relative;
  left: 54px;
  margin: -4px 0.5em -4px 0.5em;
  display: flex;
  width: 18rem;

  .spinner-container {
    .spinner {
      height: 22px;
      width: 22px;
    }
  }

  .status-label {
    margin-left: 0.5rem;
    color: white;
  }

  path {
    fill: $lightblue;
  }

  &--failure path {
    fill: $bad-status;
  }
}
</style>
