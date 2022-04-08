// A simple path resolver for displaying source code locations
export default function resolvePath(vm) {
  vm.$root.$on('request-resolve-location', (location) => {
    const isAbsolute = location.startsWith('/');
    vm.$root.$emit('response-resolve-location', {
      location,
      error: isAbsolute && 'External source not available',
      external: !isAbsolute,
    });
  });
}
