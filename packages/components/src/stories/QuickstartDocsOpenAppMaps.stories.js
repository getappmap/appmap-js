import OpenAppMaps from '@/pages/quickstart-docs/OpenAppMaps.vue';

export default {
  title: 'Pages/VS Code/Quickstart Docs/Open App Maps',
  component: OpenAppMaps,
  args: {
    appmaps: [
      {
        name: 'Appmap 1',
        path: '/path/to/appmap',
        requests: 4,
        sqlQueries: 29,
        functions: 136,
      },
      {
        name: 'Appmap 2',
        path: '/another/path/to/appmap',
        requests: 1,
        sqlQueries: 15,
        functions: 22,
      },
      {
        name: 'Appmap 3',
        path: '/one/more/path/to/appmap',
        requests: 12,
        sqlQueries: 7,
        functions: 279,
      },
    ],
    projectName: 'my_web_app',
  },
};

export const openAppMaps = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { OpenAppMaps },
  template: '<OpenAppMaps v-bind="$props" ref="openAppMaps" />',
});
