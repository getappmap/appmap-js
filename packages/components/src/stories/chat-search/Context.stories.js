import { default as VContext } from '@/components/chat-search/Context.vue';
import '../scss/vscode.scss';

export default {
  title: 'Pages/ChatSearch/Context',
  component: VContext,
  argTypes: {},
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const Context = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VContext },
  template: `<v-context v-bind="$props"></v-context>`,
});

Context.args = {
  contextResponse: [
    {
      directory: '/home/user/my-app',
      location: '/home/user/my-app/tmp/appmap/minitest/example.appmap.json',
      type: 'sequence-diagram',
    },
    {
      directory: '/home/user/my-app',
      location: 'z:\\workspace\\example.appmap.json',
      type: 'sequence-diagram',
    },
    {
      directory: '/home/user/my-app',
      location: '/home/user/my-app/tmp/appmap/minitest/True_equals_true.appmap.json:23',
      type: 'data-request',
    },
    {
      directory: '/home/user/my-app',
      type: 'code-snippet',
      location: 'app/models/user.rb:45',
    },
  ],
};
