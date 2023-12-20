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
  suggestions: [
    {
      title: 'Document the architecture of a feature.',
      subTitle: 'Get AppMaps and a detailed text description of the code design.',
      prompt:
        "Describe a particular feature or system within your application and I'll describe how it works.",
    },
    {
      title: 'Identify the usage of personal data.',
      subTitle: "Enumerate the user's personal data that's being accessed.",
      prompt: "Describe a feature and ask which user data it accesses. I'll tell you what I find.",
    },
    {
      title: 'Find the root cause of a performance issue.',
      subTitle: 'Describe the issue and let AppMap help you fix it.',
      prompt:
        "Let's get to the bottom of a performance issue. Can you describe what the issue is, or how it's manifesting itself in your application?",
    },
    {
      title: 'Look for security issues.',
      subTitle: 'Use AppMap data to surface runtime security flaws.',
      prompt:
        'I can help you identify any potential security issues. Do you have a particular concern in mind, or would you like me to make a suggestion?',
    },
  ],
};
