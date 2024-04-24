import { log } from 'console';
import { executeCommand } from '../lib/executeCommand';
import { verbose } from '../utils';
import { Chunk } from './SourceIndex';

const isImport = (line: string) =>
  line.startsWith('import ') ||
  line.startsWith('from ') ||
  line.startsWith('require(') ||
  line.startsWith('const ') ||
  line.startsWith('let ') ||
  line.startsWith('var ');

const matchToChunk = (directory: string, text: string): Chunk | undefined => {
  let fileName: string | undefined, from: number | undefined, to: number | undefined;
  const content: string[] = [];
  for (const line of text.trim().split(/\r?\n/)) {
    const match = /(.+?)(?<sep>[-:=])(\d+)\k<sep>(.*)/.exec(line);
    if (!match) continue;

    const [, name, , lineno, txt] = match;
    fileName ||= name;
    from ||= Number(lineno);
    to = Number(lineno);
    content.push(txt);
  }
  if (fileName && from && to && !content.every(isImport))
    return {
      directory,
      fileName,
      from,
      to,
      content: content.join('\n'),
    };
};

export default async function gitGrep(directory: string, keyword: string): Promise<Chunk[]> {
  const grepCommand = `git --no-pager grep -WiFn --no-color ${keyword}`;
  const rawChunks = (
    await executeCommand(grepCommand, verbose(), verbose(), verbose(), [0], directory)
  )
    .split(/^--$/m)
    .map((match) => match.trim());
  log(`Found ${rawChunks.length} matches via git-grep in ${directory} using keyword ${keyword}.`);
  return rawChunks.map((text) => matchToChunk(directory, text)).filter(Boolean) as Chunk[];
}
