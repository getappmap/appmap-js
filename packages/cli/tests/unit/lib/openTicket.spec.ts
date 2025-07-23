import 'jest-sinon';
import sinon from 'sinon';
import { HttpError, HttpErrorResponse } from '../../../src/cmds/errors';

import UI from '../../../src/cmds/userInteraction';
import openTicket from '../../../src/lib/ticket/openTicket';
import * as createRequest from '../../../src/lib/ticket/zendesk';

import { Telemetry } from '@appland/telemetry';
import { withSandbox, withStubbedTelemetry } from '../../helper';

import { isValidEmail, isValidName } from '../../../src/lib/ticket/validation';

// I'm sure there's a proper way to write a matcher that will check that a sinon stub was called
// with a matching object, a la https://jestjs.io/docs/expect#tomatchobjectobject . This will do for
// now.
const getNthCallArgs = (stub, nth) => (stub as sinon.SinonStub).getCall(nth).args[0];

class TestErrorResponse implements HttpErrorResponse {
  headers: Record<string, string> = {};
  body = '';
  toString(): string {
    return `${JSON.stringify(this)}`;
  }
  constructor(readonly status: number) {}
}

describe('openTicket', () => {
  beforeAll(() => {
    // ZENDESK_AUTHZ is only for testing, make sure we run properly without it.
    delete process.env.ZENDESK_AUTHZ;
  });

  const sandbox = withSandbox();
  withStubbedTelemetry(sandbox);

  let zdRequest: sinon.SinonStub,
    prompt: sinon.SinonStub,
    confirm: sinon.SinonStub,
    uiError: sinon.SinonStub;

  beforeEach(() => {
    zdRequest = sandbox.stub(createRequest, 'default');
    confirm = sandbox.stub(UI, 'confirm');
    prompt = sandbox.stub(UI, 'prompt');
    uiError = sandbox.stub(UI, 'error');
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('prompting', () => {
    beforeEach(() => {
      zdRequest.resolves();
    });

    it('proceeds when the user allows', async () => {
      confirm.resolves(false);
      prompt.resolves({ openTicket: true });
      await openTicket('error');
      expect(prompt).toBeCalledTwice();
      expect(getNthCallArgs(prompt, 0)).toMatchObject({ name: 'openTicket' });
      expect(getNthCallArgs(prompt, 1)).toMatchObject([{ name: 'name' }, { name: 'email' }]);
    });

    it("doesn't prompt when the user declines", async () => {
      prompt.resolves({ openTicket: false });
      await openTicket('error');
      expect(prompt).toBeCalledOnce();
    });

    describe('input validation', () => {
      describe('of name', () => {
        it('accepts non-empty', () => {
          expect(isValidName('Joe Smith')).toBeTruthy();
        });
        it('rejects an empty', () => {
          expect(isValidName('')).toBeFalsy();
        });
        it('rejects a whitespace', () => {
          expect(isValidName('  ')).toBeFalsy();
        });

        it('rejects too short', () => {
          expect(isValidName('n')).toBeFalsy();
        });
      });
      describe('of email', () => {
        it('accepts non-empty', () => {
          expect(isValidEmail('user@example.com')).toBeTruthy();
        });
        it('rejects empty', () => {
          expect(isValidEmail('')).toBeFalsy();
        });
        it('rejects whitespace', () => {
          expect(isValidEmail('  ')).toBeFalsy();
        });
        it('rejects ill-formed', () => {
          expect(isValidEmail('n')).toBeFalsy();
        });
        // Let's assume validator does a decent job of testing the rest of the possibilities....
      });
    });

    describe('using Zendesk', () => {
      beforeEach(() => {
        prompt.resolves({ openTicket: true });
      });

      it('creates a request', async () => {
        const expected = ['error'];
        zdRequest.resolves();
        await openTicket(expected);
        expect(zdRequest).toBeCalledOnce();
        expect(getNthCallArgs(zdRequest, 0)).toMatchObject(expected);
      });

      it('handles an error', async () => {
        zdRequest.throws('an error');
        await openTicket('error');
        expect(uiError).toBeCalledOnce();
        expect(getNthCallArgs(uiError, 0)).toMatch(
          'A failure occurred attempting to create a ticket'
        );
      });
    });

    describe('telemetry event', () => {
      [
        {
          example: 'is not sent when the user opens a ticket',
          condition: { openTicket: true },
        },
        {
          example: 'is not sent the user declines to open a ticket',
          condition: { openTicket: false },
        },
      ].forEach((e) => {
        const { example, condition } = e;

        it(example, async () => {
          prompt.resolves(condition);
          await openTicket('error');
          expect(Telemetry.sendEvent).toBeCalledTimes(0);
        });
      });

      describe('when Zendesk request fails', () => {
        beforeEach(() => {
          prompt.resolves({ openTicket: true });
        });

        [
          {
            example: 'gets sent showing an error when possible',
            error: new HttpError('error', new TestErrorResponse(422)),
            expectation: {
              name: 'open-ticket:error',
            },
          },
          {
            example: 'gets sent indicating when rate-limited',
            error: new HttpError('error', new TestErrorResponse(429)),
            expectation: {
              name: 'open-ticket:rate-limit',
            },
          },
          {
            example: "gets sent even when there's no response",
            error: new HttpError('error'),
            expectation: {
              name: 'open-ticket:no-response',
            },
          },
        ].forEach((e) => {
          const { example, error, expectation } = e;
          it(example, async () => {
            zdRequest.throws(error);

            await openTicket('error');
            expect(Telemetry.sendEvent).toBeCalledOnce();
            expect(getNthCallArgs(Telemetry.sendEvent, 0)).toMatchObject(expectation);
          });
        });
      });
    });
  });
});
