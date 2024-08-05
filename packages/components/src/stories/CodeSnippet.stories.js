import VCodeSnippet from '@/components/CodeSnippet.vue';

export default {
  title: 'AppLand/UI/Code Snippet',
  component: VCodeSnippet,
  argTypes: {
    disabled: {
      control: { type: 'boolean' },
    },
    clipboardText: {
      control: { type: 'text' },
    },
  },
  args: {
    disabled: false,
    clipboardText: 'npx @appland/appmap install-agent ruby',
  },
};

export const CodeSnippet = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VCodeSnippet },
  template: `<div style="transform: translate(-50%, -50%);left: 50%;top: 50%;position: absolute;">
      <v-code-snippet v-bind="$props">$ npx @appland/appmap install-agent ruby</v-code-snippet>
    </div>`,
});

export const MultiLineCodeSnippet = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VCodeSnippet },
  template: `<div>
      <v-code-snippet language="rust" v-bind="$props" clipboard-text="use bevy::prelude::*;

fn main() {
    App::new()
      .add_plugins(DefaultPlugins)
      .add_systems(Update, hello_world_system)
      .run();
}

// This system will be run every frame
fn hello_world_system() {
    println!(&quot;Hello, world!&quot;);
}
" />
</div>`,
});
