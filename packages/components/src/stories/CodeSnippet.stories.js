import VCodeSnippet from '@/components/CodeSnippet.vue';

export default {
  title: 'AppLand/UI/Code Snippet',
  component: VCodeSnippet,
  argTypes: {
    disabled: {
      control: { type: 'boolean' },
      defaultValue: false,
    },
    clipboardText: {
      control: { type: 'text' },
      defaultValue: 'npx @appland/appmap install-agent ruby',
    },
  },
};

export const codeSnippet = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VCodeSnippet },
  template: `<div style="transform: translate(-50%, -50%);left: 50%;top: 50%;position: absolute;">
      <v-code-snippet v-bind="$props">$ npx @appland/appmap install-agent ruby</v-code-snippet>
    </div>`,
});
