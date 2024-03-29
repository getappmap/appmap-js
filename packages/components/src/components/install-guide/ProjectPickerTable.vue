<template>
  <div class="project-picker-table">
    <v-project-picker-row
      v-for="project in sortedProjects"
      :key="project.name"
      :name="project.name"
      :selected="project === selectedProject"
      :score="project.score"
      :path="project.path"
      :language="project.language"
      :install-complete="project.agentInstalled"
      :test-framework="project.testFramework"
      :web-framework="project.webFramework"
      :num-app-maps="project.numAppMaps"
      :enum-debug-configuration-status="project.debugConfigurationStatus"
      :enum-java-agent-status="javaAgentStatus"
      :editor="editor"
      :status-states="statusStates"
      @toggle="selectProject"
    />
  </div>
</template>

<script>
import VProjectPickerRow from '@/components/install-guide/ProjectPickerRow.vue';
import StatusState from '@/components/mixins/statusState';

export default {
  name: 'project-picker-table',
  components: { VProjectPickerRow },
  props: {
    projects: Array,
    editor: String,
    javaAgentStatus: Number,
  },

  mixins: [StatusState],

  data() {
    return {
      selectedProject: undefined,
    };
  },

  watch: {
    projects(newVal) {
      if (!this.selectedProject || !this.selectedProject.name) return;
      this.selectedProject = newVal.find((p) => p.name === this.selectedProject.name);
    },
  },

  computed: {
    sortedProjects() {
      return [...this.projects].sort((a, b) => {
        if (a.score === b.score) {
          return a.name.localeCompare(b.name);
        }
        if (a.score > b.score) return -1;
        if (a.score < b.score) return 1;
        return 0;
      });
    },
  },

  methods: {
    selectProject(projectPath) {
      this.selectedProject = this.projects.find(({ path }) => path === projectPath);
      this.$emit('select-project', this.selectedProject);
    },
  },
};
</script>

<style lang="scss" scoped>
.project-picker-table {
  border-top: 1px solid lighten($gray2, 15);
  color: $white;
  display: flex;
  flex-direction: column;
  margin: 0.5rem -1.75rem 0 -1.75rem;
}
</style>
