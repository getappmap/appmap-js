import { parseOptions, REVIEW_DIFF_LOCATION, UserContext } from '@appland/navie';
import configuration from '../configuration';
import { getDiffLog } from '../../lib/git';

/**
 * This function is responsible for transforming user context to include diff content when the
 * user has requested a review. In the event that the user has not requested a review, the function
 * will not return any user context and `applied` will be set to false.
 */
export default async function handleReview(
  question: string,
  userContext?: UserContext.Context
): Promise<{ applied: boolean; userContext?: UserContext.Context }> {
  const [mode] = question.split(/\s+/g);
  if (mode !== '@review') return { applied: false };

  const result = parseOptions(question);
  const base = result.options.stringValue('base');
  const cwd = result.options.stringValue('project', configuration().projectDirectories[0]);
  return {
    applied: true,
    userContext: [
      ...(typeof userContext === 'string'
        ? [{ content: userContext, type: 'code-selection' } as UserContext.CodeSelectionItem]
        : userContext ?? []),
      {
        type: 'code-snippet',
        location: REVIEW_DIFF_LOCATION, // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        content: await getDiffLog(undefined, base, cwd),
      },
    ],
  };
}
