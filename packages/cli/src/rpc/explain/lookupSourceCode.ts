import chalk from 'chalk';
import { warn } from 'console';
import { readFile } from 'fs/promises';
import { glob } from 'glob';

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { exists, verbose } from '../../utils';
import { promisify } from 'util';

export const LANGUAGE_BY_FILE_EXTENSION: Record<string, 'js' | 'java' | 'ruby' | 'python'> = {
  '.js': 'js',
  '.ts': 'js',
  '.jsx': 'js',
  '.tsx': 'js',
  '.java': 'java',
  '.py': 'python',
  '.rb': 'ruby',
};

// TODO: Look up different types of files
const scannedExtensions = new Set<string>();
let FILE_NAMES = new Set<string>();

// TODO: Return source code up to the next location in the class map.
// TODO: Reverse-strip comment that follow the function.
export default async function lookupSourceCode(location: string): Promise<string[] | undefined> {
  if (verbose()) warn(chalk.gray(`Looking up source code for ${location}`));
  const [requestedFileName, lineNoStr] = location.split(':');

  const extension = requestedFileName.slice(requestedFileName.lastIndexOf('.'));

  if (!scannedExtensions.has(extension)) {
    scannedExtensions.add(extension);
    const fileNames = await promisify(glob)(`**/*${extension}`);
    if (verbose())
      warn(chalk.gray(`Found ${fileNames.length} files with extension "${extension}"`));
    for (const fileName of fileNames) {
      FILE_NAMES.add(fileName);
    }
  }

  const candidates = Array.from(FILE_NAMES).filter((candidate) =>
    candidate.endsWith(requestedFileName)
  );
  if (candidates.length === 0) {
    warn(chalk.gray(`Could not find file ${requestedFileName}`));
    return;
  }
  candidates.sort((a, b) => a.length - b.length);

  const fileName = candidates[0];
  if (!(await exists(fileName))) {
    warn(chalk.gray(`File ${fileName} does not exist`));
    return;
  }

  const fileContent = await readFile(fileName, 'utf-8');
  if (!lineNoStr) return [fileContent];

  let lineNo = parseInt(lineNoStr, 10);
  if (lineNo <= 0) return [fileContent];

  const fileExtension = fileName.slice(fileName.lastIndexOf('.'));
  const language = LANGUAGE_BY_FILE_EXTENSION[fileExtension];
  let splitter: RecursiveCharacterTextSplitter;
  if (language) {
    splitter = RecursiveCharacterTextSplitter.fromLanguage(language, {
      chunkOverlap: 0,
      chunkSize: 500,
    });
  } else {
    splitter = new RecursiveCharacterTextSplitter({
      chunkOverlap: 0,
      chunkSize: 250,
    });
  }

  const chunks = await splitter.createDocuments([fileContent]);
  const matches = chunks.filter(
    (chunk) => chunk.metadata.loc.lines.from <= lineNo && chunk.metadata.loc.lines.to >= lineNo
  );
  if (verbose()) warn(chalk.gray(`Obtained ${matches.length} source code chunks for ${location}`));
  return matches.map((match) => match.pageContent);
}
