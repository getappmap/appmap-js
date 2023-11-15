<template>
  <div class="chat">
    <v-user-message
      v-for="(message, i) in messages"
      :key="i"
      :avatar="chatters[message.sender].avatar"
      :name="chatters[message.sender].name"
    >
      {{ message.body }}
    </v-user-message>
  </div>
</template>

<script lang="ts">
//@ts-ignore
import VUserMessage from '@/components/chat/UserMessage.vue';

type Chatter = {
  name: string;
  avatar: string;
};

type Message = {
  sender: number;
  body: string;
  attachments?: string[];
};

export default {
  name: 'v-chat',
  components: {
    VUserMessage,
  },
  props: {
    chatters: {
      default: () => [],
      required: true,
    },
    messages: {
      default: () => [],
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.chat {
  background-color: $gray1;
  width: 100%;
  height: 100%;
}
</style>
