import { default as VChatPage } from '@/pages/Chat.vue';
import './scss/vscode.scss';

export default {
  title: 'Pages/Chat',
  component: VChatPage,
  argTypes: {},
};

export const chat = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VChatPage },
  template: `<v-chat-page v-bind="$props"></v-chat-page>`,
});
let id = 0;
chat.args = {
  apiKey: '',
  apiUrl: 'https://api.getappmap.com',
  chatters: [],
  messages: [
    {
      isUser: false,
      body: `
Here's some code:
\`\`\`ts
const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code: string, lang: string) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      console.log(language);
      return hljs.highlight(code, { language }).value;
    },
  })
);
\`\`\`  
      `,
    },
    { isUser: true, body: 'hello world!' },
  ],
};
