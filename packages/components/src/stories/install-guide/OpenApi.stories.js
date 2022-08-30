import OpenApiPage from '@/pages/install-guide/OpenApi.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages/Generate OpenAPI',
  component: OpenApiPage,
};

function story(args) {
  const fun = (_args, { argTypes }) => ({
    components: { OpenApiPage },
    props: Object.keys(argTypes),
    template: '<open-api-page v-bind="$props" />',
  });
  fun.args = args;
  return fun;
}

export const Active = story({ numAppMaps: 42, numHttpRequests: 31 });
export const NoHttpRequests = story({ numAppMaps: 42, numHttpRequests: 0 });
export const NoAppmaps = story({ numAppMaps: 0 });
