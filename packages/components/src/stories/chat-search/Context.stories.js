import { default as VContext } from '@/components/chat-search/Context.vue';
import '../scss/vscode.scss';

export default {
  title: 'Pages/ChatSearch/Context',
  component: VContext,
  argTypes: {},
};

export const Context = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VContext },
  template: `<v-context v-bind="$props"></v-context>`,
});

Context.args = {
  apiKey: '',
  apiUrl: 'https://api.getappmap.com',
};
