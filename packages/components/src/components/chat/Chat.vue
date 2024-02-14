<template>
  <div class="chat">
    <div class="button-panel" v-if="isChatting">
      <div id="header-logo">
        <v-app-map-navie-logo />
        <div id="header-navie-logo">Navie</div>
      </div>
      <v-button
        data-cy="new-chat-btn"
        class="clear"
        size="small"
        kind="ghost"
        @click.native="clear"
      >
        New chat
      </v-button>
    </div>
    <div class="explainer">
      <slot />
    </div>
    <div
      :class="['messages', isChatting ? 'chatting' : 'not-chatting']"
      data-cy="messages"
      ref="messages"
      @scroll="manageScroll"
    >
      <component
        v-for="(message, i) in messages"
        :key="i"
        :is="message.component"
        v-bind="{ ...message, component: undefined }"
        @change-sentiment="onSentimentChange"
      />
    </div>
    <div v-if="!authorized" class="status-unauthorized status-container">
      <div class="status-label">
        <p>You must have activated AppMap to use this feature.</p>
        <p>
          <b>VSCode</b>
          To activate AppMap for VSCode use the AppMap sidebar, or run the
          <tt>AppMap: Login</tt> command using the command palette.
        </p>
        <p>
          <b>JetBrains</b>
          To activate AppMap for JetBrains, use the AppMap tool window.
        </p>
      </div>
    </div>
    <v-chat-input
      @send="onSend"
      :placeholder="inputPlaceholder"
      :class="inputClasses"
      :question="question"
      :code-selections="codeSelections"
      :disabled="disableInput"
      ref="input"
    />
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import Vue, { Component } from 'vue';
import VUserMessage from '@/components/chat/UserMessage.vue';
import VQuotaExceededMessage from '@/components/chat/QuotaExceededMessage.vue';
import VChatInput from '@/components/chat/ChatInput.vue';
import VModeInstructionCard from '@/components/chat/ModeInstructionCard.vue';
import VAppMapNavieLogo from '@/assets/appmap-full-logo.svg';
import VButton from '@/components/Button.vue';
import { AI, Quota } from '@appland/client';

export type CodeSelection = {
  path: string;
  lineStart: number;
  lineEnd: number;
  code: string;
  language: string;
};

export interface ITool {
  title: string;
  status?: string;
  complete?: boolean;
}

interface IMessageComponent {
  component: Component;
}

interface IMessage extends IMessageComponent {
  id?: string;
  message: string;
  isUser: boolean;
  isError: boolean;
  complete?: boolean;
  sentiment?: number;
  tools?: ITool[];
  codeSelections?: CodeSelection[];
}

class UserMessage implements IMessage {
  public readonly id = undefined;
  public readonly sentiment = undefined;
  public readonly isUser = true;
  public readonly isError = false;
  public readonly tools = undefined;
  public readonly complete = true;
  public readonly codeSelections = [];
  public readonly component = VUserMessage;

  constructor(public content: string) {}
}

class AssistantMessage implements IMessage {
  public content = '';
  public sentiment = undefined;
  public complete = false;
  public readonly isUser = false;
  public readonly isError = false;
  public readonly tools = [];
  public readonly codeSelections = undefined;
  public readonly component = VUserMessage;

  constructor(public id?: string) {}

  append(token: string) {
    Vue.set(this, 'content', [this.content, token].join(''));
  }
}

class ErrorMessage implements IMessage {
  public readonly id = undefined;
  public readonly sentiment = undefined;
  public readonly codeSelections = undefined;
  public readonly complete = true;
  public readonly isUser = false;
  public readonly isError = true;
  public readonly component = VUserMessage;

  constructor(private error: Error) {}

  get content() {
    return this.error.message;
  }
}

type CustomMessageConstructor = {
  component: Component;
  [key: string]: unknown;
};

// This class is used to insert an arbitrary component into the chat.
class CustomMessage {
  public readonly component: Component;
  public readonly [key: string]: unknown;

  constructor(propData: CustomMessageConstructor) {
    Object.assign(this, propData);
  }
}

export default {
  name: 'v-chat',
  components: {
    VUserMessage,
    VChatInput,
    VAppMapNavieLogo,
    VButton,
    VQuotaExceededMessage,
  },
  props: {
    // Initial question to ask
    question: {
      type: String,
    },
    sendMessage: {
      type: Function, // (message: string, codeSelections?: string[]) => void
    },
    inputPlaceholder: {
      type: String,
      default: 'What are you working on today?',
    },
  },
  data() {
    return {
      messages: [] as IMessage[],
      threadId: undefined as string | undefined,
      authorized: true,
      autoScrollTop: 0,
      enableScrollLog: false, // Auto-scroll can be tricky, so there is special logging to help debug it.
      codeSelections: [] as CodeSelection[],
      appmaps: [] as string[],
      scrollLog: (message: string) => (this.enableScrollLog ? console.log(message) : undefined),
      modeInstructions: [
        {
          id: 'explain',
          title: '@explain',
          subTitle:
            'Navie will help you understand your project. This mode is used when there is no prefix.',
          default: true,
        },
        {
          id: 'help',
          title: '@help',
          subTitle:
            'Navie will help you setup AppMap, including generating AppMap recordings and diagrams.',
        },
        {
          id: 'generate',
          title: '@generate',
          subTitle: 'Navie will help you generate new code.',
        },
      ],
      disableInput: false,
    };
  },
  computed: {
    isChatting(): boolean {
      return this.messages.length > 0;
    },
    inputClasses() {
      return {
        chatting: this.isChatting,
      };
    },
    userMessageCount() {
      return this.messages.filter((m) => m.isUser).length;
    },
  },
  methods: {
    getMessage(query: Partial<IMessage>): IMessage | undefined {
      return this.messages.find((m) => {
        return Object.keys(query).every((key) => m[key] === query[key]);
      });
    },
    // Creates-or-appends a message.
    addToken(token: string, threadId: string, id: string) {
      if (threadId !== this.threadId) return;

      if (!id) console.warn('id is undefined');
      if (!threadId) console.warn('threadId is undefined');

      let assistantMessage = this.getMessage({ id });
      if (!assistantMessage) {
        assistantMessage = new AssistantMessage(id);
        this.messages.push(assistantMessage);
      }

      assistantMessage.append(token);
      this.scrollToBottom();
    },
    setAuthorized(v: boolean) {
      this.authorized = v;
    },
    addUserMessage(content: string) {
      const userMessage = new UserMessage(content);
      this.messages.push(userMessage);
      // Ensure that for the first user message, the auto-scroll position is reset to the top.
      // This is to account for the fact that there may be an auto-scroll applied when the
      // placeholder content is show during the chat initialization or when the user clears the chat.
      if (this.userMessageCount === 1) {
        this.autoScrollTop = 0;
      }
      this.scrollToBottom();
      return userMessage;
    },
    addSystemMessage() {
      const message = new AssistantMessage();
      this.messages.push(message);
      return message;
    },
    addErrorMessage(error: Error, component?: Component) {
      const message = new ErrorMessage(error, component);
      this.messages.push(message);
      this.scrollToBottom();
      return message;
    },
    addCustomMessage(data: CustomMessageConstructor) {
      const message = new CustomMessage(data);
      this.messages.push(message);
      this.scrollToBottom();
      return message;
    },
    onError(error, assistantMessage?: AssistantMessage) {
      const messageIndex = this.messages.findIndex((m) => m === assistantMessage);
      if (messageIndex !== -1) {
        this.messages.splice(messageIndex, 1);
      }

      if (error.code === 401) {
        this.setAuthorized(false);
      } else {
        this.addErrorMessage(error);
      }
    },
    async onSend(message: string) {
      const userMessage = this.addUserMessage(message);
      userMessage.codeSelections = this.codeSelections;

      this.sendMessage(
        message,
        this.codeSelections.map((s) => s.code),
        this.appmaps
      );

      this.codeSelections = [];
    },
    onAck(_messageId: string, threadId: string) {
      this.setAuthorized(true);
      this.threadId = threadId;
    },
    onReceiveQuota({ quota, error }: Quota) {
      if (!error) return;

      this.addCustomMessage({
        component: VQuotaExceededMessage,
        limit: quota.limit,
        reset: quota.reset,
        message: error.message,
      });

      // TODO: Re-enable input after the reset threshold has been reached
      this.disableInput = true;
    },
    clear() {
      this.threadId = undefined;
      this.messages.splice(0);
      this.autoScrollTop = 0;
      this.disableInput = false;
      this.$emit('clear');
    },
    scrollToBottom() {
      // Allow one tick to progress to allow any DOM changes to be applied
      this.$nextTick(() => {
        // If the scrollTop is less than the autoScrollTop, the user has scrolled up.
        // When the user scrolls up, stop auto-scrolling to the bottom until they scroll back down
        // beyond a threshold point at which auto-scrolling can "re-grab" the scroll position.
        // That's handled by manageScroll(), which is bound to the .messages scroll event.
        const scrollUp = this.autoScrollTop - this.$refs.messages.scrollTop;
        if (this.autoScrollTop != 0 && scrollUp > 5) {
          this.scrollLog('User scrolled up, disabling auto-scroll');
          return;
        }

        const targetScrollTop = this.$refs.messages.scrollHeight - this.$refs.messages.clientHeight;
        this.$refs.messages.scrollTop = targetScrollTop;
        this.autoScrollTop = targetScrollTop;
        this.scrollLog('Auto-scrolling to bottom');
      });
    },
    async onSentimentChange(messageId: string, sentiment: number) {
      if (!messageId) return;

      const message = this.getMessage({ id: messageId });
      if (!message || message.sentiment === sentiment) return;

      await AI.sendMessageFeedback(message.id, sentiment);

      message.sentiment = sentiment;
    },
    // If the scroll point has been set beyond where auto-scroll was canceled, and the
    // content is now fully scrolled, re-enable auto-scrolling.
    manageScroll() {
      const isScrolledBelowLastAutoScroll = this.$refs.messages.scrollTop > this.autoScrollTop;
      if (isScrolledBelowLastAutoScroll) {
        this.scrollLog('User scrolled down');
        if (this.isFullyScrolled()) {
          this.scrollLog('Content is fully scrolled, re-enabling auto-scroll');
          this.autoScrollTop = this.$refs.messages.scrollTop;
        } else {
          this.scrollLog('Content is not fully scrolled');
        }
      }
    },
    // Returns true if the content is fully scrolled to the bottom (with a fairly generous buffer).
    isFullyScrolled() {
      const { messages } = this.$refs;

      const fullyScrolled = messages.scrollHeight - messages.clientHeight;
      const fullyScrolledDelta = Math.abs(messages.scrollTop - fullyScrolled);
      return fullyScrolledDelta < 40;
    },
    includeCodeSelection(codeSelection: CodeSelection) {
      this.codeSelections.push(codeSelection);
    },
    includeAppMap(appmap: string) {
      this.appmaps.push(appmap);
    },
    resetAppMaps() {
      this.appmaps = [];
    },
  },
  watch: {
    isChatting() {
      this.$emit('isChatting', this.isChatting);
    },
  },
};
</script>

<style lang="scss" scoped>
$border-color: darken($gray4, 10%);

#header-logo {
  margin-right: auto;
  color: white;
  display: flex;
  flex-direction: row;
  align-items: center;
  font-weight: bold;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

#header-navie-logo {
  padding-top: 3px;
}

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

  ::-webkit-scrollbar-thumb:hover,
  ::-webkit-scrollbar-thumb:active {
    background: white;
  }

  .explainer {
    color: #e3e5e8;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .button-panel {
    $panel-bg: #2c3545;
    justify-content: end;
    display: flex;
    padding: 1rem 0.75rem;
    background-color: $panel-bg;
    border-bottom: 1px solid fade-in($panel-bg, 0.11);
    box-shadow: 0 0 0.7rem 0rem lighten($gray1, 5%);
    border-radius: 0 0 $border-radius $border-radius;
  }

  .clear {
    padding: 0.5rem 1rem;
    background-color: #262d3e;

    &:hover {
      background-color: darken(#262d3e, 10%);
    }
  }

  .messages {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 100%;
    overflow: auto;

    .mode-instructions {
      display: flex;
      flex-direction: column;
      padding: 2rem;
      color: $gray4;
      font-size: 0.9rem;
    }
  }

  .chatting {
    justify-content: flex-start;
  }
}

.status-container {
  display: inline-block;
  position: relative;
  left: 54px;
  margin: -4px 0.5rem 1rem 0.5rem;
  display: flex;

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
