import { ChatOpenAI } from '@langchain/openai';
import { warn } from 'console';
import { readFile, writeFile } from 'fs/promises';
import OpenAI from 'openai';
import InteractionHistory from '../interaction-history';
import trimFences from '../lib/trim-fences';

export type FileUpdate = {
  file: string;
  content: string;
};

const SYSTEM_PROMPT = `**File Change Applier**

Your job is to apply a suggested code change. You'll be provided with the existing code
and the suggested change. You should apply the change to the existing code and return the updated code.

Your response should be the raw text of the updated code.
`;

export default class FileUpdateService {
  constructor(
    public history: InteractionHistory,
    public modelName: string,
    public temperature: number
  ) {}

  async apply(fileUpdate: FileUpdate): Promise<string[] | void> {
    const fileContents = await readFile(fileUpdate.file, 'utf8');
    const updateLines = fileUpdate.content.split('\n');
    const sourceLines = fileContents.split('\n');

    // Find the likely chunk where the update should be applied
    let minLocation: number;
    let maxLocation: number;
    {
      // Discard lines that match more than one place in the fil.
      const matchCount = new Map<string, number>();
      for (const line of updateLines) {
        for (let sourceLineIndex = 0; sourceLineIndex < sourceLines.length; sourceLineIndex += 1) {
          if (sourceLines[sourceLineIndex] === line) {
            if (!matchCount.has(line)) matchCount.set(line, 0);
            matchCount.set(line, matchCount.get(line)! + 1);
          }
        }
      }

      const commonLines = new Set<string>();
      for (const [line, count] of matchCount) {
        if (count > 1) commonLines.add(line);
      }

      // Now that we've done that, figure out where the remaining lines are located in the file.
      const locations = new Array<number>();
      for (const line of updateLines) {
        // eslint-disable-next-line no-continue
        if (commonLines.has(line)) continue;

        for (let sourceLineIndex = 0; sourceLineIndex < sourceLines.length; sourceLineIndex += 1) {
          if (sourceLines[sourceLineIndex] === line) {
            locations.push(sourceLineIndex);
          }
        }
      }

      // Compute the median location. Discard outliers use the median to determine the center
      // of the code chunk. Add some padding before and after it, since the LLM will be tolerant
      // of that (in a way that diff/patch isn't).
      const median = locations.sort((a, b) => a - b)[Math.floor(locations.length / 2)];
      warn(`Median code location: ${median}`);

      const filteredLocations = locations.filter(
        (location) => Math.abs(location - median) < (updateLines.length * 2) / 3
      );
      warn(`Filtered locations: ${filteredLocations.join(', ')}`);

      minLocation = Math.max(Math.min(...filteredLocations) - 10, 0);
      maxLocation = Math.min(Math.max(...filteredLocations) + 10, sourceLines.length);
    }

    let preSegment = '';
    let postSegment = '';
    if (minLocation > 0) {
      preSegment = sourceLines.slice(0, minLocation - 1).join('\n');
    }
    const matchSegment = sourceLines.slice(minLocation - 1, maxLocation - 1).join('\n');
    if (maxLocation < sourceLines.length - 1) {
      postSegment = sourceLines.slice(maxLocation - 1).join('\n');
    }

    const newSegment = await this.mergeCode(matchSegment, fileUpdate.content);

    // Use this to apply directly as a patch.
    // It's not forgiving of boundaries though.

    // const dmp = new DMP();
    // const diffs = dmp.diff_main(matchSegment, fileUpdate.content);
    // dmp.diff_cleanupEfficiency(diffs);
    // warn(diffs);

    // const patches = dmp.patch_make(diffs);
    // const [newSegment, patchApplied] = dmp.patch_apply(patches, matchSegment);

    // const patchFailedCount = patchApplied.filter((result) => !result).length;
    // if (patchFailedCount > 0) {
    //   warn(`Failed to apply ${patchFailedCount} patches to ${fileUpdate.file}`);
    // }

    const newContent = [preSegment, newSegment, postSegment].join('\n');
    await writeFile(fileUpdate.file, newContent, 'utf8');

    return [`File change applied to ${fileUpdate.file}.\n`];
  }

  async mergeCode(fileContents: string, fileUpdate: string): Promise<string> {
    const openAI: ChatOpenAI = new ChatOpenAI({
      modelName: this.modelName,
      temperature: this.temperature,
    });
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        content: SYSTEM_PROMPT,
        role: 'system',
      },
      {
        content: `<existing-code>${fileContents}</existing-code>`,
        role: 'user',
      },
      {
        content: `<suggested-change>${fileUpdate}</suggested-change>`,
        role: 'user',
      },
    ];

    // eslint-disable-next-line no-await-in-loop
    const response = await openAI.completionWithRetry({
      messages,
      model: openAI.modelName,
      stream: true,
    });
    const tokens = Array<string>();
    warn(`File change response:\n`);
    // eslint-disable-next-line no-await-in-loop
    for await (const token of response) {
      process.stderr.write(token.choices.map((choice) => choice.delta.content).join(''));
      tokens.push(token.choices.map((choice) => choice.delta.content).join(''));
    }
    const rawResponse = tokens.join('');
    return trimFences(rawResponse);
  }
}
