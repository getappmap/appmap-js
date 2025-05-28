import { CommandRequest } from '../command';
import { ExplainOptions } from '../commands/explain-command';
import { REVIEW_DIFF_LOCATION } from '../commands/review-command';
import { ContextV2 } from '../context';
import LookupContextService from '../services/lookup-context-service';
import { UserContext } from '../user-context';

/**
 * This error is thrown when the git diff cannot be resolved.
 */
export class GitDiffError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitDiffError';
  }
}

/**
 * Retrieves the git diff from the code selection.
 * @param req The command request.
 */
export function getGitDiff(
  req: CommandRequest & { codeSelection: UserContext.ContextItem[] }
): UserContext.CodeSnippetItem {
  const gitDiff = req.codeSelection.find(
    (cs): cs is UserContext.CodeSnippetItem =>
      cs.type === 'code-snippet' && cs.location === REVIEW_DIFF_LOCATION
  );
  if (!gitDiff) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    throw new GitDiffError('Unable to obtain the diff for the current branch. Please try again.');
  }

  if (gitDiff.content.trim().length === 0) {
    throw new GitDiffError('The base is the same as the head. A review cannot be performed.');
  }

  return gitDiff;
}

/**
 * Performs a context lookup for pinned items, excluding the git diff.
 * @param codeSelection The code selection provided by the user.
 * @param gitDiff The git diff to be reviewed.
 */
export async function getPinnedItemsExceptGitDiff(
  options: ExplainOptions,
  lookupContextService: LookupContextService,
  codeSelection: readonly UserContext.ContextItem[],
  gitDiff: UserContext.ContextItem
): Promise<ContextV2.ContextResponse> {
  const pinnedItems = codeSelection.filter((cs) => cs !== gitDiff);
  const locations = pinnedItems.filter(UserContext.hasLocation).map((cs) => cs.location);
  let pinnedItemLookup: ContextV2.ContextResponse = [];
  if (locations.length > 0) {
    pinnedItemLookup = await lookupContextService.lookupContext([], options.tokenLimit, {
      locations,
    });
  }

  // For backwards compatibility, include the code selections which have been sent
  // without a location.
  pinnedItemLookup.push(
    ...pinnedItems
      .filter(UserContext.isCodeSelectionItem)
      .map((cs) => ({ ...cs, type: ContextV2.ContextItemType.CodeSelection }))
  );

  return pinnedItemLookup;
}
