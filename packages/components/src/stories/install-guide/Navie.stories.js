import VNavieIntroduction from '@/pages/install-guide/NavieIntroduction.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages/Navie Introduction',
  component: VNavieIntroduction,
  argTypes: {
    projectName: {
      control: { type: 'text' },
      default: 'MyProject',
    },
  },
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VNavieIntroduction },
  template: '<v-navie-introduction v-bind="$props"/>',
});

export const WithAppmaps = Template.bind({});
WithAppmaps.args = {
  projectName: 'test project',
  numAppMaps: 10,
  statusStates: [2, 2, 1],
};

export const NoAppmaps = Template.bind({});
NoAppmaps.args = {
  projectName: 'test project',
  numAppMaps: 0,
  statusStates: [2, 1, 0],
};
