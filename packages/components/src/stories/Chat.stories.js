import { default as VChatPage } from '@/pages/Chat.vue';
import './scss/vscode.scss';

export default {
  title: 'Pages/Chat',
  component: VChatPage,
  argTypes: {},
};

export const Chat = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VChatPage },
  template: `<v-chat-page v-bind="$props"></v-chat-page>`,
});
Chat.args = {
  apiKey: '',
  apiUrl: 'https://api.getappmap.com',
};
