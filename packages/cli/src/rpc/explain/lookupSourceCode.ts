import chalk from 'chalk';
import { warn } from 'console';
import { readFile } from 'fs/promises';
import { glob } from 'glob';

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { exists, verbose } from '../../utils';
import { promisify } from 'util';
import parseLocation from './parseLocation';

export const LANGUAGE_BY_FILE_EXTENSION: Record<string, 'js' | 'java' | 'ruby' | 'python' | 'php'> =
  {
    '.js': 'js',
    '.ts': 'js',
    '.jsx': 'js',
    '.tsx': 'js',
    '.java': 'java',
    '.py': 'python',
    '.rb': 'ruby',
    '.php': 'php',
  };

// TODO: Look up different types of files
const scannedExtensions = new Set<string>();
const FILE_NAMES = new Set<string>();

// TODO: Return source code up to the next location in the class map.
// TODO: Reverse-strip comment that follow the function.
export default async function lookupSourceCode(
  directory: string,
  location: string
): Promise<{ content: string; location: string } | undefined> {
  const parsedLocation = parseLocation(location);
  if (!parsedLocation) return;

  const [requestedFileName, lineNo] = parsedLocation;

  if (verbose()) warn(chalk.gray(`Looking up source code for ${location}`));

  const extension = requestedFileName.slice(requestedFileName.lastIndexOf('.'));

  if (!scannedExtensions.has(extension)) {
    scannedExtensions.add(extension);
    // dot: true is present to include the .tox directory for Python
    const fileNames = await promisify(glob)(`${directory}/**/*${extension}`, {
      dot: true,
      ignore: [
        '**/node_modules/**',
        '**/vendor/**',
        'tmp/**',
        '**/build/**',
        '**/dist/**',
        '**/target/**',
        '**/.git/**',
      ],
    });
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
    warn(chalk.gray(`File not found in the workspace: ${requestedFileName}`));
    return;
  }
  candidates.sort((a, b) => a.length - b.length);

  const fileName = candidates[0];
  if (!(await exists(fileName))) {
    warn(chalk.gray(`File ${fileName} does not exist`));
    return;
  }

  const fileContent = await readFile(fileName, 'utf-8');
  const path = fileName.slice(directory.length + 1);

  if (!lineNo || lineNo <= 0) return { content: fileContent, location: path };

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

  // determine the extent of the snippets and return a single snippet that contains all the complete lines
  if (matches.length === 0) {
    warn(chalk.gray(`No source code found for ${location}`));
    return;
  }

  const extent = {
    from: Math.min(...matches.map((match) => match.metadata.loc.lines.from)),
    to: Math.max(...matches.map((match) => match.metadata.loc.lines.to)),
  };

  if (verbose())
    warn(
      chalk.gray(
        `Found ${matches.length} matches for ${location} (extent: ${extent.from}-${extent.to})`
      )
    );

  return {
    content: fileContent
      .split('\n')
      .slice(extent.from - 1, extent.to)
      .join('\n'),
    location: `${path}:${extent.from}-${extent.to}`,
  };
}
