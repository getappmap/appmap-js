import VSignIn from '@/components/SignIn.vue';

export default {
  title: 'Pages/VS Code',
  component: VSignIn,
  parameters: {
    chromatic: {
      delay: 1000,
      diffThreshold: 1,
    },
  },
  argTypes: {},
  args: {},
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VSignIn },
  template: '<v-sign-in v-bind="$props" ref="vsCode" />',
});

export const signIn = Template.bind({});
