import VVsCodeExtension from '@/pages/VsCodeExtension.vue';
import defaultScenario from './data/scenario.json';
import petClinicScenario from './data/java_scenario.json';
import appland1 from './data/Application_page_component_diagram_highlights_node_connections_upon_selection.appmap.json';
import appland2 from './data/ApplicationsController_scenarios_list_when_the_user_is_anonymous_is_not_found.appmap.json';
import patchNotes from './data/patch_notes_html';
import './scss/fullscreen.scss';

const scenarioData = {
  default: defaultScenario,
  'pet-clinic': petClinicScenario,
  appland1,
  appland2,
};

export default {
  title: 'Pages/VS Code',
  component: VVsCodeExtension,
  parameters: {
    chromatic: { delay: 1000 },
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
  args: {
    appMapUploadable: true,
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
