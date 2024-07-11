import VAskNavieButton from '@/components/chat-search/AskNavieButton.vue';

export default {
  title: 'Pages/Chat',
  component: VAskNavieButton,
  argTypes: {
    kind: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ghost'],
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const AskNavieButton = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VAskNavieButton },
  template: '<v-ask-navie-button v-bind="$props" />',
});
