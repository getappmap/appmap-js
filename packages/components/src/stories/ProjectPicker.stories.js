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
        testFramework: {
          name: 'MSTest',
          score: 1,
          text: 'test framework text',
        },
        webFramework: {
          name: 'ASP.NET',
          score: 1,
          text: 'web framework text',
        },
      },
      {
        name: 'DjangoTest',
        score: 2,
        path: '/home/user/django_test',
        agentInstalled: true,
        language: {
          name: 'Python',
          score: 2,
          text: 'language text',
        },
        testFramework: {
          name: 'PyTest',
          score: 2,
          text: 'test framework text',
        },
        webFramework: {
          name: 'Django',
          score: 3,
          text: 'web framework text',
        },
      },
      {
        name: 'MyOtherProject',
        score: 3,
        path: '/home/user/my_other_project',
        agentInstalled: true,
        appMapsRecorded: true,
        language: {
          name: 'Ruby',
          score: 3,
        },
        testFramework: {
          name: 'RSpec',
          score: 3,
        },
        webFramework: {
          name: 'Rails',
          score: 3,
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
