<template>
  <div class="chat">
    <div class="button-panel" v-if="isChatting">
      <v-button class="clear" size="small" kind="ghost" @click.native="clear">New chat</v-button>
    </div>
    <div class="messages" data-cy="messages" ref="messages">
      <v-user-message
        v-for="(message, i) in messages"
        :key="i"
        :message="message.content"
        :is-user="message.isUser"
        :is-error="message.isError"
        :id="message.messageId"
        :sentiment="message.sentiment"
        :complete="message.complete"
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
      <v-suggestion-grid :suggestions="suggestions" @suggest="onSuggestion" v-if="!isChatting" />
    </div>
    <div v-if="!authorized" class="status-unauthorized status-container">
      <div class="status-label">
        <p>You must be logged in to AppMap to use this feature.</p>
        <p>
          <b>VSCode</b>
          To login with VSCode, run the command <tt>AppMap: Login</tt>, or click the Sign In link
          from the AppMap panel.
        </p>
        <p>
          <b>JetBrains</b>
          To login with JetBrains, click the Sign In link from the AppMap panel.
        </p>
      </div>
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
import Vue from 'vue';
import VUserMessage from '@/components/chat/UserMessage.vue';
import VChatInput from '@/components/chat/ChatInput.vue';
import VSuggestionGrid from '@/components/chat/SuggestionGrid.vue';
import VSpinner from '@/components/Spinner.vue';
import VLoaderIcon from '@/assets/eva_loader-outline.svg';
import VButton from '@/components/Button.vue';
import { AI } from '@appland/client';

interface IMessage {
  message: string;
  isUser: boolean;
  isError: boolean;
  messageId?: string;
  sentiment?: number;
  complete?: boolean;
}

class UserMessage implements IMessage {
  public readonly messageId = undefined;
  public readonly sentiment = undefined;
  public readonly isUser = true;
  public readonly isError = false;
  public readonly complete = true;

  constructor(public content: string) {}
}

class AssistantMessage implements IMessage {
  public content = '';
  public sentiment = undefined;
  public readonly isUser = false;
  public readonly isError = false;
  public complete = false;

  constructor(public messageId: string) {}

  append(token: string) {
    Vue.set(this, 'content', [this.content, token].join(''));
  }
}

class ErrorMessage implements IMessage {
  public readonly messageId = undefined;
  public readonly sentiment = undefined;
  public readonly isUser = false;
  public readonly isError = true;

  constructor(private error: Error) {}

  get content() {
    return this.error.message;
  }
}

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
    suggestions: {
      type: Array,
      required: false,
    },
  },
  data() {
    return {
      messages: [] as IMessage[],
      threadId: undefined as string | undefined,
      loading: false,
      authorized: true,
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
    getMessage(query: Partial<IMessage>) {
      return this.messages.find((m) => {
        for (const key in query) {
          if (m[key] !== query[key]) return false;
        }
        return true;
      });
    },
    // Creates-or-appends a message.
    addToken(token: string, threadId: string, messageId: string) {
      if (threadId !== this.threadId) return;

      if (!messageId) console.warn('messageId is undefined');
      if (!threadId) console.warn('threadId is undefined');

      let assistantMessage = this.messages.find((m) => m.messageId && m.messageId === messageId);
      if (!assistantMessage) {
        assistantMessage = new AssistantMessage(messageId);
        this.messages.push(assistantMessage);
      }

      assistantMessage.append(token);
      this.scrollToBottom();
    },
    setAuthorized(v: boolean) {
      this.authorized = v;
    },
    addUserMessage(content: string) {
      this.messages.push(new UserMessage(content));
      this.scrollToBottom();
    },
    addErrorMessage(error: Error) {
      this.messages.push(new ErrorMessage(error));
      this.scrollToBottom();
    },
    async ask(message: string) {
      this.onSend(message);
    },
    onError(error) {
      if (error.code === 401) {
        this.setAuthorized(false);
      } else {
        this.addErrorMessage(error);
      }
      this.loading = false;
    },
    async onSend(message: string) {
      this.addUserMessage(message);
      this.loading = true;
      this.sendMessage(message);
    },
    onAck(messageId: string, threadId: string) {
      this.setAuthorized(true);
      const message = this.getMessage({ messageId: undefined, isUser: true });
      if (message) message.messageId = messageId;
      this.threadId = threadId;
    },
    onSuggestion(prompt: string) {
      // Make it look like the AI is typing
      const assistantMessage = new AssistantMessage('suggested-message');
      assistantMessage.append(prompt);
      this.messages.push(assistantMessage);
    },
    onComplete(messageId: string) {
      const message = this.getMessage({ messageId, isUser: false });
      console.log('onComplete', messageId, message, this.messages);
      if (message) {
        message.complete = true;
      }
      this.loading = false;
    },
    clear() {
      this.threadId = undefined;
      this.messages.splice(0);
      this.loading = false;
    },
    scrollToBottom() {
      // Allow one tick to progress to allow any DOM changes to be applied
      this.$nextTick(() => {
        this.$refs.messages.scrollTop = this.$refs.messages.scrollHeight;
      });
    },
    async onSentimentChange(messageId: string, sentiment: number) {
      if (!messageId) return;

      const message = this.getMessage(messageId);
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
    justify-content: end;
    display: flex;
    padding: 0.25rem 0.5rem;
    background-color: $panel-bg;
    border-bottom: 1px solid fade-in($panel-bg, 0.11);
  }

  .clear {
    padding: 0.5rem 1rem;
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
