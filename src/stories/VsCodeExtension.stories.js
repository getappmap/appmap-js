import VVsCodeExtension from '@/pages/VsCodeExtension.vue';
import defaultScenario from './data/scenario.json';
import petClinicScenario from './data/java_scenario.json';

const scenarioData = {
  default: defaultScenario,
  'pet-clinic': petClinicScenario,
};

export default {
  title: 'Pages',
  component: VVsCodeExtension,
  argTypes: {
    scenario: {
      control: {
        type: 'select',
        options: Object.keys(scenarioData),
      },
      defaultValue: 'default',
    },
  },
};

export const vsCodeExtension = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VVsCodeExtension },
  template: '<v-vs-code-extension v-bind="$props" ref="vsCode" />',
  mounted() {
    const scenario = scenarioData[args.scenario];
    if (scenario) {
      this.$refs.vsCode.loadData(scenario);
    }
  },
});
