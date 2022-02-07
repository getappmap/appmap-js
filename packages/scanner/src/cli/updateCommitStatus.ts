import postCommitStatus from '../integration/github/commitStatus';

export default async function updateCommitStatus(
  numFindings: number,
  numChecks: number
): Promise<void> {
  if (numFindings > 0) {
    await postCommitStatus(
      'failure',
      `${numChecks} checks, ${numFindings} findings. See CI job log for details.`
    );
    console.log(`Commit status updated to: failure (${numFindings} findings)`);
  } else {
    await postCommitStatus('success', `${numChecks} checks passed`);
    console.log(`Commit status updated to: success.`);
  }
}
