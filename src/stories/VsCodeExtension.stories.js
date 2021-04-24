import VVsCodeExtension from '@/pages/VsCodeExtension.vue';
import defaultScenario from './data/scenario.json';
import petClinicScenario from './data/java_scenario.json';
import patchNotes from './data/patch_notes_html';
import './scss/fullscreen.scss';

const scenarioData = {
  default: defaultScenario,
  'pet-clinic': petClinicScenario,
};

export default {
  title: 'Pages/VS Code',
  component: VVsCodeExtension,
  parameters: {
    chromatic: { delay: 300 },
  },
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

export const extension = (args, { argTypes }) => ({
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

export const extensionWithNotification = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VVsCodeExtension },
  template: '<v-vs-code-extension v-bind="$props" ref="vsCode" />',
  mounted() {
    const scenario = scenarioData[args.scenario];
    if (scenario) {
      this.$refs.vsCode.loadData(scenario);
    }

    this.$refs.vsCode.showVersionNotification('v1.0.0', patchNotes);
  },
});
