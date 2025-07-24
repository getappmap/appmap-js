import Conf from 'conf';
import { Session } from '../src/session';

const invalidExpiration = () => Date.now() - 1000 * 60 * 60;

describe('Session', () => {
  let conf: jest.Mocked<Conf>;
  let session: Session;

  beforeEach(() => {
    conf = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<Conf>;
    session = new Session(conf);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('renew', () => {
    it('writes persistent session data', () => {
      session.renew();
      expect(conf.set).toHaveBeenCalledWith('sessionId', session.id);
      expect(conf.set).toHaveBeenCalledWith('sessionExpiration', session.expiration);
    });
  });

  describe('load', () => {
    let sessionId = 'existingSessionId';
    let sessionExpiration = Session.expirationFromNow();

    beforeEach(() => {
      conf.get.mockImplementation((key: string) => {
        if (key === 'sessionId') return sessionId;
        if (key === 'sessionExpiration') return sessionExpiration;
        return undefined;
      });
      session = new Session(conf);
    });

    it('loads existing session data', () => {
      expect(session.id).toBe(sessionId);
      expect(session.expiration).toBe(sessionExpiration);
    });
  });

  describe('touch', () => {
    it('updates the expiration time', async () => {
      const initialExpiration = session.expiration;

      await new Promise((r) => setTimeout(r, 16)); // Ensure some time has passed
      session.touch();

      expect(session.expiration).toBeGreaterThan(initialExpiration);
      expect(conf.set).toHaveBeenCalledWith('sessionExpiration', session.expiration);
    });
  });

  describe('valid', () => {
    describe('with no session data', () => {
      beforeEach(() => {
        conf.get.mockReturnValue(undefined);
      });

      it('returns false', () => {
        expect(session.valid).toBe(false);
      });
    });

    describe('with old session data from disk', () => {
      beforeEach(() => {
        conf.get.mockImplementation((key: string) => {
          if (key === 'sessionId') return 'oldSessionId';
          if (key === 'sessionExpiration') return invalidExpiration();
          return undefined;
        });
        session = new Session(conf);
      });

      it('returns false', () => {
        expect(session.valid).toBe(false);
      });
    });

    describe('with valid session data', () => {
      it('returns true', () => {
        session.renew();
        expect(session.valid).toBe(true);
      });
    });
  });

  describe('with old session data', () => {
    const oldSessionId = 'oldSessionId';
    const oldSessionExpiration = invalidExpiration();

    beforeEach(() => {
      conf.get.mockImplementation((key: string) => {
        if (key === 'sessionId') return oldSessionId;
        if (key === 'sessionExpiration') return oldSessionExpiration;
        return undefined;
      });
      session = new Session(conf);
    });

    it('returns a new session ID and expiration', () => {
      expect(session.id).not.toStrictEqual(oldSessionId);
      expect(session.expiration).not.toStrictEqual(oldSessionExpiration);
      expect(session.valid).toBe(true);
      expect(session.id).toBeDefined();
      expect(session.expiration).toBeDefined();
    });
  });

  describe('with valid session data', () => {
    let sessionId: string;
    let sessionExpiration: number;

    beforeEach(() => {
      session.renew();
      sessionId = session.id;
      sessionExpiration = session.expiration;
    });

    it('returns the expected session ID and expiration', () => {
      expect(session.id).toStrictEqual(sessionId);
      expect(session.expiration).toStrictEqual(sessionExpiration);
    });
  });
});
