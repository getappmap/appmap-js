import { join } from 'path';
import openapi from '../openapi';

export default async function generateOpenAPI(appMapDir: string, maxAppMapSizeInBytes: number) {
  const openapiOptions = {
    appmapDir: appMapDir,
    maxSize: maxAppMapSizeInBytes,
    outputFile: join(appMapDir, 'openapi.yml'),
  };
  await openapi.handler(openapiOptions);
}
