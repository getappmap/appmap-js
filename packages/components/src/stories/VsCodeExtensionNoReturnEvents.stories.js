import VExtension from '@/pages/VsCodeExtension.vue';
import hwScenario from './data/hw.json';

export default {
  title: 'Pages/VS Code/Extension No Return Events',
  component: VExtension,
};

export const extensionNoReturnEvents = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VExtension },
  template: '<v-extension v-bind="$props" ref="vsCode" />',
  mounted() {
    this.$refs.vsCode.loadData(hwScenario);
  },
});
