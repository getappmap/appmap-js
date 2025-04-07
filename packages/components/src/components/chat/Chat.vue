<template>
  <div class="chat">
    <div class="button-panel" v-if="isChatting">
      <div id="header-logo">
        <v-app-map-navie-logo />
        <div id="header-navie-logo">Navie</div>
      </div>
      <v-button
        v-if="openNewChat"
        data-cy="new-chat-btn"
        class="clear"
        size="small"
        kind="native-ghost"
        @click.native="openNewChat"
      >
        New chat
      </v-button>
    </div>
    <div class="explainer" v-if="$slots.default">
      <slot />
    </div>
    <div
      :class="['messages', isChatting ? 'chatting' : 'not-chatting']"
      data-cy="messages"
      ref="messages"
      @scroll="manageScroll"
    >
      <slot name="not-chatting" v-if="!isChatting"></slot>
      <v-user-message
        v-for="(message, i) in messages"
        :key="i"
        :tokens="message.tokens"
        :is-user="message.isUser"
        :is-error="message.isError"
        :id="message.messageId"
        :sentiment="message.sentiment"
        :tools="message.tools"
        :complete="message.complete"
        :message-attachments="message.messageAttachments"
        :thread-id="threadId"
        :prompt-suggestions="message.promptSuggestions"
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
      @stop="onStop"
      :placeholder="inputPlaceholder"
      :class="inputClasses"
      :question="question"
      :code-selections="messageAttachments"
      :is-stop-active="isResponseStreaming"
      :input-placeholder="inputPlaceholder"
      :commands="commands"
      :use-animation="useAnimation"
      :is-disabled="isInputDisabled || selectedModel === undefined"
      :usage="usage"
      :subscription="subscription"
      :email="email"
      ref="input"
    />
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import Vue, { PropType } from 'vue';
import VUserMessage from '@/components/chat/UserMessage.vue';
import VChatInput from '@/components/chat/ChatInput.vue';
import VAppMapNavieLogo from '@/assets/appmap-full-logo.svg';
import VButton from '@/components/Button.vue';
import { AI } from '@appland/client';
import { ExplainRpc, NavieRpc } from '@appland/rpc';
import { CodeSelection } from './CodeSelection';

interface MessageAttachment {
  uri: string;
  content?: string;
}

export interface ITool {
  id?: string;
  title: string;
  status?: string;
  complete?: boolean;
}

interface IMessage {
  tokens: (string | CodeBlockReference)[];
  isUser: boolean;
  isError: boolean;
  complete?: boolean;
  messageId?: string;
  sentiment?: number;
  tools?: ITool[];
  messageAttachments?: MessageAttachment[];
}

class UserMessage implements IMessage {
  public tokens: string[] = [];
  public readonly messageId = undefined;
  public readonly sentiment = undefined;
  public readonly isUser = true;
  public readonly isError = false;
  public readonly tools = undefined;
  public readonly complete = true;
  public readonly messageAttachments = [];

  constructor(content: string) {
    this.tokens.push(content);
  }
}

interface CodeBlockReference {
  type: 'code-block';
  uri: string;
}

interface HiddenToken {
  type: 'hidden';
  content: string;
}

interface XMLToken {
  type: 'tag';
  tag: string;
  raw: string;
  attributes: [string, string][];
}

type Token = string | CodeBlockReference | HiddenToken | XMLToken;

class AssistantMessage implements IMessage {
  public tokens: Token[] = [];
  public sentiment = undefined;
  public complete = false;
  public readonly isUser = false;
  public readonly isError = false;
  public readonly tools = [];
  public readonly messageAttachments = undefined;
  public readonly promptSuggestions: undefined | NavieRpc.V1.Suggest.NextStep[] = undefined;
  private readonly codeBlocks: CodeBlockReference[] = [];

  constructor(public messageId?: string) {}

  append(token: Token) {
    if (typeof token === 'object' && 'type' in token) {
      if (token.type === 'code-block') {
        if (this.codeBlocks.some((b) => b.uri === token.uri)) {
          return;
        }
        this.codeBlocks.push(token);
      }
    }

    this.tokens.push(token);
  }

  setPromptSuggestions(suggestions: NavieRpc.V1.Suggest.NextStep[]) {
    Vue.set(this, 'promptSuggestions', suggestions);
  }
}

class ErrorMessage implements IMessage {
  public readonly messageId = undefined;
  public readonly sentiment = undefined;
  public readonly messageAttachments = undefined;
  public readonly complete = true;
  public readonly isUser = false;
  public readonly isError = true;
  private readonly message: string;

  constructor(private error: unknown) {
    if (error instanceof Error || (typeof error === 'object' && 'message' in error)) {
      this.message = error.message;
    } else if (typeof error === 'string') {
      this.message = error;
    } else {
      this.message = String(error);
    }
  }

  get tokens() {
    return [this.message];
  }
}

export default {
  name: 'v-chat',
  components: {
    VUserMessage,
    VChatInput,
    VAppMapNavieLogo,
    VButton,
  },
  props: {
    openNewChat: {
      type: Function,
    },
    // Initial question to ask
    question: {
      type: String,
    },
    sendMessage: {
      type: Function, // (message: string, messageAttachments?: string[]) => void
    },
    inputPlaceholder: {
      type: String,
      default: 'What are you working on today?',
    },
    commands: {
      type: Array<NavieRpc.V1.Metadata.Command[]>,
    },
    isInputDisabled: {
      type: Boolean,
      default: false,
    },
    useAnimation: {
      type: Boolean,
      default: true,
    },
    usage: {
      type: Object,
    },
    subscription: {
      type: Object,
    },
    email: {
      type: String,
    },
    selectedModel: {
      type: Object as PropType<NavieRpc.V1.Models.ListModel>,
    },
    threadId: {
      type: String,
    },
  },
  inject: {
    pinnedItems: {
      default: () => [],
    },
  },
  data() {
    return {
      messages: [] as IMessage[],
      authorized: true,
      autoScrollTop: 0,
      enableScrollLog: false, // Auto-scroll can be tricky, so there is special logging to help debug it.
      messageAttachments: [] as MessageAttachment[],
      appmaps: [] as string[],
      scrollLog: (message: string) => (this.enableScrollLog ? console.log(message) : undefined),
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
    isResponseStreaming(): boolean {
      return this.getMessage({ complete: false, isUser: false }) !== undefined;
    },
  },
  methods: {
    getMessage(query: Partial<IMessage>): IMessage | undefined {
      return this.messages.find((m) => {
        return Object.keys(query).every((key) => m[key] === query[key]);
      });
    },
    // Creates-or-appends a message.
    addToken(token: string, messageId: string) {
      if (!messageId) console.warn('messageId is undefined');

      let assistantMessage = this.getMessage({ messageId });
      if (!assistantMessage) {
        assistantMessage = Vue.observable(new AssistantMessage(messageId));
        this.messages.push(assistantMessage);
      }

      assistantMessage.append(token);
      this.scrollToBottom();
    },
    setAuthorized(v: boolean) {
      this.authorized = v;
    },
    addUserMessage(content: string, userContext?: NavieRpc.V1.Thread.ContextItem[]) {
      const userMessage = new UserMessage(content);
      if (userContext) {
        const pinnedItems = new Set(this.pinnedItems.map(({ uri }) => uri));
        const nonPinnedItems = userContext.filter(({ uri }) => !pinnedItems.has(uri));
        userMessage.messageAttachments.push(...nonPinnedItems);
      }
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
      const message = Vue.observable(new AssistantMessage());
      this.messages.push(message);
      return message;
    },
    addErrorMessage(error: Error) {
      this.messages.push(new ErrorMessage(error));
      this.scrollToBottom();
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
      this.sendMessage(message, this.messageAttachments, this.appmaps);
      this.$set(this, 'messageAttachments', []);
    },
    onStop() {
      this.$emit('stop');
    },
    onAck() {
      this.setAuthorized(true);
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

      const message = this.getMessage({ messageId });
      if (!message || message.sentiment === sentiment) return;

      await AI.sendMessageFeedback(message.messageId, sentiment);

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
    includeMessageAttachment(attachment: MessageAttachment) {
      this.messageAttachments.push(attachment);
    },
    removeMessageAttachment(uri: string) {
      this.$set(
        this,
        'messageAttachments',
        this.messageAttachments.filter((c) => c.uri !== uri)
      );
    },
    includeAppMap(appmap: string) {
      this.appmaps.push(appmap);
    },
    resetAppMaps() {
      this.appmaps = [];
    },
    setInput(input: string) {
      this.$refs.input.setInput(input);
      this.$refs.input.moveCursorToEnd();
    },
    clear() {
      this.$set(this, 'messages', []);
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
  color: $color-foreground;
  display: flex;
  flex-direction: row;
  align-items: center;
  font-weight: bold;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;

  svg {
    path:last-child {
      fill: $color-foreground;
    }
    path:not(:last-child) {
      fill: $color-background;
      stroke: transparent;
    }
    circle {
      fill: $color-foreground;
    }
  }
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
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .button-panel {
    justify-content: end;
    display: flex;
    padding: 1rem 0.75rem;
    background-color: $color-background;
    border-bottom: 1px solid rgba(white, 0.05);
    box-shadow: 0 0 0.7rem 0rem $color-tile-shadow;
    border-radius: 0 0 $border-radius $border-radius;
  }

  .clear {
    padding: 0.5rem 1rem;
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
