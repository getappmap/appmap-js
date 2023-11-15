import VChat from '@/pages/Chat.vue';

export default {
  title: 'Pages/Chat',
  component: VChat,
  argTypes: {},
};

export const chat = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VChat },
  template: `<v-chat v-bind="$props"></v-chat>`,
});
let id = 0;
chat.args = {
  chatters: [
    { name: 'AppMap', avatar: '/img/avatar.svg' },
    { name: 'User', avatar: '/img/avatar.svg' },
  ],
  messages: [{ sender: 0, body: 'hello world!' }],
};
