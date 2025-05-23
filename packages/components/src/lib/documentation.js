const documentationUrls = {
  ruby: 'https://appmap.io/docs/reference/appmap-ruby.html',
  python: 'https://appmap.io/docs/reference/appmap-python.html',
  java: 'https://appmap.io/docs/reference/appmap-java.html',
  javascript: 'https://appmap.io/docs/reference/appmap-node.html',
};

export function getAgentDocumentationUrl(language) {
  if (!language || typeof language !== 'string') return undefined;

  return documentationUrls[language.toLowerCase()];
}
