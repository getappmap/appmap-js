const Response = require('./response');
const Schema = require('./schema');
const { messageToOpenAPISchema, bestPathInfo } = require('./util');

const bodyParamMethods = new Set(['delete', 'put', 'post', 'patch']);

function openapiIn(event, name) {
  const pathInfo = bestPathInfo(event.httpServerRequest);
  // Trim format info from Rails paths, e.g. /foo/bar(.:format)
  const tokens = pathInfo.split('/').map((token) => token.split('(')[0]);
  // Recognize Rails-style normalized paths /org/:org_id and OpenAPI-style paths /org/{org_id}
  if (tokens.includes(`:${name}`) || tokens.includes(`{${name}}`)) {
    return 'path';
  }
  return 'query';
}

class Method {
  constructor(securitySchemes) {
    this.securitySchemes = securitySchemes;
    this.responses = {};
    this.events = [];
  }

  openapi() {
    const responses = Object.keys(this.responses)
      .sort()
      .reduce((memo, response) => {
        // eslint-disable-next-line no-param-reassign
        memo[response] = this.responses[response].openapi();
        return memo;
      }, {});

    const schemata = {};
    const parameters = [];
    let securitySchemeId;

    const uniqueNames = new Set(['controller', 'action', '_method']);
    this.events.forEach((event) => {
      const messages = event.message || [];
      if (!securitySchemeId) {
        securitySchemeId = this.securitySchemes.addRequest(event);
      }

      let schema = null;
      if (event.requestContentType) {
        const contentType = event.requestContentType.split(';')[0];
        if (!schemata[contentType]) {
          schemata[contentType] = new Schema();
        }
        schema = schemata[contentType];
      }

      messages.forEach((message) => {
        if (uniqueNames.has(message.name)) {
          return;
        }
        uniqueNames.add(message.name);
        const inLocation = openapiIn(event, message.name);
        if (
          inLocation !== 'path' &&
          event.httpServerRequest.request_method &&
          bodyParamMethods.has(
            event.httpServerRequest.request_method.toLowerCase()
          )
        ) {
          if (schema) {
            schema.addExample(message);
          }
        } else {
          const parameter = {
            name: message.name,
            in: inLocation,
            schema: messageToOpenAPISchema(message),
          };
          if (parameter.in === 'path') {
            parameter.required = true;
          }
          parameters.push(parameter);
        }
      });
    });

    const response = {
      responses,
    };
    if (securitySchemeId) {
      const securityObj = {};
      securityObj[securitySchemeId] = [];
      response.security = [securityObj];
    }
    if (Object.keys(schemata).length > 0) {
      response.requestBody = { content: {} };
      Object.keys(schemata)
        .sort()
        .forEach((contentType) => {
          const schema = schemata[contentType].schema();
          if (!schema) {
            return;
          }
          response.requestBody.content[contentType] = { schema };
        });
    }
    if (parameters.length > 0) {
      response.parameters = parameters.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }
    return response;
  }

  addRequest(event) {
    if (!event.httpServerResponse) {
      return;
    }
    // eslint-disable-next-line camelcase
    const { status, status_code: statusCode } = event.httpServerResponse;
    this.addResponse(status || statusCode, event);
  }

  addResponse(status, event) {
    if (!this.responses[status]) {
      this.responses[status] = new Response(status);
    }
    this.events.push(event);
    const responseObj = this.responses[status];
    responseObj.addRequest(event);
  }
}

module.exports = Method;
