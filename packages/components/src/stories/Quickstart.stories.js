import Quickstart from '@/pages/Quickstart.vue';

export default {
  title: 'Pages/VS Code',
  component: Quickstart,
};

export const quickstart = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { Quickstart },
  template: '<quickstart v-bind="$props" />',
});
