import VWelcomeMessageV1 from '@/components/chat/WelcomeMessageV1.vue';

export default {
  title: 'Components/WelcomeMessage',
  component: VWelcomeMessageV1,
};

const Template = (args) => ({
  components: { VWelcomeMessageV1 },
  setup() {
    return { args };
  },
  template: '<v-welcome-message v-bind="args" />',
});

export const Default = Template.bind({});
Default.args = {
  dynamicMessage: '',
};

export const WithDynamicMessage = Template.bind({});
WithDynamicMessage.args = {
  dynamicMessage: '**Welcome!** This dynamic message is loaded and sanitized.',
};
