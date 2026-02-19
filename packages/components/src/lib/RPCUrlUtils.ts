export interface ParsedRpcUrl {
  httpUrl: string;      // e.g., "http://remote:8080"
  wsUrl: string;        // e.g., "ws://remote:8080"
  isLocalhost: boolean;
}

const DEFAULT_PORT = 30101;

/**
 * Parse an RPC URL or port number into HTTP and WebSocket URLs.
 *
 * Query parameters and hashes are stripped from the URL since they don't make sense
 * for a base RPC server URL and would conflict with WebSocket connection parameters.
 *
 * @param input - Port number, full URL, or undefined
 * @returns Parsed URLs and localhost detection
 *
 * @example
 * parseRpcUrl(3000) // => { httpUrl: 'http://localhost:3000', wsUrl: 'ws://localhost:3000', isLocalhost: true }
 * parseRpcUrl('http://remote:8080') // => { httpUrl: 'http://remote:8080', wsUrl: 'ws://remote:8080', isLocalhost: false }
 * parseRpcUrl('https://api.example.com/rpc') // => { httpUrl: 'https://api.example.com/rpc', wsUrl: 'wss://api.example.com/rpc', isLocalhost: false }
 * parseRpcUrl('http://example.com?foo=bar') // => { httpUrl: 'http://example.com', ... } (query params stripped)
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
    return {
      httpUrl: `http://localhost:${input}`,
      wsUrl: `ws://localhost:${input}`,
      isLocalhost: true,
    };
  }

  // Input is a string - parse as URL
  let urlString = input.trim();

  // Check for unsupported protocols before processing
  const protocolMatch = urlString.match(/^([a-z][a-z0-9+.-]*):\/\//i);
  if (protocolMatch) {
    const protocol = protocolMatch[1].toLowerCase();
    if (protocol !== 'http' && protocol !== 'https') {
      throw new Error(`Invalid RPC URL protocol: ${protocol}:. Only http:// and https:// are supported.`);
    }
  }

  // Add http:// prefix if no protocol specified
  if (!urlString.match(/^https?:\/\//i)) {
    urlString = `http://${urlString}`;
  }

  // Parse and validate the URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlString);
  } catch (error) {
    throw new Error(`Invalid RPC URL: ${input}`);
  }

  // Build HTTP URL (preserve protocol, host, port, and path only)
  // Strip query parameters and hash since they don't make sense for a base RPC URL
  const httpUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`.replace(/\/$/, '');

  // Convert HTTP → WS, HTTPS → WSS for WebSocket URL
  const wsProtocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = httpUrl.replace(/^https?:/, wsProtocol);

  // Detect localhost
  const isLocalhost = parsedUrl.hostname === 'localhost' ||
                      parsedUrl.hostname === '127.0.0.1' ||
                      parsedUrl.hostname === '::1';

  return {
    httpUrl,
    wsUrl,
    isLocalhost,
  };
}
