import VNoMatchInstructions from '@/components/chat-search/NoMatchInstructions.vue';

export default {
  title: 'Pages/ChatSearch/NoMatchInstructions',
  component: VNoMatchInstructions,
  argTypes: {},
};

const appmapStats = [
  {
    name: 'project',
    numAppMaps: 100,
  },
];

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VNoMatchInstructions },
  template: `<div style="font-family: system-ui;"><v-no-match-instructions v-bind="$props"></v-no-match-instructions></div>`,
});

export const NoMatchInstructions = Template.bind({});
NoMatchInstructions.args = {
  appmapStats,
};
