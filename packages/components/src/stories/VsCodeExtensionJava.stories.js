import VExtension from '@/pages/VsCodeExtension.vue';
import petClinicScenario from './data/java_scenario.json';

export default {
  title: 'Pages/VS Code',
  component: VExtension,
  parameters: {
    chromatic: {
      delay: 1000,
      diffThreshold: 1,
    },
  },
};

// Controls cannot be set in the URL params until Storybook 6.2 (next release).
// Until then, use this story for testing Java appmaps.
export const extensionJava = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VExtension },
  template: '<v-extension v-bind="$props" ref="vsCode" />',
  mounted() {
    this.$refs.vsCode.loadData(petClinicScenario);
  },
});
