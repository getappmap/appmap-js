<template>
  <v-multi-page ref="page" :disabled-pages="disabledPages">
    <v-project-picker
      id="project-picker"
      :projects="projects"
      :message-success="messageCopiedCommand"
      :editor="editor"
    />
    <v-record-app-maps
      id="record-appmaps"
      :editor="editor"
      :project="selectedProject"
      :complete="hasRecorded"
      :feature-flags="featureFlags"
      :theme="theme"
    />
    <v-open-app-maps
      id="open-appmaps"
      :app-maps="appMaps"
      :sample-code-objects="sampleCodeObjects"
    />
    <v-open-api id="openapi" :num-http-requests="numHttpRequests" :num-app-maps="numAppMaps" />
    <v-investigate-findings
      id="investigate-findings"
      :scanned="hasFindings"
      :num-findings="numFindings"
      :project-path="path"
      :findingsDomainCounts="findingsDomainCounts"
      :findings-enabled="findingsEnabled"
      :user-authenticated="userAuthenticated"
      :analysis-enabled="analysisEnabled"
    />
    <v-analysis-findings id="analysis-findings" />
  </v-multi-page>
</template>

<script>
import VMultiPage from '@/pages/MultiPage.vue';
import VProjectPicker from '@/pages/install-guide/ProjectPicker.vue';
import VRecordAppMaps from '@/pages/install-guide/RecordAppMaps.vue';
import VOpenAppMaps from '@/pages/install-guide/OpenAppMaps.vue';
import VOpenApi from '@/pages/install-guide/OpenApi.vue';
import VInvestigateFindings from '@/pages/install-guide/InvestigateFindings.vue';
import VAnalysisFindings from '@/pages/install-guide/AnalysisFindings.vue';

export default {
  name: 'install-guide',

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
      return this.selectedProject && this.selectedProject.analysisPerformed;
    },
    appMaps() {
      return (this.selectedProject && this.selectedProject.appMaps) || [];
    },
    numFindings() {
      return this.selectedProject && this.selectedProject.numFindings;
    },
    numAppMaps() {
      return this.selectedProject && this.selectedProject.numAppMaps;
    },
    numHttpRequests() {
      return this.selectedProject && this.selectedProject.numHttpRequests;
    },
    hasRecorded() {
      return this.selectedProject && this.selectedProject.numAppMaps > 0;
    },
    path() {
      return this.selectedProject && this.selectedProject.path;
    },
    findingsDomainCounts() {
      return this.selectedProject && this.selectedProject.findingsDomainCounts;
    },
    sampleCodeObjects() {
      return this.selectedProject && this.selectedProject.sampleCodeObjects;
    },
  },

  components: {
    VMultiPage,
    VProjectPicker,
    VRecordAppMaps,
    VInvestigateFindings,
    VOpenAppMaps,
    VOpenApi,
    VAnalysisFindings,
  },

  methods: {
    jumpTo(pageIndex) {
      this.$refs.page.jumpTo(pageIndex);
    },
  },

  mounted() {
    this.$root.$on('select-project', (project) => {
      this.selectedProject = project;
    });
  },
};
</script>
