<template>
  <v-multi-page ref="page">
    <v-project-picker
      :projects="projects"
      :message-success="messageCopiedCommand"
    />
    <v-record-app-maps
      :editor="editor"
      :project="selectedProject"
      :complete="selectedProject && selectedProject.appMapsRecorded"
    />
    <v-investigate-findings
      :scanned="selectedProject && selectedProject.analysisPerformed"
      :num-findings="selectedProject && selectedProject.numFindings"
      :project-path="selectedProject && selectedProject.path"
    />
  </v-multi-page>
</template>

<script>
import VMultiPage from '@/pages/MultiPage.vue';
import VProjectPicker from '@/pages/install-guide/ProjectPicker.vue';
import VRecordAppMaps from '@/pages/install-guide/RecordAppMaps.vue';
import VInvestigateFindings from '@/pages/install-guide/InvestigateFindings.vue';

export default {
  name: 'install-guide',

  props: {
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

  data() {
    return {
      selectedProject: null,
    };
  },

  components: {
    VMultiPage,
    VProjectPicker,
    VRecordAppMaps,
    VInvestigateFindings,
  },

  methods: {
    jumpTo(pageIndex) {
      this.$refs.page.jumpTo(pageIndex);
    },
  },

  mounted() {
    this.$root.$on('select-project', (project) => {
      console.log('root selecting', project);
      this.selectedProject = project;
    });
  },
};
</script>
