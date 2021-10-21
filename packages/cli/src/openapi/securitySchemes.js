function parseScheme(authorization) {
  const tokens = authorization.split(/\s/);
  if (tokens.length === 1) {
    return {
      schemeId: 'api_key',
      scheme: {
        type: 'apiKey',
        name: 'authorization',
        in: 'header',
      },
    };
  }

  const schemeId = tokens[0].toLowerCase();
  return {
    schemeId,
    scheme: {
      type: 'http',
      scheme: schemeId,
    },
  };
}

class SecuritySchemes {
  constructor() {
    this.schemes = {};
  }

  /**
   * Adds an event to the security schemes, and assigns a security scheme id.
   * If the event has no detectable security scheme, this function returns null.
   *
   * @param {Event} event
   * @returns the security scheme id for the event, or null.
   */
  addRequest(event) {
    const { authorization } = event.httpServerRequest;
    if (!authorization) {
      return null;
    }

    const { schemeId, scheme } = parseScheme(authorization);
    if (!this.schemes[schemeId]) {
      this.schemes[schemeId] = scheme;
    }
    return schemeId;
  }

  openapi() {
    return Object.keys(this.schemes)
      .sort()
      .reduce((memo, schemeId) => {
        // eslint-disable-next-line no-param-reassign
        memo[schemeId] = this.schemes[schemeId];
        return memo;
      }, {});
  }
}

module.exports = SecuritySchemes;
