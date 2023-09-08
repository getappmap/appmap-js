import { join } from 'path';
import openapi from '../openapi/openapi';

export default async function generateOpenAPI(appMapDir: string, maxAppMapSizeInBytes: number) {
  const startTime = new Date().getTime();
  console.log('Generating OpenAPI...');

  const openapiOptions = {
    appmapDir: appMapDir,
    maxSize: maxAppMapSizeInBytes,
    outputFile: join(appMapDir, 'openapi.yml'),
  };
  await openapi.handler(openapiOptions);

  const elapsed = new Date().getTime() - startTime;
  console.log(`Generated OpenAPI in ${elapsed}ms`);
}
