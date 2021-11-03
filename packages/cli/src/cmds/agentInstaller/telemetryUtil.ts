import { promises as fs } from 'fs';

export async function getDirectoryProperty(path: string): Promise<string> {
  try {
    return (await fs.readdir(path)).join('\n');
  } catch (e) {
    if (e instanceof Error) {
      return e.stack || e.message;
    } else {
      return String(e);
    }
  }
}
