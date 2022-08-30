import VRecordAppMaps from '@/pages/install-guide/RecordAppMaps.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages',
  component: VRecordAppMaps,
  args: {
    project: {
      name: 'MyOtherProject',
      score: 3,
      path: '/home/user/my_other_project',
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
    editor: 'vscode',
    complete: 'true',
  },
};

export const recordAppMaps = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VRecordAppMaps },
  template: '<v-record-app-maps v-bind="$props" />',
});
