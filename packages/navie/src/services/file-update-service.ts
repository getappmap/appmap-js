/* eslint-disable no-cond-assign */
import { ChatOpenAI } from '@langchain/openai';
import { warn } from 'console';
import { diff_match_patch as DMP } from 'diff-match-patch';
import { readFile, writeFile } from 'fs/promises';
import OpenAI from 'openai';
import { inspect } from 'util';

import InteractionHistory from '../interaction-history';

export type FileUpdate = {
  file: string;
  original: string;
  modified: string;
};

export default class FileUpdateService {
  constructor(public history: InteractionHistory) {}

  async apply(fileUpdate: FileUpdate): Promise<string[] | undefined> {
    const fileContents = await readFile(fileUpdate.file, 'utf8');
    const searchLines = fileUpdate.original.split('\n');
    const sourceLines = fileContents.split('\n');

    // Find the likely chunk where the update should be applied
    let minLocation: number;
    let maxLocation: number;
    {
      // Discard lines that match more than one place in the fil.
      const matchCount = new Map<string, number>();
      for (const line of searchLines) {
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
      for (const line of searchLines) {
        // eslint-disable-next-line no-continue
        if (commonLines.has(line)) continue;

        for (let sourceLineIndex = 0; sourceLineIndex < sourceLines.length; sourceLineIndex += 1) {
          if (sourceLines[sourceLineIndex] === line) {
            locations.push(sourceLineIndex);
          }
        }
      }

      if (locations.length === 0) {
        warn(`No matching context locations found for ${fileUpdate.file}`);
        return undefined;
      }

      // Compute the median location. Discard outliers use the median to determine the center
      // of the code chunk. Add some padding before and after it, since the LLM will be tolerant
      // of that (in a way that diff/patch isn't).
      const median = locations.sort((a, b) => a - b)[Math.floor(locations.length / 2)];
      warn(`Median code location: ${median}`);

      const filteredLocations = locations.filter(
        (location) => Math.abs(location - median) < (searchLines.length * 2) / 3
      );
      warn(`Filtered locations: ${filteredLocations.join(', ')}`);

      minLocation = Math.max(Math.min(...filteredLocations) - 10, 0);
      maxLocation = Math.min(Math.max(...filteredLocations) + 10, sourceLines.length);
    }

    const preSegment = sourceLines.slice(0, minLocation).join('\n');
    const matchSegment = sourceLines.slice(minLocation, maxLocation).join('\n');
    const postSegment = sourceLines.slice(maxLocation).join('\n');

    warn(`Merging content into match segment which spans from ${minLocation} to ${maxLocation}:\n`);
    warn(matchSegment);

    // const newSegment = await this.mergeCode(matchSegment, fileUpdate.original, fileUpdate.modified);

    const dmp = new DMP();
    const patchDiff = dmp.diff_main(fileUpdate.original, fileUpdate.modified);
    dmp.diff_cleanupEfficiency(patchDiff);
    this.history.log(`[file-update] Computed patch diff for ${fileUpdate.file}:\n`);
    this.history.log(inspect(patchDiff));

    const [newSegment, patchApplied] = dmp.patch_apply(dmp.patch_make(patchDiff), matchSegment);
    const patchFailedCount = patchApplied.filter((result) => !result).length;
    if (patchFailedCount > 0) {
      warn(`Failed to apply ${patchFailedCount} patches to ${fileUpdate.file}`);
    }

    const newContent = [preSegment, newSegment, postSegment].join('\n');
    await writeFile(fileUpdate.file, newContent, 'utf8');

    return [`File change applied to ${fileUpdate.file}.\n`];
  }
}
