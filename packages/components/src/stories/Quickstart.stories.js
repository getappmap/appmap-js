import Quickstart from '@/pages/Quickstart.vue';

export default {
  title: 'Pages/VS Code',
  component: Quickstart,
  args: {
    language: 'ruby',
    onAction: () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 1000);
      }),
  },
};

export const quickstart = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { Quickstart },
  template: '<quickstart v-bind="$props" />',
});
