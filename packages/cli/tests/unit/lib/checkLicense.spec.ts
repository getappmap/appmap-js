import { LicenseKey, loadConfiguration } from '@appland/client';
import { Telemetry } from '@appland/telemetry';

import checkLicense from '../../../src/lib/checkLicense';

jest.mock('@appland/client');

const loadConfigurationMock = jest.mocked(loadConfiguration);
const checkMock = jest.mocked(LicenseKey.check);

const ENTITLED = `Entitled to AppMap as customer acme-corp at machine id ${Telemetry.machineId}.`;

describe('checkLicense', () => {
  let warn: jest.SpyInstance<void, unknown[]>;

  beforeEach(() => {
    // Not stubbed: jest's console is silent by default (`silent` in jest.config.js), and letting
    // the messages through means TEST_SILENT=false shows what the command actually prints.
    warn = jest.spyOn(console, 'warn');
    loadConfigurationMock.mockReturnValue({
      baseURL: 'https://getappmap.com',
      apiURL: 'https://api.getappmap.com',
    });
  });

  // Spies are restored by the suite's `restoreMocks` setting; this resets the automocked module.
  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.APPMAP_CUSTOMER_ID;
  });

  const messages = () => warn.mock.calls.map(([message]) => String(message));

  describe('with no API key', () => {
    it('warns that no license key was provided', async () => {
      await checkLicense();

      expect(messages()).toEqual([
        'Warning: No license key provided. Please set the APPMAP_API_KEY environment variable.',
      ]);
    });

    it('throws, and does not also warn, when a license is required', async () => {
      await expect(checkLicense(true)).rejects.toThrow('No license key provided');
      expect(messages()).toEqual([]);
    });

    describe('and a customer ID', () => {
      beforeEach(() => (process.env.APPMAP_CUSTOMER_ID = 'acme-corp'));

      it('reports entitlement instead of warning', async () => {
        await checkLicense();

        expect(messages()).toEqual([ENTITLED]);
      });

      it('satisfies a required license', async () => {
        await expect(checkLicense(true)).resolves.toBeUndefined();
      });

      it('treats a blank customer ID as unset', async () => {
        process.env.APPMAP_CUSTOMER_ID = '  ';

        await checkLicense();

        expect(messages()).toEqual([
          'Warning: No license key provided. Please set the APPMAP_API_KEY environment variable.',
        ]);
      });
    });
  });

  describe('with an API key', () => {
    beforeEach(() => {
      loadConfigurationMock.mockReturnValue({
        baseURL: 'https://getappmap.com',
        apiURL: 'https://api.getappmap.com',
        apiKey: 'the-api-key',
        username: 'alice',
      });
      checkMock.mockResolvedValue(true);
    });

    it('checks the key', async () => {
      await checkLicense();

      expect(checkMock).toHaveBeenCalledWith('the-api-key');
      expect(messages()).toEqual([expect.stringContaining('Valid license for alice')]);
    });

    it('still checks the key, and reports entitlement too, when a customer ID is also set', async () => {
      process.env.APPMAP_CUSTOMER_ID = 'acme-corp';

      await checkLicense();

      expect(checkMock).toHaveBeenCalledWith('the-api-key');
      expect(messages()).toEqual([ENTITLED, expect.stringContaining('Valid license for alice')]);
    });

    describe('that is rejected', () => {
      beforeEach(() => checkMock.mockResolvedValue(false));

      it('warns when a license is not required', async () => {
        await checkLicense();
        expect(messages()).toEqual(['Warning: The provided license key is not valid.']);
      });

      it('throws, and does not also warn, when a license is required', async () => {
        await expect(checkLicense(true)).rejects.toThrow('The provided license key is not valid');
        expect(messages()).toEqual([]);
      });

      it('is not fatal when a customer ID is set', async () => {
        process.env.APPMAP_CUSTOMER_ID = 'acme-corp';

        await expect(checkLicense(true)).resolves.toBeUndefined();

        expect(checkMock).toHaveBeenCalledWith('the-api-key');
        expect(messages()).toEqual([ENTITLED, 'Warning: The provided license key is not valid.']);
      });
    });

    describe('that cannot be checked', () => {
      const failure = new Error('ECONNREFUSED');

      beforeEach(() => checkMock.mockRejectedValue(failure));

      it('warns when a license is not required', async () => {
        await checkLicense();
        expect(messages()).toEqual(['Warning: Failed to check license key: ECONNREFUSED']);
      });

      it('rethrows the original error when a license is required', async () => {
        await expect(checkLicense(true)).rejects.toBe(failure);
        expect(messages()).toEqual([]);
      });

      it('is not fatal when a customer ID is set', async () => {
        process.env.APPMAP_CUSTOMER_ID = 'acme-corp';

        await expect(checkLicense(true)).resolves.toBeUndefined();

        expect(messages()).toEqual([
          ENTITLED,
          'Warning: Failed to check license key: ECONNREFUSED',
        ]);
      });
    });
  });
});
