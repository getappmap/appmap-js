import { join } from 'path';
import { existsSync, promises as fsp } from 'fs';
import { queue } from 'async';
import { glob } from 'glob';
import { OpenAPIV3 } from 'openapi-types';
import {
  Model,
  parseHTTPServerRequests,
  rpcRequestForEvent,
  SecuritySchemes,
} from '@appland/openapi';
import { Event } from '@appland/models';
import { inspect } from 'util';
import { FilterFunction } from '../cmds/openapi';

export class OpenAPICommand {
  private readonly model = new Model();
  private readonly securitySchemes = new SecuritySchemes();

  public errors: string[] = [];
  public filter: FilterFunction = async (file: string) => ({ enable: true });

  constructor(private readonly appmapDir: string) {}

  async execute(): Promise<
    [
      {
        paths: OpenAPIV3.PathsObject;
        securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject>;
      },
      number
    ]
  > {
    const q = queue(this.collectAppMap.bind(this), 5);
    q.pause();

    // Make sure the directory exists -- if it doesn't, the glob below just returns nothing.
    if (!existsSync(this.appmapDir)) {
      throw new Error(`AppMap directory ${this.appmapDir} does not exist`);
    }

    const files = glob.sync(join(this.appmapDir, '**', '*.appmap.json'));
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const filterResult = await this.filter(file);
      if (!filterResult.enable) {
        if (filterResult.message) console.warn(filterResult.message);
        continue;
      }

      q.push(file);
    }

    if (q.length() > 0) {
      await new Promise<void>((resolve, reject) => {
        q.drain(resolve);
        q.error(reject);
        q.resume();
      });
    }

    return [
      {
        paths: this.model.openapi(),
        securitySchemes: this.securitySchemes.openapi(),
      },
      files.length,
    ];
  }

  async collectAppMap(file: string): Promise<void> {
    try {
      const data = await fsp.readFile(file, 'utf-8');
      parseHTTPServerRequests(JSON.parse(data), (e: Event) => {
        const request = rpcRequestForEvent(e);
        if (request) {
          this.model.addRpcRequest(request);
          this.securitySchemes.addRpcRequest(request);
        }
      });
    } catch (e) {
      // Re-throwing this error crashes the whole process.
      // So if there is a malformed AppMap, indicate it here but don't blow everything up.
      // Do not write to stdout!
      let errorString: string;
      try {
        errorString = inspect(e);
      } catch (x) {
        errorString = ((e as any) || '').toString();
      }
      this.errors.push(errorString);
    }
  }
}
