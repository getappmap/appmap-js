import Welcome from '@/pages/quickstart-docs/Welcome.vue';

export default {
  title: 'Pages/VS Code/Quickstart Docs/Welcome',
  component: Welcome,
};

export const welcome = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { Welcome },
  template: '<Welcome v-bind="$props" ref="welcome" />',
});
