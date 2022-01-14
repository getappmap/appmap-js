import { Event } from '@appland/models';
import { forClientRequest, forURL, breakingChanges } from '../openapi';
import { MatchResult, Rule, RuleLogic } from '../types';
import * as types from './types';
import OpenApiDiff from 'openapi-diff';
import { OpenAPIV3 } from 'openapi-types';

class Options implements types.IncompatibleHttpClientRequest.Options {
  public schemata: Record<string, string> = {};
}

const changeMessage = (change: OpenApiDiff.DiffResult<'breaking'>): string => {
  return `HTTP client request is incompatible with OpenAPI schema. Change details: ${
    change.action
  } ${change.sourceSpecEntityDetails
    .concat(change.destinationSpecEntityDetails)
    .map((detail) => detail.location)
    .join(', ')}`;
};

function build(options: Options): RuleLogic {
  async function matcher(event: Event): Promise<MatchResult[]> {
    const clientFragment = forClientRequest(event);
    const serverSchema = await forURL(event.httpClientRequest!.url!, options.schemata);
    const clientSchema = {
      openapi: '3.0.0',
      info: {
        title: 'Schema derived from client request',
        version: serverSchema.info.version, // Indicate that it *should* be compatible.
      },
      paths: clientFragment!.paths,
      components: { securitySchemes: clientFragment!.securitySchemes },
    } as OpenAPIV3.Document;
    const changes = await breakingChanges(clientSchema, serverSchema);
    return changes.map((change: OpenApiDiff.DiffResult<'breaking'>) => ({
      level: 'error',
      message: changeMessage(change),
    }));
  }

  return {
    matcher,
    where: (e: Event) => !!e.httpClientRequest && !!e.httpClientRequest!.url,
  };
}

export default {
  id: 'incompatible-http-client-request',
  title: 'Incompatible HTTP client request',
  scope: 'http_client_request',
  enumerateScope: false,
  impactDomain: 'Stability',
  Options,
  build,
} as Rule;
