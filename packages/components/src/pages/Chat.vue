<template>
  <div class="chat-container">
    <div class="chat">
      <small class="clear" @click="clear" v-if="isChatting">New chat</small>
      <v-user-message
        v-for="(message, i) in messages"
        :key="i"
        :message="message.body"
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

type Message = {
  isUser: boolean;
  body: string;
  attachments?: string[];
};

export default {
  name: 'v-chat',
  components: {
    VUserMessage,
    VChatInput,
    VSuggestionGrid,
  },
  data() {
    return {
      messages: [],
    } as {
      messages: Message[];
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
  },
  methods: {
    onMessage(message, isUser) {
      this.messages.push({
        isUser,
        body: message,
      });

      this.scrollToBottom();
      this.$root.$emit('message', message, isUser);
    },
    onSend(message: string) {
      this.onMessage(message, true);
    },
    onReceive(message: string) {
      this.onMessage(message, false);
    },
    onSuggestion(prompt: string) {
      // Make it look like the AI is typing
      this.onMessage(prompt, false);
    },
    clear() {
      this.$set(this, 'messages', []);
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
.chat-container {
  min-width: 100%;
  max-width: 100%;
  min-height: 100%;
  max-height: 100%;
  overflow-y: auto;
  background-color: $gray2;
}

.chat {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  padding: 1rem;
  max-width: 58rem;
  margin: 0 auto;
  overflow-y: auto;
  padding-bottom: 5rem;

  .chatting {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
  }

  .clear {
    color: #0097fa;
    cursor: pointer;
    margin-left: auto;
    position: fixed;
    top: 1rem;
    right: 1rem;

    &:hover {
      color: lighten(#0097fa, 10%);
      text-decoration: underline;
    }
  }
}
</style>
