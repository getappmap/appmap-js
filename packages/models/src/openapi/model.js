import Path from './path';
import SecuritySchemes from './securitySchemes';
import { bestPathInfo } from './util';

export default class Model {
  constructor() {
    this.paths = {};
    this.securitySchemes = new SecuritySchemes();
  }

  openapi() {
    const paths = Object.keys(this.paths)
      .sort()
      .reduce((memo, path) => {
        // eslint-disable-next-line no-param-reassign
        memo[path] = this.paths[path].openapi();
        return memo;
      }, {});
    const securitySchemes = this.securitySchemes.openapi();
    return { paths, components: { securitySchemes } };
  }

  addRequest(event) {
    this.addPath(Model.basePath(event), event);
  }

  addPath(path, event) {
    if (!this.paths[path]) {
      this.paths[path] = new Path(this.securitySchemes);
    }
    const pathObj = this.paths[path];
    pathObj.addRequest(event);
  }

  static basePath(event) {
    const { httpServerRequest } = event;
    let pathInfo = bestPathInfo(httpServerRequest);
    // eslint-disable-next-line prefer-destructuring
    pathInfo = pathInfo.split('(')[0];
    const path = pathInfo.split('/').map((entry) => {
      if (entry.match(/^:(.*)/)) {
        // eslint-disable-next-line no-param-reassign
        entry = `{${entry.substring(1)}}`;
      }
      return entry;
    });
    if (path.length === 1 && path[0] === '') {
      path.push('');
    }
    return path.join('/');
  }
}
