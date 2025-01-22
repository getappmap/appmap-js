import VChatInput from '../components/chat/ChatInput.vue';
import './scss/vscode.scss';

export default {
  title: 'Pages/Chat/Input',
  component: VChatInput,
};

const Template = (args, { argTypes }) => ({
  components: { VChatInput },
  props: Object.keys(argTypes),
  template: '<VChatInput v-bind="$props" />',
  mounted() {
    // Access the VPopper component and set the visibleOverride property
    this.$nextTick(() => {
      const poppers = this.$el.querySelectorAll('.popper');
      poppers.forEach((popper) => {
        const popperComponent = popper.__vue__;
        if (popperComponent) {
          popperComponent.visibleOverride = args.showTooltip;
        }
      });
    });
  },
});

export const Default = Template.bind({});
Default.args = {
  inputPlaceholder: 'Type your message here...',
  isStopActive: false,
  showTooltip: false,
};

export const WithStopButton = Template.bind({});
WithStopButton.args = {
  inputPlaceholder: 'Type your message here...',
  isStopActive: true,
  showTooltip: true,
};
