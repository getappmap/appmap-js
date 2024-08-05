import ProjectPicker from '@/pages/install-guide/ProjectPicker.vue';
import { mount } from '@vue/test-utils';

export default {
  title: 'Pages/Install Guide Pages',
  component: ProjectPicker,
};

const projects = [
  {
    name: 'my-project',
    path: '/home/user/my-project',
  },
  {
    name: 'my-other-project',
    path: '/home/user/my-project-2',
  },
];

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { ProjectPicker },
  template: '<ProjectPicker v-bind="$props" ref="ui" />',
});

export const Empty = Template.bind({});
Empty.args = {
  projects: [],
};

export const PickProject = Template.bind({});
PickProject.args = {
  projects,
};

export const PickLanguage = (args, { argTypes }) => ({
  data: () => ({
    projects,
  }),
  components: { ProjectPicker },
  template: '<ProjectPicker :projects="projects" ref="ui" />',
  async mounted() {
    this.$refs.ui.projectConfiguration.onSelectProject(projects[0]);
  },
});

export const ConfigureJavaVsCode = (args, { argTypes }) => ({
  data: () => ({
    projects,
  }),
  components: { ProjectPicker },
  template: '<ProjectPicker :projects="projects" editor="vscode" ref="ui" />',
  async mounted() {
    this.$refs.ui.projectConfiguration.onSelectProject(projects[0]);
    this.$refs.ui.projectConfiguration.onSelectLanguage('Java');
  },
});

export const ConfigureJavaJetBrains = (args, { argTypes }) => ({
  data: () => ({
    projects,
  }),
  components: { ProjectPicker },
  template: '<ProjectPicker :projects="projects" editor="jetbrains" ref="ui" />',
  async mounted() {
    this.$refs.ui.projectConfiguration.onSelectProject(projects[0]);
    this.$refs.ui.projectConfiguration.onSelectLanguage('Java');
  },
});

export const ConfigurePython = (args, { argTypes }) => ({
  data: () => ({
    projects,
  }),
  components: { ProjectPicker },
  template: '<ProjectPicker :projects="projects" ref="ui" />',
  async mounted() {
    this.$refs.ui.projectConfiguration.onSelectProject(projects[0]);
    this.$refs.ui.projectConfiguration.onSelectLanguage('Python');
  },
});

export const ConfigureRuby = (args, { argTypes }) => ({
  data: () => ({
    projects,
  }),
  components: { ProjectPicker },
  template: '<ProjectPicker :projects="projects" ref="ui" />',
  async mounted() {
    this.$refs.ui.projectConfiguration.onSelectProject(projects[0]);
    this.$refs.ui.projectConfiguration.onSelectLanguage('Ruby');
  },
});

export const ConfigureNode = (args, { argTypes }) => ({
  data: () => ({
    projects,
  }),
  components: { ProjectPicker },
  template: '<ProjectPicker :projects="projects" ref="ui" />',
  async mounted() {
    this.$refs.ui.projectConfiguration.onSelectProject(projects[0]);
    this.$refs.ui.projectConfiguration.onSelectLanguage('Node.js');
  },
});

export const ConfigureOther = (args, { argTypes }) => ({
  data: () => ({
    projects,
  }),
  components: { ProjectPicker },
  template: '<ProjectPicker :projects="projects" ref="ui" />',
  async mounted() {
    this.$refs.ui.projectConfiguration.onSelectProject(projects[0]);
    this.$refs.ui.projectConfiguration.onSelectLanguage('Other');
  },
});

export const RecordJavaVsCode = (args, { argTypes }) => ({
  data: () => ({
    projects,
  }),
  components: { ProjectPicker },
  template: '<ProjectPicker :projects="projects" editor="vscode" ref="ui" />',
  async mounted() {
    this.$refs.ui.projectConfiguration.onSelectProject(projects[0]);
    this.$refs.ui.projectConfiguration.onSelectLanguage('Java');
    this.$refs.ui.projectConfiguration.onClickSection('record');
  },
});

export const RecordJavaJetBrains = (args, { argTypes }) => ({
  data: () => ({
    projects,
  }),
  components: { ProjectPicker },
  template: '<ProjectPicker :projects="projects" editor="jetbrains" ref="ui" />',
  async mounted() {
    this.$refs.ui.projectConfiguration.onSelectProject(projects[0]);
    this.$refs.ui.projectConfiguration.onSelectLanguage('Java');
    this.$refs.ui.projectConfiguration.onClickSection('record');
  },
});

export const RecordPython = (args, { argTypes }) => ({
  data: () => ({
    projects,
  }),
  components: { ProjectPicker },
  template: '<ProjectPicker :projects="projects" ref="ui" />',
  async mounted() {
    this.$refs.ui.projectConfiguration.onSelectProject(projects[0]);
    this.$refs.ui.projectConfiguration.onSelectLanguage('Python');
    this.$refs.ui.projectConfiguration.onClickSection('record');
  },
});

export const RecordRuby = (args, { argTypes }) => ({
  data: () => ({
    projects,
  }),
  components: { ProjectPicker },
  template: '<ProjectPicker :projects="projects" ref="ui" />',
  async mounted() {
    this.$refs.ui.projectConfiguration.onSelectProject(projects[0]);
    this.$refs.ui.projectConfiguration.onSelectLanguage('Ruby');
    this.$refs.ui.projectConfiguration.onClickSection('record');
  },
});

export const RecordNode = (args, { argTypes }) => ({
  data: () => ({
    projects,
  }),
  components: { ProjectPicker },
  template: '<ProjectPicker :projects="projects" ref="ui" />',
  async mounted() {
    this.$refs.ui.projectConfiguration.onSelectProject(projects[0]);
    this.$refs.ui.projectConfiguration.onSelectLanguage('Node.js');
    this.$refs.ui.projectConfiguration.onClickSection('record');
  },
});
