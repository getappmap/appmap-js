import { URL } from 'url';

export default function reportUploadURL(numFindings: number, url?: URL): void {
  let message = `Uploaded ${numFindings} findings`;
  if (url) {
    message += ` to ${url}`;
  }
  console.log(message);
}
