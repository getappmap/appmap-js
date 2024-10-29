import { parseOptions, REVIEW_DIFF_LOCATION, UserContext } from '@appland/navie';
import configuration from '../configuration';
import { execFile } from 'node:child_process';

const exec = (command: string, args: string[], options?: { cwd?: string }) =>
  new Promise<string>((resolve, reject) => {
    const child = execFile(command, args, { ...(options ?? {}) });

    let stdout = '';
    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data', (data: string) => {
      stdout += data.toString();
    });

    let stderr = '';
    child.stderr?.setEncoding('utf8');
    child.stderr?.on('data', (data: string) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr));
    });
  });

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
  const base = result.options.stringValue('base', 'main');
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
        content: await exec('git', ['log', '-p', '--full-diff', `${base}..HEAD`], { cwd }),
      },
    ],
  };
}
