import eventBus from '@/lib/eventBus';

// A simple path resolver for displaying source code locations
export default function resolvePath() {
  eventBus.on('request-resolve-location', (location) => {
    const isAbsolute = location.startsWith('/');
    eventBus.emit('response-resolve-location', {
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
