import { pack } from 'tar-stream';
import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import FormData from 'form-data';
import { createGzip } from 'zlib';
import { buildAppMap } from '@appland/models';
import { buildRequest, handleError } from '@appland/client/dist/src';
import { ScanResults } from '../../report/scanResults';
import { IncomingMessage } from 'http';
import { URL } from 'url';

export default async function (scanResults: ScanResults, appId: string): Promise<void> {
  const normalizedFilePaths: { [key: string]: string } = {};
  const { findings } = scanResults;
  for (const finding of findings) {
    if (!finding.appMapFile) {
      continue;
    }

    const hash = createHash('sha256').update(finding.appMapFile).digest('hex');
    normalizedFilePaths[finding.appMapFile] = `${hash}.appmap.json`;
  }

  const clonedFindings = findings.map((finding) => {
    const clone = { ...finding };
    if (clone.appMapFile) {
      clone.appMapFile = normalizedFilePaths[clone.appMapFile];
    }
    return clone;
  });

  const relevantFilePaths = [
    ...new Set(findings.filter((f) => f.appMapFile).map((f) => f.appMapFile)),
  ] as string[];
  const tarStream = pack();

  for (const filePath of relevantFilePaths) {
    const buffer = await fs.readFile(filePath);

    tarStream.entry(
      { name: normalizedFilePaths[filePath] },
      JSON.stringify(buildAppMap(buffer.toString()).normalize().build().toJSON())
    );
  }

  tarStream.entry({ name: 'app.scanner.json' }, JSON.stringify({ findings: clonedFindings }));
  tarStream.finalize();

  const gzip = createGzip();
  tarStream.pipe(gzip);

  const form = new FormData();
  form.append('findings_data', gzip, 'findings.tgz');
  form.append('app_id', appId);

  process.stderr.write(`Uploading findings to application '${appId}'\n`);
  const request = await buildRequest('api/scanner_jobs');
  return new Promise<IncomingMessage>((resolve, reject) => {
    const req = request.requestFunction(
      request.url,
      {
        method: 'POST',
        headers: {
          ...request.headers,
          ...form.getHeaders(),
        },
      },
      resolve
    );
    req.on('error', reject);
    form.pipe(req);
  })
    .then(handleError)
    .then((response: IncomingMessage) => {
      let message = `Uploaded ${scanResults.findings.length} findings`;
      if (response.headers.location) {
        const uploadURL = new URL(response.headers.location, request.url.href);
        message += ` to ${uploadURL}`;
      }
      console.log(message);
    });
}
