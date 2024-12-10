import VWelcomeMessage from '@/components/chat/WelcomeMessage.vue';

export default {
  title: 'Components/WelcomeMessage',
  component: VWelcomeMessage,
};

const Template = (args) => ({
  components: { VWelcomeMessage },
  setup() {
    return { args };
  },
  template: '<v-welcome-message v-bind="args" />',
});

export const Default = Template.bind({});
Default.args = {
  staticMessage: `### Hi, I'm Navie`,
  dynamicMessage: '',
};

export const WithDynamicMessage = Template.bind({});
WithDynamicMessage.args = {
  staticMessage: `### Hi, I'm Navie`,
  dynamicMessage: '**Welcome!** This dynamic message is loaded and sanitized.',
};
