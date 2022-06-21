<template>
  <v-multi-page ref="page" :disabled-pages="disabledPages">
    <v-project-picker
      id="project-picker"
      :projects="projects"
      :message-success="messageCopiedCommand"
    />
    <v-record-app-maps
      id="record-appmaps"
      :editor="editor"
      :project="selectedProject"
      :complete="hasRecorded"
    />
    <v-open-app-maps id="open-appmaps" :app-maps="appMaps" />
    <v-investigate-findings
      id="investigate-findings"
      :scanned="hasFindings"
      :num-findings="numFindings"
      :project-path="path"
    />
  </v-multi-page>
</template>

<script>
import VMultiPage from '@/pages/MultiPage.vue';
import VProjectPicker from '@/pages/install-guide/ProjectPicker.vue';
import VRecordAppMaps from '@/pages/install-guide/RecordAppMaps.vue';
import VOpenAppMaps from '@/pages/install-guide/OpenAppMaps.vue';
import VInvestigateFindings from '@/pages/install-guide/InvestigateFindings.vue';

export default {
  name: 'single-project',

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
    },
  },

  watch: {
    projects(newVal) {
      if (!this.selectedProject || !this.selectedProject.name) return;
      this.selectedProject = newVal.find(
        (p) => p.name === this.selectedProject.name
      );
    },
  },

  data() {
    return {
      selectedProject: null,
    };
  },

  computed: {
    hasRecorded() {
      return this.selectedProject && this.selectedProject.appMapsRecorded;
    },
    hasFindings() {
      return this.selectedProject && this.selectedProject.analysisPerformed;
    },
    appMaps() {
      return (this.selectedProject && this.selectedProject.appMaps) || [];
    },
    numFindings() {
      return this.selectedProject && this.selectedProject.numFindings;
    },
    path() {
      return this.selectedProject && this.selectedProject.path;
    },
  },

  components: {
    VMultiPage,
    VProjectPicker,
    VRecordAppMaps,
    VInvestigateFindings,
    VOpenAppMaps,
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
