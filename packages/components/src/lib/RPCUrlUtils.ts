export interface ParsedRpcUrl {
  httpUrl: string; // e.g., "http://remote:8080/"
  wsUrl: string; // e.g., "ws://remote:8080/"
  isLocalhost: boolean;
}

const DEFAULT_PORT = 30101;

/**
 * Parse an RPC URL into HTTP and WebSocket URLs.
 *
 * - Requires an explicit protocol (http:// or https://)
 * - Query parameters and hashes are stripped
 *
 * @param input - Port number, full URL, or undefined
 * @returns Parsed URLs and localhost detection
 *
 * @example
 * parseRpcUrl(3000) // => { httpUrl: 'http://localhost:3000', wsUrl: 'ws://localhost:3000', isLocalhost: true }
 * parseRpcUrl('http://remote:8080') // => { httpUrl: 'http://remote:8080/', wsUrl: 'ws://remote:8080/', isLocalhost: false }
 */
export function parseRpcUrl(input: string | number | undefined): ParsedRpcUrl {
  // Default to localhost:30101 if undefined
  if (input === undefined) {
    return {
      httpUrl: `http://localhost:${DEFAULT_PORT}`,
      wsUrl: `ws://localhost:${DEFAULT_PORT}`,
      isLocalhost: true,
    };
  }

  // If input is a number, treat it as a port
  if (typeof input === 'number') {
    if (input < 1 || input > 65535) {
      throw new Error(`Invalid port number: ${input}. Port must be between 1 and 65535.`);
    }
    return {
      httpUrl: `http://localhost:${input}`,
      wsUrl: `ws://localhost:${input}`,
      isLocalhost: true,
    };
  }

  // Input is a string
  const urlString = input.trim();

  // Reject unsupported or missing protocols
  const protocolMatch = urlString.match(/^([a-z][a-z0-9+.-]*):\/\//i);
  if (!protocolMatch) {
    throw new Error(`Invalid RPC URL: must include a protocol (http:// or https://): ${input}`);
  }

  const protocol = protocolMatch[1].toLowerCase();
  if (protocol !== 'http' && protocol !== 'https') {
    throw new Error(
      `Invalid RPC URL protocol: ${protocol}. Only http:// and https:// are supported.`
    );
  }

  // Parse and validate the URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlString);
  } catch (error) {
    throw new Error(`Invalid RPC URL: ${input}`);
  }

  // Strip query parameters and hash, then stringify
  parsedUrl.search = '';
  parsedUrl.hash = '';
  const httpUrl = parsedUrl.toString();

  // Convert HTTP → WS, HTTPS → WSS for WebSocket URL
  parsedUrl.protocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = parsedUrl.toString();

  // Detect localhost (IPv6 [::1] hostname includes brackets in WHATWG URL API)
  const isLocalhost =
    parsedUrl.hostname === 'localhost' ||
    parsedUrl.hostname === '127.0.0.1' ||
    parsedUrl.hostname === '[::1]';

  return {
    httpUrl,
    wsUrl,
    isLocalhost,
  };
}
