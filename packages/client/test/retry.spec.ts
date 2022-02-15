import { fail } from 'assert';
import { IncomingMessage } from 'http';
import { retryOn503, retryOnError } from '../src';
import { RejectFunction, ResolveFunction } from '../src/retryHandler';

const Message = { ok: true };
const Handler = (resolve: ResolveFunction) => {
  resolve(Message as any as IncomingMessage);
};

describe('retryOnError', () => {
  ['EPIPE', 'ECONNRESET'].forEach((errorCode) => {
    it(`handles ${errorCode}`, async () => {
      return new Promise<IncomingMessage>((resolve, reject) => {
        retryOnError(Handler, resolve, reject).call(null, {
          code: errorCode,
        } as unknown as Error);
      })
        .then((msg) => {
          expect(JSON.stringify(msg)).toEqual('{"ok":true}');
        })
        .catch(fail);
    });
  });

  it('ignores unknown error', async () => {
    return new Promise<IncomingMessage>((resolve, reject) => {
      retryOnError(Handler, resolve, reject).call(null, {
        code: 'unknown',
      } as unknown as Error);
    })
      .then(() => fail())
      .catch((err) => expect(err).toEqual({ code: 'unknown' }));
  });
});

describe('retryOn503', () => {
  it('handles 503', async () => {
    return new Promise<IncomingMessage>((resolve, reject) => {
      resolve({
        statusCode: 503,
      } as unknown as IncomingMessage);
    })
      .then(retryOn503(Handler))
      .then((msg) => {
        expect(JSON.stringify(msg)).toEqual('{"ok":true}');
      })
      .catch(fail);
  });

  it('ignores other status codes', async () => {
    return new Promise<IncomingMessage>((resolve, reject) => {
      resolve({
        statusCode: 500,
      } as unknown as IncomingMessage);
    })
      .then(retryOn503(Handler))
      .then((msg) => expect(msg).toEqual({ statusCode: 500 }));
  });

  it('ignores missing status code', async () => {
    return new Promise<IncomingMessage>((resolve, reject) => {
      resolve({
        message: 'err',
      } as unknown as IncomingMessage);
    })
      .then(retryOn503(Handler))
      .then((msg) => expect(msg).toEqual({ message: 'err' }));
  });
});
