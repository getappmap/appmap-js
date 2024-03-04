import VToolStatus from '@/components/chat/ToolStatus.vue';
import './scss/vscode.scss';

export default {
  title: 'Pages/Chat/Tools',
  component: VToolStatus,
  argTypes: {},
};

export const Search = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VToolStatus },
  template: `<v-tool-status v-bind="$props" />`,
});
Search.args = {
  title: 'Project analysis complete',
  status: 'Found 3 relevant AppMaps',
  complete: true,
};
