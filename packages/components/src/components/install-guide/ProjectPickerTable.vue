<template>
  <table class="project-picker-table">
    <thead>
      <tr>
        <th scope="col">Project name ({{ projects.length }})</th>
        <th scope="col">Language</th>
        <th scope="col">Test framework</th>
        <th scope="col">Web framework</th>
      </tr>
    </thead>
    <tbody>
      <v-project-picker-row
        v-for="project in projects"
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
    </tbody>
  </table>
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
  border: 2px solid $color-highlight;
  width: 100%;
  text-align: right;
  border-radius: 8px;
  border-spacing: 0;

  th {
    border-bottom: 2px solid $color-highlight;
    padding: 1em 2ex;

    &:first-child {
      text-align: left;
    }
  }
}
</style>
