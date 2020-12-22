import DetailsPanel from '@/components/DetailsPanel.vue';

export default {
  title: 'AppLand/UI',
  component: DetailsPanel,
  argTypes: {},
  args: {
    title: 'test',
    subtitle: 'test',
  },
};

export const detailsPanel = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { DetailsPanel },
  template: '<DetailsPanel v-bind="$props" />',
});
