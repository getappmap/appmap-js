<template>
  <v-multi-page ref="page" :disabled-pages="disabledPages">
    <v-project-picker
      id="project-picker"
      :projects="projects"
      :java-agent-status="javaAgentStatus"
      :editor="editor"
      :status-states="statusStates"
      :display-ai-help="displayAiHelp"
    />
    <v-record-app-maps
      id="record-appmaps"
      :editor="editor"
      :project="selectedProject"
      :complete="hasRecorded"
      :feature-flags="featureFlags"
      :theme="theme"
      :status-states="statusStates"
      :display-ai-help="displayAiHelp"
    />
  </v-multi-page>
</template>

<script>
import VMultiPage from '@/pages/MultiPage.vue';
import VProjectPicker from '@/pages/install-guide/ProjectPicker.vue';
import VRecordAppMaps from '@/pages/install-guide/RecordAppMaps.vue';
import { StepStatus } from '@/components/install-guide/Status.vue';

export default {
  name: 'install-guide',

  components: {
    VMultiPage,
    VProjectPicker,
    VRecordAppMaps,
  },

  props: {
    disabledPages: {
      type: Set,
      default: () => new Set(),
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
    userAuthenticated: {
      type: Boolean,
      default: false,
    },
    theme: {
      type: String,
      default: 'dark',
      validator: (value) => ['dark', 'light'].indexOf(value) !== -1,
    },
    javaAgentStatus: Number,
    displayAiHelp: {
      type: Boolean,
      default: false,
    },
  },

  provide() {
    return {
      displayAiHelp: this.displayAiHelp,
    };
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
      // special case for appmap-node which doesn't need installation
      // NOTE: remove after appmap-agent-js is deprecated
      // and project state services in IDEs take that into account
      if (this.selectedProject?.language.name === 'JavaScript') return true;

      return this.selectedProject?.agentInstalled;
    },
    hasRecorded() {
      return this.numAppMaps > 0;
    },
    hasUsedNavie() {
      return this.selectedProject?.openedNavie;
    },
    path() {
      return this.selectedProject?.path;
    },
    projectName() {
      return this.selectedProject?.name || '';
    },
    currentStep() {
      return this.statusStates.findIndex((step) => step === StepStatus.InProgress);
    },
    statusStates() {
      return [this.hasInstalled, this.hasRecorded, this.hasUsedNavie].map(
        (stepComplete, index, statuses) => {
          if (stepComplete) return StepStatus.Completed;

          const previousStepComplete = Boolean(index > 0 ? statuses[index - 1] : true);
          if (previousStepComplete) return StepStatus.InProgress;

          return StepStatus.NotStarted;
        }
      );
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
        if (pageIndex === 2) {
          this.$root.$emit('open-navie');
        } else {
          this.jumpToIndex(pageIndex);
        }
      });
  },
};
</script>
