import OpenApiPage from '@/pages/install-guide/OpenApi.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages/Generate OpenAPI',
  component: OpenApiPage,
  argTypes: {
    projectName: {
      control: { type: 'text' },
      defaultValue: 'MyProject',
    },
    complete: {
      control: { type: 'boolean' },
      defaultValue: false,
    },
  },
};

function story(args) {
  const fun = (_args, { argTypes }) => ({
    components: { OpenApiPage },
    props: Object.keys(argTypes),
    computed: {
      statusStates() {
        return [2, 2, 2, this.complete ? 2 : 1, this.complete ? 1 : 0];
      },
    },
    template: '<open-api-page v-bind="$props" :status-states="statusStates" />',
  });
  fun.args = args;
  return fun;
}

export const Active = story({ numAppMaps: 42, numHttpRequests: 31 });
export const NoHttpRequests = story({ numAppMaps: 42, numHttpRequests: 0 });
export const NoAppmaps = story({ numAppMaps: 0 });
