import VVsCodeExtension from '@/pages/VsCodeExtension.vue';
import scenarioData from './data/scenario.json';

export default {
  title: 'Pages',
  component: VVsCodeExtension,
};

export const vsCodeExtension = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VVsCodeExtension },
  template: '<v-vs-code-extension v-bind="$props" ref="vsCode" />',
  mounted() {
    this.$refs.vsCode.loadData(scenarioData);
  },
});
