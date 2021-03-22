import VDiff from '@/pages/Diff.vue';
import appmapBase from './data/diff_base.json';
import appmapWorking from './data/diff_working.json';
import './scss/fullscreen.scss';

export default {
  title: 'Pages/VS Code/Diff',
  component: VDiff,
  argTypes: {},
  args: {
    base: appmapBase,
    working: appmapWorking,
  },
};

export const diff = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VDiff },
  template: '<v-diff v-bind="$props" ref="vsCode" />',
});
