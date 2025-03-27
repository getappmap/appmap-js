import http from 'http';
import { AddressInfo } from 'net';
import createRequest from '../../../src/lib/ticket/zendesk';

describe('Zendesk', () => {
  let server: http.Server;
  let baseURL: string;
  let lastRequest: {
    method?: string;
    url?: string;
    headers?: http.IncomingHttpHeaders;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any;
  };

  beforeAll((done) => {
    // Create a mock HTTP server
    server = http.createServer((req, res) => {
      lastRequest = { 
        method: req.method, 
        url: req.url, 
        headers: req.headers 
      };
      
      let body = '';
      req.on('data', (chunk) => {
        body += String(chunk);
      });
      
      req.on('end', () => {
        try {
          lastRequest.body = JSON.parse(body) as unknown;
        } catch (e) {
          lastRequest.body = body;
        }
        
        // Send successful response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          request: {
            id: 12345
          }
        }));
      });
    });
    
    // Start the server on a random available port
    server.listen(0, () => {
      const address = server.address() as AddressInfo;
      baseURL = `http://localhost:${address.port}`;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    lastRequest = {};
  });

  it('creates a ticket with errors as an array', async () => {
    const errors = ['Error 1', 'Error 2'];
    const name = 'Test User';
    const email = 'test@example.com';

    const ticketId = await createRequest(errors, name, email, baseURL);

    expect(ticketId).toBe(12345);
    expect(lastRequest.method).toBe('POST');
    expect(lastRequest.url).toBe('/api/v2/requests.json');
    expect(lastRequest.headers?.['content-type']).toBe('application/json');
    expect(lastRequest.headers?.accept).toBe('application/json');
    
    expect(lastRequest.body).toEqual({
      request: {
        comment: {
          body: `Messages:\n===\nError 1\n===\n===\nError 2\n===`
        },
        subject: 'CLI command failure',
        requester: {
          name: 'Test User',
          email: 'test@example.com'
        }
      }
    });
  });

  it('creates a ticket with a single error as string', async () => {
    const error = 'Single Error Message';
    const name = 'Another User';
    const email = 'another@example.com';

    const ticketId = await createRequest(error, name, email, baseURL);

    expect(ticketId).toBe(12345);
    expect(lastRequest.method).toBe('POST');
    expect(lastRequest.body).toEqual({
      request: {
        comment: {
          body: `Messages:\n===\nSingle Error Message\n===`
        },
        subject: 'CLI command failure',
        requester: {
          name: 'Another User',
          email: 'another@example.com'
        }
      }
    });
  });

  it('handles ANSI color codes in error messages', async () => {
    const coloredError = '\u001b[31mRed Error\u001b[0m';
    const name = 'Color User';
    const email = 'color@example.com';

    const ticketId = await createRequest(coloredError, name, email, baseURL);

    expect(ticketId).toBe(12345);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(lastRequest.body.request.comment.body).toContain('Red Error');
    // Verify ANSI codes were stripped
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(lastRequest.body.request.comment.body).not.toContain('\u001b[31m');
  });

  it('handles error responses from the server', async () => {
    // Temporarily replace the server handler to simulate an error
    const originalListener = server.listeners('request')[0] as http.RequestListener;
    server.removeAllListeners('request');
    
    server.on('request', (req, res) => {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad request' }));
    });

    const error = 'Error message';
    const name = 'Error Test';
    const email = 'error@example.com';

    await expect(createRequest(error, name, email, baseURL))
      .rejects.toThrow('Failed to create a Zendesk Request');

    // Restore the original server handler
    server.removeAllListeners('request');
    server.on('request', originalListener);
  });
});