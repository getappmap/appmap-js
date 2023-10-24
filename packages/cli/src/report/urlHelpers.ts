import { isAbsolute, join, relative } from 'path';
import { RevisionName } from '../diffArchive/RevisionName';
import { AppMap } from '../cmds/compare-report/ChangeReport';
import { SafeString } from 'handlebars';
import { base64UrlEncode } from '@appland/models';
import assert from 'assert';

export type URLOptions = {
  appmapURL?: string;
  sourceURL?: string;
  baseDir?: string;
};

function buildUrlString(appmapURL: string, searchParams: Record<string, string>): string {
  const url = new URL(appmapURL);
  Object.keys(searchParams).forEach((key) => url.searchParams.append(key, searchParams[key]));
  return url.toString();
}

export default function urlHelpers(options: URLOptions): Record<string, (...args: any) => any> {
  let { baseDir } = options;
  if (!baseDir) baseDir = process.cwd();

  const source_url = (location: string, fileLinenoSeparator = '#L') => {
    if (typeof fileLinenoSeparator === 'object') {
      fileLinenoSeparator = '#L';
    }

    const [path, lineno] = location.split(':');

    if (isAbsolute(path)) return;
    if (path.startsWith('vendor/') || path.startsWith('node_modules/')) return;

    if (options.sourceURL) {
      const url = new URL(options.sourceURL.toString());
      if (url.protocol === 'file:') {
        assert(baseDir);
        const sourcePath = relative(baseDir, join(url.pathname, path));
        return new SafeString([sourcePath, lineno].filter(Boolean).join(fileLinenoSeparator));
      } else {
        url.pathname = join(url.pathname, path);
        if (lineno) url.hash = `L${lineno}`;
        return new SafeString(url.toString());
      }
    } else {
      return new SafeString(location);
    }
  };

  const appmap_url = (revisionName: RevisionName, appmap: AppMap): SafeString => {
    let { id } = appmap;
    const path = [revisionName, `${id}.appmap.json`].join('/');

    let url = path;
    if (options.appmapURL) url = buildUrlString(options.appmapURL, { path });
    return new SafeString(url);
  };

  const appmap_diff_url = (appmap: AppMap): SafeString => {
    const path = ['diff', `${appmap.id}.diff.sequence.json`].join('/');

    let url = path;
    if (options.appmapURL) url = buildUrlString(options.appmapURL, { path });
    return new SafeString(url);
  };

  const appmap_url_with_finding = (
    revisionName: RevisionName,
    appmap: AppMap,
    findingHash: string
  ) => {
    let { id } = appmap;
    const path = [revisionName, `${id}.appmap.json`].join('/');

    let url = path;
    if (options.appmapURL) {
      const searchParams = { path } as Record<string, string>;
      try {
        const stateObject = { selectedObject: `analysis-finding:${findingHash}` };
        const state = base64UrlEncode(JSON.stringify(stateObject));
        searchParams.state = state;
      } catch (e) {
        // do not add state
      }
      url = buildUrlString(options.appmapURL, searchParams);
    }
    return new SafeString(url);
  };

  const source_link = (location: string, fileLinenoSeparator = '#L'): SafeString => {
    const label = location;
    const url = source_url(location, fileLinenoSeparator);
    return url ? new SafeString(`[\`${label}\`](${url})`) : new SafeString(`\`${label}\``);
  };

  const first_source_link = (
    locations: string[],
    fileLinenoSeparator = '#L'
  ): SafeString | undefined => {
    const location = locations.find((loc) => source_url(loc, fileLinenoSeparator));
    if (!location) return;

    return source_link(location, fileLinenoSeparator);
  };

  const source_link_html = (location: string, fileLinenoSeparator = '#L'): SafeString => {
    const label = location;
    const url = source_url(location, fileLinenoSeparator);
    return url
      ? new SafeString(`<a href="${url}"><code>${label}</code></a>`)
      : new SafeString(label);
  };

  return {
    appmap_url,
    appmap_diff_url,
    appmap_url_with_finding,
    first_source_link,
    source_link,
    source_link_html,
    source_url,
  };
}
