const Method = require('./method');

class Path {
  constructor(securitySchemes) {
    this.securitySchemes = securitySchemes;
    this.methods = {};
  }

  openapi() {
    return Object.keys(this.methods)
      .sort()
      .reduce((memo, method) => {
        // eslint-disable-next-line no-param-reassign
        memo[method] = this.methods[method].openapi();
        return memo;
      }, {});
  }

  addRequest(event) {
    const method = event.httpServerRequest.request_method;
    if (!method) {
      return;
    }
    this.addMethod(method, event);
  }

  addMethod(method, event) {
    // eslint-disable-next-line no-param-reassign
    method = method.toLowerCase();
    if (!this.methods[method]) {
      this.methods[method] = new Method(this.securitySchemes);
    }
    const methodObj = this.methods[method];
    methodObj.addRequest(event);
  }
}

module.exports = Path;
