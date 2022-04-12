// A simple path resolver for displaying source code locations
export default function resolvePath(vm) {
  vm.$root.$on('request-resolve-location', (location) => {
    const isAbsolute = location.startsWith('/');
    vm.$root.$emit('response-resolve-location', {
      location,
      error: isAbsolute && 'External source not available',
      externalUrl:
        !isAbsolute &&
        `https://github.com/example-org/example-repo/blob/master/${location.replace(
          /:(\d+)$/,
          '#L$1'
        )}`,
    });
  });
}
