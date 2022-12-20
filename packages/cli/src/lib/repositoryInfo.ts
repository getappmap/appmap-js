// Remove user and password from a URL string. The string need not necessarily be a valid URL.
// If it's not, it will be returned unmodified.
export default function sanitizeURL(urlString: string): string {
  const parseURL = (): URL | undefined => {
    try {
      return new URL(urlString);
    } catch {
      // pass
    }
  };

  const url = parseURL();
  if (!url) return urlString;

  return [url.origin, url.pathname, url.search].filter(Boolean).join('');
}
