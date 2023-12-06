import VChatSearch from '@/pages/ChatSearch.vue';
import './scss/vscode.scss';

export default {
  title: 'Pages/ChatSearch',
  component: VChatSearch,
  argTypes: {},
};

export const chatSearch = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VChatSearch },
  template: `<v-chat-search v-bind="$props"></v-chat-search>`,
});
let id = 0;
chatSearch.args = {
  apiKey: '',
  apiUrl: 'https://api.getappmap.com',
};
