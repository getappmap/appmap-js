import { parseRpcUrl } from '@/lib/RPCUrlUtils';

describe('RPCUrlUtils', () => {
  describe('parseRpcUrl', () => {
    describe('with undefined input', () => {
      it('returns default localhost:30101', () => {
        const result = parseRpcUrl(undefined);
        expect(result).toEqual({
          httpUrl: 'http://localhost:30101',
          wsUrl: 'ws://localhost:30101',
          isLocalhost: true,
        });
      });
    });

    describe('with port number', () => {
      it('converts port to localhost HTTP URL', () => {
        const result = parseRpcUrl(3000);
        expect(result).toEqual({
          httpUrl: 'http://localhost:3000',
          wsUrl: 'ws://localhost:3000',
          isLocalhost: true,
        });
      });

      it('handles port 30101', () => {
        const result = parseRpcUrl(30101);
        expect(result).toEqual({
          httpUrl: 'http://localhost:30101',
          wsUrl: 'ws://localhost:30101',
          isLocalhost: true,
        });
      });
    });

    describe('with full HTTP URL', () => {
      it('parses HTTP URL with hostname and port', () => {
        const result = parseRpcUrl('http://remote-server:8080');
        expect(result).toEqual({
          httpUrl: 'http://remote-server:8080',
          wsUrl: 'ws://remote-server:8080',
          isLocalhost: false,
        });
      });

      it('parses HTTP URL with localhost', () => {
        const result = parseRpcUrl('http://localhost:3000');
        expect(result).toEqual({
          httpUrl: 'http://localhost:3000',
          wsUrl: 'ws://localhost:3000',
          isLocalhost: true,
        });
      });

      it('parses HTTP URL with 127.0.0.1', () => {
        const result = parseRpcUrl('http://127.0.0.1:3000');
        expect(result).toEqual({
          httpUrl: 'http://127.0.0.1:3000',
          wsUrl: 'ws://127.0.0.1:3000',
          isLocalhost: true,
        });
      });

      it('parses HTTP URL with path', () => {
        const result = parseRpcUrl('http://api.example.com/rpc');
        expect(result).toEqual({
          httpUrl: 'http://api.example.com/rpc',
          wsUrl: 'ws://api.example.com/rpc',
          isLocalhost: false,
        });
      });

      it('removes trailing slash', () => {
        const result = parseRpcUrl('http://example.com:8080/');
        expect(result).toEqual({
          httpUrl: 'http://example.com:8080',
          wsUrl: 'ws://example.com:8080',
          isLocalhost: false,
        });
      });
    });

    describe('with HTTPS URL', () => {
      it('converts HTTPS to WSS for WebSocket', () => {
        const result = parseRpcUrl('https://secure.example.com:8080');
        expect(result).toEqual({
          httpUrl: 'https://secure.example.com:8080',
          wsUrl: 'wss://secure.example.com:8080',
          isLocalhost: false,
        });
      });

      it('preserves path in HTTPS to WSS conversion', () => {
        const result = parseRpcUrl('https://api.example.com/rpc/v1');
        expect(result).toEqual({
          httpUrl: 'https://api.example.com/rpc/v1',
          wsUrl: 'wss://api.example.com/rpc/v1',
          isLocalhost: false,
        });
      });
    });

    describe('with protocol-less URL', () => {
      it('adds http:// prefix to hostname:port', () => {
        const result = parseRpcUrl('remote-server:8080');
        expect(result).toEqual({
          httpUrl: 'http://remote-server:8080',
          wsUrl: 'ws://remote-server:8080',
          isLocalhost: false,
        });
      });

      it('adds http:// prefix to localhost:port', () => {
        const result = parseRpcUrl('localhost:3000');
        expect(result).toEqual({
          httpUrl: 'http://localhost:3000',
          wsUrl: 'ws://localhost:3000',
          isLocalhost: true,
        });
      });

      it('adds http:// prefix to hostname with path', () => {
        const result = parseRpcUrl('example.com/api');
        expect(result).toEqual({
          httpUrl: 'http://example.com/api',
          wsUrl: 'ws://example.com/api',
          isLocalhost: false,
        });
      });
    });

    describe('localhost detection', () => {
      it('detects localhost hostname', () => {
        const result = parseRpcUrl('http://localhost:3000');
        expect(result.isLocalhost).toBe(true);
      });

      it('detects 127.0.0.1', () => {
        const result = parseRpcUrl('http://127.0.0.1:3000');
        expect(result.isLocalhost).toBe(true);
      });

      it('returns false for remote hostnames', () => {
        const result = parseRpcUrl('http://remote-server:8080');
        expect(result.isLocalhost).toBe(false);
      });

      it('returns false for domain names', () => {
        const result = parseRpcUrl('http://example.com:8080');
        expect(result.isLocalhost).toBe(false);
      });
    });

    describe('error handling', () => {
      it('throws error for invalid URL', () => {
        expect(() => parseRpcUrl('not a valid url')).toThrow('Invalid RPC URL');
      });

      it('throws error for unsupported protocol', () => {
        expect(() => parseRpcUrl('ftp://example.com:8080')).toThrow(
          'Invalid RPC URL protocol'
        );
      });

      it('throws error for ws:// protocol (should use http://)', () => {
        expect(() => parseRpcUrl('ws://localhost:3000')).toThrow(
          'Invalid RPC URL protocol'
        );
      });

      it('throws error for wss:// protocol (should use https://)', () => {
        expect(() => parseRpcUrl('wss://secure.example.com')).toThrow(
          'Invalid RPC URL protocol'
        );
      });
    });

    describe('edge cases', () => {
      it('strips query parameters from base URL', () => {
        const result = parseRpcUrl('http://example.com:8080?foo=bar');
        expect(result.httpUrl).toBe('http://example.com:8080');
        expect(result.wsUrl).toBe('ws://example.com:8080');
        expect(result.httpUrl).not.toContain('?foo=bar');
      });

      it('strips hash from base URL', () => {
        const result = parseRpcUrl('http://example.com:8080#section');
        expect(result.httpUrl).toBe('http://example.com:8080');
        expect(result.wsUrl).toBe('ws://example.com:8080');
        expect(result.httpUrl).not.toContain('#section');
      });

      it('trims whitespace from input', () => {
        const result = parseRpcUrl('  http://example.com:8080  ');
        expect(result).toEqual({
          httpUrl: 'http://example.com:8080',
          wsUrl: 'ws://example.com:8080',
          isLocalhost: false,
        });
      });

      it('handles URL without port', () => {
        const result = parseRpcUrl('http://example.com');
        expect(result).toEqual({
          httpUrl: 'http://example.com',
          wsUrl: 'ws://example.com',
          isLocalhost: false,
        });
      });
    });
  });
});
