import VVsCodeExtension from '@/pages/VsCodeExtension.vue';
import { VIEW_SEQUENCE } from '@/store/vsCode';
import defaultScenario from './data/scenario.json';
import pruned from './data/scenario_pruned.json';
import giant from './data/giant_map.json';
import petClinicScenario from './data/java_scenario.json';
import diffScenario from './data/diff_base.json';
import appland1 from './data/Application_page_component_diagram_highlights_node_connections_upon_selection.appmap.json';
import appland2 from './data/ApplicationsController_scenarios_list_when_the_user_is_anonymous_is_not_found.appmap.json';
import longCallLabels from './data/long_call_labels_are_cut_off.appmap.json';
import diffAppMap from './data/sequence-diff/Users_profile_profile_display.appmap.json';
import diffSequenceDiagram from './data/sequence-diff/Users_profile_profile_display.diff.sequence.json';
import longPackage from './data/long-package.appmap.json';
import mapWithFindings from './data/appmap_with_finding.json';
import mapWithTwoFindings from './data/appmap_with_two_findings.json';
import patchNotes from './data/patch_notes_html';
import bindResolvePath from './support/resolvePath';
import savedFilters from './data/saved_filters.js';
import './scss/fullscreen.scss';
import { filterStringToFilterState } from '@appland/models';

const scenarioData = {
  default: defaultScenario,
  pruned,
  giant,
  'pet-clinic': petClinicScenario,
  appland1,
  appland2,
  longCallLabels,
  mapWithDiff: diffAppMap,
  longPackage,
  mapWithFindings,
  mapWithTwoFindings,
};

const sequenceDiagramData = {
  mapWithDiff: diffSequenceDiagram,
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
      },
      options: Object.keys(scenarioData),
    },
  },
  args: {
    appMapUploadable: true,
    allowFullscreen: true,
    savedFilters: [savedFilters[0]],
    scenario: 'default',
  },
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VVsCodeExtension },
  template:
    '<v-vs-code-extension v-bind="$props" style="overflow: hidden;" ref="vsCode" @exportJSON="exportJSON" />',
  methods: {
    exportJSON(appmapData) {
      const blob = new Blob([JSON.stringify(appmapData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${appMap.metadata?.name || 'download'}.appmap.json`;
      link.click();
      URL.revokeObjectURL(url);
    },
  },
  mounted() {
    const scenario = scenarioData[args.scenario];
    const sequenceDiagram = sequenceDiagramData[args.scenario];
    if (scenario) {
      this.$refs.vsCode.loadData(scenario, sequenceDiagram);
    }

    bindResolvePath(this);
  },
});

export const Extension = Template.bind({});

export const ExtensionWithDefaultSequenceView = Template.bind({});
ExtensionWithDefaultSequenceView.args = {
  defaultView: VIEW_SEQUENCE,
};

export const ExtensionWithSequenceDiff = Template.bind({});
ExtensionWithSequenceDiff.args = {
  defaultView: VIEW_SEQUENCE,
  scenario: 'mapWithDiff',
  interactive: false,
};

export const ExtensionWithSavedFilters = Template.bind({});
ExtensionWithSavedFilters.args = {
  defaultView: VIEW_SEQUENCE,
  savedFilters,
};

export const ExtensionWithViewState = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VVsCodeExtension },
  template: '<v-vs-code-extension v-bind="$props" ref="vsCode" />',
  mounted() {
    const scenario = scenarioData[args.scenario];
    if (scenario) {
      scenario.viewState = {
        filters: {
          hideElapsedTimeUnder: 2,
        },
      };
      this.$refs.vsCode.loadData(scenario);
    }

    bindResolvePath(this);
  },
});

export const ExtensionWithNotification = (args, { argTypes }) => ({
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

export const ExtensionWithoutHTTP = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VVsCodeExtension },
  template: '<v-vs-code-extension v-bind="$props" ref="vsCode" />',
  mounted() {
    this.$refs.vsCode.loadData(diffScenario);
  },
});

export const ExtensionWithSlowLoad = (args, { argTypes }) => {
  return {
    props: Object.keys(argTypes),
    components: { VVsCodeExtension },
    template: '<v-vs-code-extension v-bind="$props" ref="vsCode" />',
    mounted() {
      const scenario = scenarioData[args.scenario];
      const sequenceDiagram = sequenceDiagramData[args.scenario];
      if (scenario) {
        // The delay mimics the time it takes to load an appmap in the VS Code extension
        setTimeout(() => {
          this.$refs.vsCode.loadData(scenario, sequenceDiagram);
        }, 1000);
      }

      bindResolvePath(this);
    },
  };
};

ExtensionWithSlowLoad.args = {
  defaultView: VIEW_SEQUENCE,
};
