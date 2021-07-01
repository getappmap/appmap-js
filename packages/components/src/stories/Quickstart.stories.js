import Quickstart from '@/pages/Quickstart.vue';

export default {
  title: 'Pages/VS Code',
  component: Quickstart,
  args: {
    language: 'ruby',
    // completedSteps: [1, 2],
    onAction: () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 2000);
      }),
  },
};

export const quickstart = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { Quickstart },
  template: '<quickstart v-bind="$props" />',
});
