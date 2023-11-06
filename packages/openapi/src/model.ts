import { OpenAPIV3 } from 'openapi-types';
import Path from './path';
import { RPCRequest, routeId } from './rpcRequest';
import Warnings from './Warnings';

export default class Model {
  paths: Record<string, Path> = {};
  warnings = new Warnings();

  collectWarnings(): Record<string, string[]> {
    const warnings = this.warnings.dup();
    warnings.merge(Object.values(this.paths));
    return warnings.warnings;
  }

  openapi(): OpenAPIV3.PathsObject {
    const paths = Object.keys(this.paths)
      .sort()
      .reduce((memo, path) => {
        // eslint-disable-next-line no-param-reassign
        const pathItem = this.paths[path].openapi();
        if (Object.keys(pathItem).length) {
          memo[path] = this.paths[path].openapi();
        }
        return memo;
      }, {} as Record<string, OpenAPIV3.PathItemObject>);
    return paths;
  }

  addRpcRequest(rpcRequest: RPCRequest): void {
    const path = Model.basePath(rpcRequest.requestPath);
    if (!path.startsWith('/')) {
      this.warnings.add(routeId(rpcRequest), `Path must start with '/'`);
      return;
    }

    if (!this.paths[path]) {
      this.paths[path] = new Path();
    }
    const pathObj = this.paths[path];
    pathObj.addRpcRequest(rpcRequest);
  }

  static basePath(path: string): string {
    const pathTokens = path.split('/').map((entry) => {
      if (entry.match(/^:(.*)/)) {
        // eslint-disable-next-line no-param-reassign
        entry = `{${entry.substring(1)}}`;
      }
      return entry;
    });
    if (pathTokens.length === 1 && path[0] === '') {
      pathTokens.push('');
    }

    return pathTokens.join('/');
  }
}
