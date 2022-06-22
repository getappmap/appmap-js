import SingleProject from '@/pages/install-guide/SingleProject.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages',
  component: SingleProject,
  args: {
    projects: [
      {
        name: 'MySingleProject',
        score: 2,
        path: '/home/user/test_app',
        language: {
          name: 'Ruby',
          score: 3,
        },
        testFramework: {},
        webFramework: {
          name: 'Rails',
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
