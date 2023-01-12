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
      :editor="editor"
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
    editor: String,
  },

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
    selectProject(project) {
      this.selectedProject = project;
      this.$emit('select-project', project);
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
