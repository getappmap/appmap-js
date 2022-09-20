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
      :test-framework="project.testFramework"
      :web-framework="project.webFramework"
      @click.native="selectProject(project)"
    />
  </div>
</template>

<script>
import VProjectPickerRow from '@/components/install-guide/ProjectPickerRow.vue';

export default {
  name: 'project-picker-table',
  components: { VProjectPickerRow },
  props: {
    projects: Array,
  },

  data() {
    return {
      selectedProject: undefined,
    };
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
    selectProject(project) {
      this.selectedProject = project;
      this.$emit('select-project', project);
    },
  },
};
</script>

<style lang="scss" scoped>
.project-picker-table {
  width: 100%;
  border-radius: 8px;
  border-spacing: 0;
  color: $white;
}
</style>
