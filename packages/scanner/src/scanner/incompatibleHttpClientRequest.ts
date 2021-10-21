import { Event } from '@appland/models';
import openapi from '../openapi';
import { AssertionSpec } from 'src/types';
import Assertion from '../assertion';

class Options {
  constructor(public workingDir: string) {}
}

function scanner(options: Options = new Options('.')): Assertion {
  const isCompatible = async (event: Event): Promise<boolean> => {
    const clientSchema = openapi.forClientRequest(event);
    const serverSchema = openapi.forURL(event.httpClientRequest!.url!, options.workingDir);
    return openapi.isCompatible(clientSchema, serverSchema);
  };

  return Assertion.assert(
    'incompatible-http-client-request',
    'Incompatible HTTP client request',
    (event: Event) => !isCompatible(event),
    (assertion: Assertion): void => {
      assertion.options = options;
      assertion.where = (e: Event) => !!e.httpClientRequest!.url;
      assertion.description = `HTTP client request is incompatible with the API definition`;
    }
  );
}

export default {
  scope: 'http_client_request',
  enumerateScope: false,
  Options,
  scanner,
} as AssertionSpec;
