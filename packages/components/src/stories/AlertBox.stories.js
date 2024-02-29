import VAlertBox from '@/components/AlertBox.vue';

export default {
  title: 'AppLand/UI/Alert Box',
  component: VAlertBox,
  argTypes: {},
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VAlertBox },
  template: `<v-alert-box v-bind="$props">${args.content}</v-alert-box>`,
});

export const Info = Template.bind({});
Info.args = {
  level: 'info',
  content: '<b>This is an info message</b><br>It spans many lines',
};

export const Warning = Template.bind({});
Warning.args = {
  level: 'warning',
  content: '<b>This is a warning message</b><br>It spans many lines',
};

export const Error = Template.bind({});
Error.args = {
  level: 'error',
  content: '<b>This is an error message</b><br>It spans many lines',
};
