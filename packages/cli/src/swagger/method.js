const { EventNavigator } = require('@appland/models');
const Response = require('./response');
const Schema = require('./schema');
const { messageToSwaggerSchema, bestPathInfo } = require('./util');

const bodyParamMethods = new Set(['delete', 'put', 'post', 'patch']);

function swaggerIn(event, name) {
  const pathInfo = bestPathInfo(event.httpServerRequest);
  // Trim format info from Rails paths, e.g. /foo/bar(.:format)
  const tokens = pathInfo.split('/').map((token) => token.split('(')[0]);
  // Recognize Rails-style normalized paths /org/:org_id and Swagger-style paths /org/{org_id}
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

  swagger() {
    const responses = Object.keys(this.responses)
      .sort()
      .reduce((memo, response) => {
        // eslint-disable-next-line no-param-reassign
        memo[response] = this.responses[response].swagger();
        return memo;
      }, {});

    let description;
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
      if (event.httpServerRequest.mime_type) {
        const mimeType = event.httpServerRequest.mime_type.split(';')[0];
        if (!schemata[mimeType]) {
          schemata[mimeType] = new Schema();
        }
        schema = schemata[mimeType];
      }

      const actionName = messages
        .filter((msg) => msg.name === 'action')
        .map((msg) => msg.value)[0];
      if (actionName) {
        const bestCommentOrCodeObjectName = (() => {
          const descendants = new EventNavigator(event).descendants();
          let iter = descendants.next();
          let controller = null;
          while (!iter.done) {
            const evt = iter.value;
            if (
              evt.event.codeObject.packageOf.indexOf('app/controllers') === 0 &&
              evt.event.codeObject.name === actionName
            ) {
              controller = evt.event;
              break;
            }
            iter = descendants.next();
          }
          if (!controller) {
            return null;
          }
          const { comment } = controller.codeObject.data;
          if (comment) {
            const lines = comment
              .split('\n')
              .map((line) => line.replace(/^\s*#\s*/, '').trim())
              .filter((line) => line && line.length > 0);
            return lines.join('\n');
          }
          return controller.codeObject.name;
        })();
        if (!description) {
          description = bestCommentOrCodeObjectName;
        }
      }

      messages.forEach((message) => {
        if (uniqueNames.has(message.name)) {
          return;
        }
        uniqueNames.add(message.name);
        const inLocation = swaggerIn(event, message.name);
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
            schema: messageToSwaggerSchema(message),
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
    if (description) {
      response.description = description;
    }
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
