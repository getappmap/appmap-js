const documentationUrls = {
  ruby: 'https://appmap.io/docs/reference/appmap-ruby.html',
  python: 'https://appmap.io/docs/reference/appmap-python.html',
  java: 'https://appmap.io/docs/reference/appmap-java.html',
  javascript: 'https://appmap.io/docs/reference/appmap-agent-js.html',
};

// eslint-disable-next-line import/prefer-default-export
export function getAgentDocumentationUrl(language) {
  if (!language || typeof language !== 'string') return undefined;

  return documentationUrls[language.toLowerCase()];
}
