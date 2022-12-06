import VSignIn from '@/pages/install-guide/SignIn.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages/Sign In',
  component: VSignIn,
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VSignIn },
  template: '<v-sign-in v-bind="$props" />',
});

export const SignIn = Template.bind({});
SignIn.args = {};
