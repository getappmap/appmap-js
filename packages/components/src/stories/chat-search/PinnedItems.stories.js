import { default as VPinnedItems } from '@/components/chat-search/PinnedItems.vue';
import '../scss/vscode.scss';

export default {
  title: 'Pages/ChatSearch/PinnedItems',
  component: VPinnedItems,
  argTypes: {},
};

export const PinnedItems = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VPinnedItems },
  template: `<v-pinned-items v-bind="$props"></v-pinned-items>`,
});
