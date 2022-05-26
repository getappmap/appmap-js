import RecordAppMaps from '@/pages/install-guide/RecordAppMaps.vue';

export default {
  title: 'Pages/VS Code/Quickstart Docs/Record App Maps',
  component: RecordAppMaps,
  args: {
    editor: 'vscode',
  },
};

export const recordAppMaps = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { RecordAppMaps },
  template: '<RecordAppMaps v-bind="$props" ref="recordAppMaps" />',
});
