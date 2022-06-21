import EmptyState from '@/pages/install-guide/EmptyState.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages',
  component: EmptyState,
  args: {
    projects: [],
  },
};

export const emptyState = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { EmptyState },
  template: '<EmptyState v-bind="$props" ref="installAgent" />',
});
