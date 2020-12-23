import VDetailsPanel from '@/components/DetailsPanel.vue';

export default {
  title: 'AppLand/UI',
  component: VDetailsPanel,
  argTypes: {},
  args: {
    title: 'test',
    subtitle: 'test',
  },
};

export const detailsPanel = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VDetailsPanel },
  template: '<v-details-panel v-bind="$props" />',
});
