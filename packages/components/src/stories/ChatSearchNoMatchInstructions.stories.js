import VNoMatchInstructions from '@/components/chat-search/NoMatchInstructions.vue';

export default {
  title: 'Pages/ChatSearch/NoMatchInstructions',
  component: VNoMatchInstructions,
  argTypes: {},
};

const appmapStats = {
  numAppMaps: 100,
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VNoMatchInstructions },
  template: `<div style="background-color: #262C40; padding: 1rem; font-family: system-ui;"><v-no-match-instructions v-bind="$props"></v-no-match-instructions></div>`,
});

export const NoMatchInstructions = Template.bind({});
NoMatchInstructions.args = {
  appmapStats,
};
