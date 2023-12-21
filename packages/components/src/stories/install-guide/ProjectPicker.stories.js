import ProjectPicker from '@/pages/install-guide/ProjectPicker.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages/Project Picker',
  component: ProjectPicker,
  argTypes: {
    currentStatus: {
      control: { type: 'range', min: 0, max: 2 },
      default: 0,
    },
    debugConfigurationStatus: {
      control: { type: 'range', min: 0, max: 2 },
      default: 0,
    },
    javaAgentStatus: {
      control: { type: 'range', min: 0, max: 3 },
      default: 0,
    },
  },
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes).filter((key) => key !== 'projects'),
  computed: {
    statusStates() {
      return [this.currentStatus, this.currentStatus == 2 ? 1 : 0, 0, 0, 0];
    },
  },
  data: () => ({
    projects: args.projects.map((project) => ({
      ...project,
      debugConfigurationStatus: project.debugConfigurationStatus || args.debugConfigurationStatus,
      javaAgentStatus: args.javaAgentStatus,
    })),
  }),
  watch: {
    debugConfigurationStatus(val) {
      for (let i = 0; i < this.projects.length; i++) {
        this.$set(this.projects, i, {
          ...this.projects[i],
          debugConfigurationStatus: val,
        });
      }
    },
    javaAgentStatus(val) {
      for (let i = 0; i < this.projects.length; i++) {
        this.$set(this.projects, i, { ...this.projects[i], javaAgentStatus: val });
      }
    },
  },
  components: { ProjectPicker },
  template:
    '<ProjectPicker v-bind="$props" :projects="projects" :status-states="statusStates" ref="installAgent" />',
});

export const Empty = Template.bind({});
Empty.args = {
  projects: [],
};

export const GoodProject = Template.bind({});
GoodProject.args = {
  projects: [
    {
      name: 'OneProject',
      score: 3,
      path: '/home/user/one_project',
      agentInstalled: true,
      language: {
        name: 'Ruby',
        score: 2,
        text: 'language text',
      },
      testFramework: {
        name: 'minitest',
        score: 2,
        text: 'test framework text',
      },
      webFramework: {
        name: 'Rails',
        score: 2,
        text: 'web framework text',
      },
    },
  ],
};

export const BadProject = Template.bind({});
BadProject.args = {
  projects: [
    {
      name: 'TestApp',
      score: 0,
      path: '/home/user/test_app',
      language: {
        name: 'C#',
        score: 0,
        text: 'language text',
      },
      webFramework: {
        name: 'ASP.NET',
        score: 0,
        text: 'web framework text',
      },
    },
  ],
};

export const UnsupportedProjectWithNoLanguage = Template.bind({});
UnsupportedProjectWithNoLanguage.args = {
  projects: [
    {
      name: 'pgvector',
      path: '/home/ahtrotta/projects/test-apps/pgvector',
      agentInstalled: false,
      appMapsRecorded: false,
      investigatedFindings: false,
      appMapOpened: false,
      appMaps: [],
      numHttpRequests: 0,
      numAppMaps: 0,
      hasNode: false,
      languages: [],
    },
  ],
};

export const OkProject = Template.bind({});
OkProject.args = {
  projects: [
    {
      name: 'RubyTest',
      score: 2,
      path: '/home/user/rails_test',
      language: {
        name: 'Ruby',
        score: 1,
        text: "This project looks like Ruby, but we couldn't find a Gemfile.",
      },
      webFramework: {
        name: 'Rails',
        score: 1,
        text: 'This project uses Rails. AppMap will automatically recognize web requests, SQL queries, and key framework functions during recording.',
      },
    },
  ],
};

export const FourProjects = Template.bind({});
FourProjects.args = {
  projects: [
    {
      name: 'TestApp',
      score: 0,
      path: '/home/user/test_app',
      agentInstalled: true,
      language: {
        name: 'C#',
        score: 0,
        text: 'language text',
      },
      webFramework: {
        name: 'ASP.NET',
        score: 0,
        text: 'web framework text',
      },
    },
    {
      name: 'PythonTest',
      score: 1,
      path: '/home/user/python_test',
      agentInstalled: true,
      language: {
        name: 'Python',
        score: 1,
        text: 'Python is not currently supported by AppMap.',
      },
    },
    {
      name: 'RubyTest',
      score: 2,
      path: '/home/user/ruby_test',
      language: {
        name: 'Ruby',
        score: 1,
        text: "This project looks like Ruby, but we couldn't find a Gemfile.",
      },
      webFramework: {
        name: 'Rails',
        score: 1,
        text: 'This project uses Rails. AppMap will automatically recognize web requests, SQL queries, and key framework functions during recording.',
      },
    },
    {
      name: 'RailsTest',
      score: 3,
      path: '/home/user/rails_test',
      language: {
        name: 'Ruby',
        score: 3,
        text: "This project looks like Ruby. It's one of the languages supported by AppMap.",
      },
      testFramework: {
        name: 'minitest',
        score: 3,
        text: 'This project uses minitest. Test execution can be automatically recorded.',
      },
      webFramework: {
        name: 'Rails',
        score: 3,
        text: 'This project uses Rails. AppMap will automatically recognize web requests, SQL queries, and key framework functions during recording.',
      },
    },
  ],
};

export const RubyVSCode = Template.bind({});
RubyVSCode.args = {
  projects: [
    {
      name: 'myapp',
      score: 2,
      path: '/home/user/myapp',
      language: {
        name: 'Ruby',
        score: 2,
      },
      webFramework: {
        name: 'Rails',
        score: 2,
      },
    },
  ],
  editor: 'vscode',
};

export const PythonVSCode = Template.bind({});
PythonVSCode.args = {
  projects: [
    {
      name: 'myapp',
      score: 2,
      path: '/home/user/myapp',
      language: {
        name: 'Python',
        score: 2,
      },
      webFramework: {
        name: 'Flask',
        score: 2,
      },
    },
  ],
  editor: 'vscode',
};

export const JavaIntelliJ = Template.bind({});
JavaIntelliJ.args = {
  projects: [
    {
      name: 'my_java_project',
      score: 2,
      path: '/home/user/my_java_project',
      language: {
        name: 'Java',
        score: 2,
      },
      webFramework: {
        name: 'Spring',
        score: 2,
      },
    },
  ],
  editor: 'jetbrains',
};

export const JavaVSCode = Template.bind({});
JavaVSCode.args = {
  projects: [
    {
      name: 'my_java_project',
      score: 2,
      path: '/home/user/my_java_project',
      language: {
        name: 'Java',
        score: 2,
      },
      webFramework: {
        name: 'Spring',
        score: 2,
      },
      debugConfigurationStatus: 1,
    },
  ],
  javaAgentStatus: 2,
  editor: 'vscode',
};

export const JavaScriptVSCode = Template.bind({});
JavaScriptVSCode.args = {
  projects: [
    {
      name: 'my-js-project',
      score: 2,
      path: '/home/user/my_js_project',
      language: {
        name: 'JavaScript',
        score: 2,
      },
    },
  ],
  editor: 'vscode',
};
