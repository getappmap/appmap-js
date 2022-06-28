import ProjectPicker from '@/pages/install-guide/ProjectPicker.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages',
  component: ProjectPicker,
  args: {
    projects: [
      {
        name: 'TestApp',
        score: 1,
        path: '/home/user/test_app',
        agentInstalled: true,
        language: {
          name: 'C#',
          score: 1,
          text: 'language text',
        },
        webFramework: {
          name: 'ASP.NET',
          score: 1,
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
        path: '/home/user/rails_test',
        language: {
          name: 'Ruby',
          score: 2,
          text: "This project looks like Ruby, but we couldn't find a Gemfile.",
        },
        webFramework: {
          name: 'Rails',
          score: 3,
          text: 'This project uses Rails. AppMap will automatically recognize web requests during recording.',
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
          text: 'This project uses Rails. AppMap will automatically recognize web requests during recording.',
        },
      },
    ],
  },
};

export const projectPicker = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { ProjectPicker },
  template: '<ProjectPicker v-bind="$props" ref="installAgent" />',
});
