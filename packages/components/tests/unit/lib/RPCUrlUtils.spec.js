import { parseRpcUrl } from '@/lib/RPCUrlUtils';

describe('parseRpcUrl', () => {
  it('defaults to localhost:30101', () => {
    expect(parseRpcUrl(undefined)).toEqual({
      httpUrl: 'http://localhost:30101',
      wsUrl: 'ws://localhost:30101',
      isLocalhost: true,
    });
  });

  describe('numeric port', () => {
    it('builds a localhost URL', () => {
      expect(parseRpcUrl(3000)).toEqual({
        httpUrl: 'http://localhost:3000',
        wsUrl: 'ws://localhost:3000',
        isLocalhost: true,
      });
    });

    it('throws for port 0', () => {
      expect(() => parseRpcUrl(0)).toThrow('Invalid port number');
    });

    it('throws for port above 65535', () => {
      expect(() => parseRpcUrl(65536)).toThrow('Invalid port number');
    });
  });

  describe('string URL', () => {
    it('parses an HTTP URL', () => {
      expect(parseRpcUrl('http://remote-server:8080')).toEqual({
        httpUrl: 'http://remote-server:8080/',
        wsUrl: 'ws://remote-server:8080/',
        isLocalhost: false,
      });
    });

    it('converts HTTPS to WSS', () => {
      expect(parseRpcUrl('https://secure.example.com:8443')).toEqual({
        httpUrl: 'https://secure.example.com:8443/',
        wsUrl: 'wss://secure.example.com:8443/',
        isLocalhost: false,
      });
    });

    it('preserves path and trailing slash', () => {
      expect(parseRpcUrl('http://example.com:8080/api/')).toEqual({
        httpUrl: 'http://example.com:8080/api/',
        wsUrl: 'ws://example.com:8080/api/',
        isLocalhost: false,
      });
    });

    it('strips query params and hash', () => {
      const result = parseRpcUrl('http://example.com:8080/api?foo=bar#section');
      expect(result.httpUrl).toBe('http://example.com:8080/api');
      expect(result.wsUrl).toBe('ws://example.com:8080/api');
    });

    it('trims whitespace', () => {
      expect(parseRpcUrl('  http://example.com:8080  ')).toEqual({
        httpUrl: 'http://example.com:8080/',
        wsUrl: 'ws://example.com:8080/',
        isLocalhost: false,
      });
    });

    it('throws for missing protocol', () => {
      expect(() => parseRpcUrl('remote-server:8080')).toThrow('must include a protocol');
    });

    it('parses a URL without a port', () => {
      expect(parseRpcUrl('http://example.com/api')).toEqual({
        httpUrl: 'http://example.com/api',
        wsUrl: 'ws://example.com/api',
        isLocalhost: false,
      });
    });

    it('throws for unsupported protocol', () => {
      expect(() => parseRpcUrl('ws://localhost:3000')).toThrow('Invalid RPC URL protocol');
    });

    it('throws for invalid URL', () => {
      expect(() => parseRpcUrl('not a valid url')).toThrow('Invalid RPC URL');
    });
  });

  describe('localhost detection', () => {
    it.each([
      ['http://localhost:3000'],
      ['http://127.0.0.1:3000'],
      ['http://[::1]:3000'],
    ])('detects %s as local', (url) => {
      expect(parseRpcUrl(url).isLocalhost).toBe(true);
    });

    it('returns false for remote hosts', () => {
      expect(parseRpcUrl('http://remote-server:8080').isLocalhost).toBe(false);
    });
  });
});
