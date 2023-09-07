import { OpenAPIV3 } from 'openapi-types';
import { parseScheme } from './util';

export default class SecuritySchemes {
  authorizationHeaders: string[] = [];

  /**
   * Adds an event to the security schemes, and assigns a security scheme id.
   * If the event has no detectable security scheme, this function returns null.
   */
  addAuthorizationHeader(header: string) {
    this.authorizationHeaders.push(header);
  }

  openapi(): Record<string, OpenAPIV3.SecuritySchemeObject> {
    return this.authorizationHeaders.reduce((memo, authorization) => {
      const scheme = parseScheme(authorization);
      if (!memo[scheme.schemeId]) {
        memo[scheme.schemeId] = scheme.scheme;
      }
      return memo;
    }, {} as Record<string, OpenAPIV3.SecuritySchemeObject>);
  }
}
