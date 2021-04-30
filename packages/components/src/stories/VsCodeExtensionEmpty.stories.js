import VExtension from '@/pages/VsCodeExtension.vue';

export default {
  title: 'Pages/VS Code/Extension Empty',
  component: VExtension,
};

// Controls cannot be set in the URL params until Storybook 6.2 (next release).
// Until then, use this story for testing Java appmaps.
export const extensionEmpty = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VExtension },
  template: '<v-extension v-bind="$props" ref="vsCode" />',
  mounted() {
    this.$refs.vsCode.loadData('{}');
  },
});
