<template>
  <v-multi-page ref="page" :disabled-pages="disabledPages">
    <v-project-picker
      id="project-picker"
      :projects="projects"
      :message-success="messageCopiedCommand"
      :editor="editor"
      :status-states="statusStates"
    />
    <v-record-app-maps
      id="record-appmaps"
      :editor="editor"
      :project="selectedProject"
      :complete="hasRecorded"
      :feature-flags="featureFlags"
      :theme="theme"
      :status-states="statusStates"
    />
    <v-open-app-maps
      id="open-appmaps"
      :app-maps="appMaps"
      :sample-code-objects="sampleCodeObjects"
      :status-states="statusStates"
      :project-name="projectName"
      :num-app-maps="numAppMaps"
      :complete="hasExplored"
    />
    <v-open-api
      id="openapi"
      :num-http-requests="numHttpRequests"
      :num-app-maps="numAppMaps"
      :status-states="statusStates"
      :project-name="projectName"
      :complete="hasGeneratedOpenApi"
    />
    <v-investigate-findings
      id="investigate-findings"
      :scanned="hasFindings"
      :num-findings="numFindings"
      :project-path="path"
      :findingsDomainCounts="findingsDomainCounts"
      :findings-enabled="findingsEnabled"
      :user-authenticated="userAuthenticated"
      :analysis-enabled="analysisEnabled"
      :status-states="statusStates"
      :project-name="projectName"
      :num-app-maps="numAppMaps"
    />
  </v-multi-page>
</template>

<script>
import VMultiPage from '@/pages/MultiPage.vue';
import VProjectPicker from '@/pages/install-guide/ProjectPicker.vue';
import VRecordAppMaps from '@/pages/install-guide/RecordAppMaps.vue';
import VOpenAppMaps from '@/pages/install-guide/OpenAppMaps.vue';
import VOpenApi from '@/pages/install-guide/OpenApi.vue';
import VInvestigateFindings from '@/pages/install-guide/InvestigateFindings.vue';
import { StepStatus } from '@/components/install-guide/Status.vue';

export default {
  name: 'install-guide',

  components: {
    VMultiPage,
    VProjectPicker,
    VRecordAppMaps,
    VInvestigateFindings,
    VOpenAppMaps,
    VOpenApi,
  },

  props: {
    disabledPages: {
      type: Set,
      default: () => new Set(),
    },
    messageCopiedCommand: {
      type: String,
      default: '<b>Copied!</b><br/>Paste this command<br/>into your terminal.',
    },
    projects: {
      default: () => [],
      type: Array,
    },
    appMapsDir: String,
    editor: {
      default: 'vscode',
      type: String,
      validator: (value) => ['vscode', 'jetbrains'].indexOf(value) !== -1,
    },
    featureFlags: {
      type: Set,
      default: () => new Set(),
    },
    findingsEnabled: {
      type: Boolean,
      default: false,
    },
    analysisEnabled: {
      type: Boolean,
      default: false,
    },
    userAuthenticated: {
      type: Boolean,
      default: false,
    },
    theme: {
      type: String,
      default: 'dark',
      validator: (value) => ['dark', 'light'].indexOf(value) !== -1,
    },
  },

  watch: {
    projects(newVal) {
      if (!this.selectedProject || !this.selectedProject.name) return;
      this.selectedProject = newVal.find((p) => p.name === this.selectedProject.name);
    },
  },

  data() {
    return {
      selectedProject: null,
    };
  },

  computed: {
    hasFindings() {
      return this.selectedProject?.analysisPerformed;
    },
    appMaps() {
      return this.selectedProject?.appMaps || [];
    },
    numFindings() {
      return this.selectedProject?.numFindings;
    },
    numAppMaps() {
      return this.selectedProject?.numAppMaps || 0;
    },
    numHttpRequests() {
      return this.selectedProject?.numHttpRequests;
    },
    hasInstalled() {
      return this.selectedProject?.agentInstalled;
    },
    hasRecorded() {
      return this.numAppMaps > 0;
    },
    hasExplored() {
      return this.selectedProject?.appMapOpened;
    },
    hasGeneratedOpenApi() {
      return this.selectedProject?.generatedOpenApi;
    },
    hasInvestigatedFindings() {
      return this.selectedProject?.investigatedFindings;
    },
    path() {
      return this.selectedProject?.path;
    },
    findingsDomainCounts() {
      return this.selectedProject?.findingsDomainCounts;
    },
    sampleCodeObjects() {
      return this.selectedProject?.sampleCodeObjects;
    },
    projectName() {
      return this.selectedProject?.name || '';
    },
    currentStep() {
      return this.statusStates.findIndex((step) => step === StepStatus.InProgress);
    },
    statusStates() {
      return [
        this.hasInstalled,
        this.hasRecorded,
        this.hasExplored,
        this.hasGeneratedOpenApi,
        this.hasInvestigatedFindings,
      ].map((stepComplete, index, statuses) => {
        if (stepComplete) return StepStatus.Completed;

        const previousStepComplete = Boolean(index > 0 ? statuses[index - 1] : true);
        if (previousStepComplete) return StepStatus.InProgress;

        return StepStatus.NotStarted;
      });
    },
  },

  methods: {
    jumpToIndex(pageIndex) {
      const pages = this.$refs.page.$children;
      const pageId = pages[pageIndex]?.$attrs.id;
      if (pageId) this.jumpTo(pageId);
    },
    jumpTo(pageId) {
      this.$refs.page.jumpTo(pageId);
    },
  },

  mounted() {
    this.$root
      .$on('select-project', (project) => {
        this.selectedProject = project;
      })
      .$on('status-jump', (pageIndex) => {
        this.jumpToIndex(pageIndex);
      });
  },
};
</script>
