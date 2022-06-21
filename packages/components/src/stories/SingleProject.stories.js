import SingleProject from '@/pages/install-guide/SingleProject.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages',
  component: SingleProject,
  args: {
    projects: [
      {
        name: 'MySingleProject',
        score: 3,
        path: '/home/user/test_app',
        language: {
          value: 'C#',
          score: 3,
        },
        testFramework: {
          value: 'MSTest',
          score: 3,
        },
        webFramework: {
          value: 'ASP.NET',
          score: 3,
        },
      },
    ],
  },
};

export const singleProject = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { SingleProject },
  template: '<SingleProject v-bind="$props" ref="installAgent" />',
});
