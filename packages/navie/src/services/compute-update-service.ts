import { extractFileChanges } from '..';
import InteractionHistory from '../interaction-history';
import trimFences from '../lib/trim-fences';
import Message from '../message';
import CompletionService from './completion-service';

export const COMPUTE_UPDATE_PROMPT = `**Compute Update**

Your job is to determine how to apply a proposed change to a file.

You should examine the file contents and the proposed change, and provide a selection of
the file that should be replaced by the proposed change.

The selection you return should include the lines that should be replaced, as well as
any surrounding context that is necessary to properly locate the change within the file.

**Output format**

Your output should include:

* <change> wrapper tag.
* <original> selection from the file that should be replaced.
* <modified> the replacement string that should take the place of the <original> selection.

You should not write anything else to the output.

**Output example**

<change>
  <original><![CDATA[

  ]]></original>
  <modified><![CDATA[

  ]]></modified>
</change>
`;

export type Update = {
  original: string;
  modified: string;
};

export default class ComputeUpdateService {
  public constructor(
    public readonly history: InteractionHistory,
    public readonly completionService: CompletionService
  ) {}

  async computeUpdate(existingContent: string, newContent: string): Promise<Update | undefined> {
    const existingContentPrompt = `<file><![CDATA[
${existingContent}
]]></file>
`;

    const messages: Message[] = [
      {
        content: COMPUTE_UPDATE_PROMPT,
        role: 'system',
      },
      {
        content: existingContentPrompt,
        role: 'system',
      },
      {
        content: newContent,
        role: 'user',
      },
    ];

    const tokens = [];
    const completion = this.completionService.complete(messages, { temperature: 0 });
    for await (const message of completion) {
      tokens.push(message);
    }

    const originalRaw = tokens.join('');
    const original = trimFences(originalRaw);

    const changes = extractFileChanges(original);
    if (changes.length === 0) {
      this.history.log('No changes were emitted in the output:');
      this.history.log(originalRaw);
      return undefined;
    }

    if (changes.length > 1)
      this.history.log(
        `Expected 1 change, but found ${changes.length}. Using the first update found.`
      );

    return changes[0];
  }
}
