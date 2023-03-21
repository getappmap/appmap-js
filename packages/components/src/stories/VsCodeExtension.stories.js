import VVsCodeExtension from '@/pages/VsCodeExtension.vue';
import { VIEW_SEQUENCE } from '@/store/vsCode';
import defaultScenario from './data/scenario.json';
import petClinicScenario from './data/java_scenario.json';
import diffScenario from './data/diff_base.json';
import appland1 from './data/Application_page_component_diagram_highlights_node_connections_upon_selection.appmap.json';
import appland2 from './data/ApplicationsController_scenarios_list_when_the_user_is_anonymous_is_not_found.appmap.json';
import mapWithFindings from './data/appmap_with_finding.json';
import mapWithTwoFindings from './data/appmap_with_two_findings.json';
import patchNotes from './data/patch_notes_html';
import bindResolvePath from './support/resolvePath';
import './scss/fullscreen.scss';
import defaultScenarioStats from './data/scenario.stats.json';

const scenarioData = {
  default: defaultScenario,
  'pet-clinic': petClinicScenario,
  appland1,
  appland2,
  mapWithFindings,
  mapWithTwoFindings,
};

export default {
  title: 'Pages/VS Code',
  component: VVsCodeExtension,
  parameters: {
    chromatic: {
      delay: 1000,
      diffThreshold: 1,
    },
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

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VVsCodeExtension },
  template: '<v-vs-code-extension v-bind="$props" ref="vsCode" />',
  mounted() {
    const scenario = scenarioData[args.scenario];
    if (scenario) {
      this.$refs.vsCode.loadData(scenario);
    }

    bindResolvePath(this);
  },
});

export const extension = Template.bind({});

export const extensionWithDefaultSequenceView = Template.bind({});
extensionWithDefaultSequenceView.args = {
  defaultView: VIEW_SEQUENCE,
};

export const extensionWithStats = Template.bind({});
extensionWithStats.args = {
  stats: defaultScenarioStats,
};

export const extensionWithNotification = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VVsCodeExtension },
  template: '<v-vs-code-extension v-bind="$props" ref="vsCode" />',
  mounted() {
    const scenario = scenarioData[args.scenario];
    if (scenario) {
      this.$refs.vsCode.loadData(scenario);
    }

    bindResolvePath(this);

    this.$refs.vsCode.showVersionNotification('v1.0.0', patchNotes);
  },
});

export const extensionWithoutHTTP = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VVsCodeExtension },
  template: '<v-vs-code-extension v-bind="$props" ref="vsCode" />',
  mounted() {
    this.$refs.vsCode.loadData(diffScenario);
  },
});
