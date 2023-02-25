import gitconfig from 'gitconfiglocal';
import assert from 'node:assert';
import { pathToFileURL } from 'node:url';
import { promisify, types } from 'util';

// Attempt to parse special syntax allowed by git:
// - scp-style urls ([user@]host.xz:path/to/repo.git/),
// - bare file paths.
function parseSpecial(url: string): URL | undefined {
  // From git-push(1):
  // > This syntax is only recognized if there are no slashes before the first colon.
  // > This helps differentiate a local path that contains a colon.
  // Note {2,} is to avoid recognizing d:/windows style paths.
  if (url.match(/^[^/]{2,}:/)) return new URL('ssh://' + url.replace(':', '/'));
  else return pathToFileURL(url);
}

// Utility type. This is just so the type system can
// verify we're not leaking unsanitized uris anywhere.
class SanitizedUri {
  uri: URL;

  constructor(uri: string) {
    try {
      this.uri = new URL(uri);
    } catch (err) {
      assert(types.isNativeError(err));
      if (err.name === 'TypeError') {
        const special = parseSpecial(uri);
        if (!special) throw err;
        this.uri = special;
      } else throw err;
    }
    this.uri.username = '';
    this.uri.password = '';
  }

  toString() {
    return this.uri.toString();
  }
}

function hasUrl(remote: unknown): remote is { url: string } {
  return remote && remote['url'];
}

async function findAndSanitizeRepository(dir: string): Promise<SanitizedUri | void> {
  try {
    const config = await promisify(gitconfig)(dir);
    const remote: unknown = config.remote;
    if (!remote || typeof remote !== 'object') return;

    const origin = remote['origin'];
    if (hasUrl(origin)) return new SanitizedUri(origin.url);

    const first = Object.values(remote).find(hasUrl);
    if (!first) return;
    return new SanitizedUri(first.url);
  } catch (err) {
    assert(types.isNativeError(err));
    if (err.message.includes('no gitconfig')) return;
    throw err;
  }
}

export async function findRepository(dir: string): Promise<string | undefined> {
  return (await findAndSanitizeRepository(dir))?.toString();
}
