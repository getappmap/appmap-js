import { v4 as uuidv4 } from 'uuid';

/**
 * Encodes characters unsafe for URI components (path, query, fragment).
 * Specifically targets characters that conflict with delimiters (#, ?)
 * or might cause issues (%, space). Avoids encoding separators like / or :.
 */
function encodeUriComponentPiece(str: string): string {
  // Characters to possibly encode: # ? % space and potentially others if needed
  // Use a regex that targets these specific characters, avoiding / and :
  return str.replace(/[#?%\s]/g, (char) => {
    switch (char) {
      case '#':
        return '%23';
      case '?':
        return '%3F';
      case '%':
        return '%25';
      case ' ':
        return '%20';
      default:
        return char; // Should not happen
    }
  });
}

/**
 * Decodes percent-encoded sequences in URI components.
 */
function decodeUriComponentPiece(str: string | undefined): string | undefined {
  if (str === undefined) {
    return undefined;
  }
  try {
    // Use decodeURIComponent for robustness, as it handles standard encodings.
    // We rely on the fact that we didn't encode characters like / or :
    // so decoding them should be safe. It correctly handles %23, %3F, %25, %20 etc.
    return decodeURIComponent(str);
  } catch (e) {
    // If decoding fails (e.g., malformed % sequence), return the original string.
    // This maintains the "exact data" principle even with bad input.
    console.warn(`Failed to decode URI component piece: "${str}"`, e);
    return str;
  }
}

/**
 * Represents a file line range parsed from a URI fragment.
 */
export interface FileLineRange {
  start: number;
  /** Optional for single-line ranges. */
  end?: number;
}

/**
 * Represents the components of a URI.
 * Stores components RAW. Encoding/decoding happens during toString/parse.
 */
export interface URIComponents {
  scheme: string;
  authority?: string;
  path: string;
  query?: string;
  fragment?: string;
}

/**
 * Represents a URI (Uniform Resource Identifier).
 * This class is designed to handle URIs in a way that performs no mutations of the input across
 * round trip (de)serialization. This avoids introducing edge cases where a client path may not
 * match a local file path resource following a round trip due to transformations that occur
 * during a round trip.
 */
export class URI {
  // Stores RAW components
  private readonly uriComponents: URIComponents;

  private constructor({ scheme, authority, path, query, fragment }: URIComponents) {
    if (!scheme) {
      throw new Error('URI scheme is required.');
    }
    this.uriComponents = {
      scheme,
      authority,
      path,
      query,
      fragment,
    };
  }

  public get scheme(): string {
    return this.uriComponents.scheme;
  }
  public get authority(): string | undefined {
    return this.uriComponents.authority;
  }
  public get path(): string {
    return this.uriComponents.path;
  }
  public get query(): string | undefined {
    return this.uriComponents.query;
  }
  public get fragment(): string | undefined {
    return this.uriComponents.fragment;
  }

  /**
   * Returns the file system path of the URI. This is an alias for the path property, but provides
   * a familiar analog to the `vscode-uri` library's `fsPath` property.
   */
  public get fsPath(): string {
    return this.uriComponents.path;
  }

  public get range(): FileLineRange | undefined {
    // Range is encoded as L{start}[-L{end}] in the fragment
    const rawFragment = this.uriComponents.fragment;
    if (this.scheme === 'file' && rawFragment) {
      const match = rawFragment.match(/^L(\d+)(?:-(?:L)?(\d+))?$/i);
      if (match) {
        const start = parseInt(match[1], 10);
        if (start < 1) return undefined;
        const endStr = match[2];
        let end: number | undefined = undefined;
        if (endStr) {
          end = parseInt(endStr, 10);
          if (end < start || end < 1) return undefined;
        }
        return { start, end };
      }
    }
    return undefined;
  }

  /**
   * Serializes the URI components back into a string.
   * Encodes components as needed to produce a valid URI string
   * that can be unambiguously parsed back to the original raw components.
   */
  public toString(): string {
    let result = this.uriComponents.scheme + ':';

    // Authority generally doesn't need much encoding unless it contains userinfo
    // For simplicity here, we assume authority is safe or pre-encoded if needed.
    if (this.uriComponents.authority !== undefined) {
      result += '//' + this.uriComponents.authority;
    }

    // Encode path, query, fragment before appending
    result += encodeUriComponentPiece(this.uriComponents.path);

    if (this.uriComponents.query !== undefined) {
      result += '?' + encodeUriComponentPiece(this.uriComponents.query);
    }
    if (this.uriComponents.fragment !== undefined) {
      result += '#' + encodeUriComponentPiece(this.uriComponents.fragment);
    }
    return result;
  }

  public static from(components: URIComponents): URI {
    return new URI(components);
  }

  /**
   * Parses a URI string into a URI object.
   * Decodes components after parsing structure, storing raw values internally.
   */
  public static parse(uriString: string): URI {
    if (!uriString) {
      throw new Error('Cannot parse empty URI string');
    }

    let authority: string | undefined = undefined;
    let path: string = ''; // Parsed path (potentially encoded)
    let query: string | undefined = undefined; // Parsed query (potentially encoded)
    let fragment: string | undefined = undefined; // Parsed fragment (potentially encoded)

    const schemeIndex = uriString.indexOf(':');
    if (schemeIndex <= 0) {
      throw new Error(`Malformed URI: Missing or invalid scheme in "${uriString}"`);
    }
    const scheme = uriString.substring(0, schemeIndex);
    let rest = uriString.substring(schemeIndex + 1);

    let pathQueryFragmentPart: string;
    if (rest.startsWith('//')) {
      rest = rest.substring(2);
      let authorityEndIndex = -1;

      if (scheme === 'file') {
        // Check special file cases first
        if (/^[a-zA-Z]:[/\\]/.test(rest)) {
          // file://C:\...
          authority = '';
          authorityEndIndex = 0;
        } else if (rest.startsWith('/')) {
          // file:///...
          authority = '';
          authorityEndIndex = 0;
        } else {
          // file://server/...
          authorityEndIndex = rest.indexOf('/');
        }
      } else {
        // http, https etc.
        authorityEndIndex = rest.indexOf('/');
      }

      if (authorityEndIndex === -1) {
        if (authority === undefined) authority = rest; // Authority is the whole rest
        pathQueryFragmentPart = '';
      } else {
        if (authority === undefined) authority = rest.substring(0, authorityEndIndex);
        pathQueryFragmentPart = rest.substring(authorityEndIndex); // The rest starts with / or is the full windows path
      }
    } else {
      authority = undefined;
      pathQueryFragmentPart = rest;
    }

    // Now parse the pathQueryFragmentPart, respecting the FIRST # and ?
    const fragmentIndex = pathQueryFragmentPart.indexOf('#');
    if (fragmentIndex !== -1) {
      fragment = pathQueryFragmentPart.substring(fragmentIndex + 1);
      pathQueryFragmentPart = pathQueryFragmentPart.substring(0, fragmentIndex);
    }

    const queryIndex = pathQueryFragmentPart.indexOf('?');
    if (queryIndex !== -1) {
      query = pathQueryFragmentPart.substring(queryIndex + 1);
      path = pathQueryFragmentPart.substring(0, queryIndex);
    } else {
      path = pathQueryFragmentPart;
    }

    return new URI({
      scheme,
      authority: authority,
      path: decodeUriComponentPiece(path) ?? '',
      query: decodeUriComponentPiece(query),
      fragment: decodeUriComponentPiece(fragment),
    });
  }

  public static file(filePath: string, range?: FileLineRange): URI {
    let authority: string | undefined = undefined;
    let path = filePath; // Store raw path

    if (path.startsWith('\\\\') || path.startsWith('//')) {
      // UNC path
      const normPath = path.startsWith('//')
        ? path.substring(2)
        : path.substring(2).replace(/\\/g, '/');
      const firstSlash = normPath.indexOf('/');
      if (firstSlash !== -1) {
        authority = normPath.substring(0, firstSlash);
        path = '/' + normPath.substring(firstSlash + 1); // Path component starts with /
      } else if (normPath.length > 0) {
        authority = normPath;
        path = '/';
      } else {
        console.warn(`Potentially malformed UNC path treated as opaque path: ${filePath}`);
        authority = undefined;
        path = filePath; // Fallback to raw path
      }
    } else if (path.startsWith('/') || /^[a-zA-Z]:[/\\]/.test(path)) {
      // Absolute path (Unix or Windows)
      authority = '';
      path = filePath; // Store raw path
    } else {
      // Relative path
      authority = undefined;
      path = filePath; // Store raw path
    }

    let fragment: string | undefined = undefined;
    if (range) {
      if (
        range.start < 1 ||
        (range.end !== undefined && (range.end < range.start || range.end < 1))
      ) {
        throw new Error(`Invalid range: start=${range.start}, end=${range.end}`);
      }
      fragment = `L${range.start}`; // Fragment stored raw
      if (range.end !== undefined) {
        fragment += `-L${range.end}`;
      }
    }

    return new URI({
      scheme: 'file',
      authority,
      path,
      fragment,
    });
  }

  public static random(): URI {
    const uuid = uuidv4();
    // Path stored raw
    return new URI({
      scheme: 'urn',
      authority: undefined,
      path: `uuid:${uuid}`,
      query: undefined,
      fragment: undefined,
    });
  }
}
