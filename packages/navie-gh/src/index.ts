import NavieClient from '@appland/navie-client';
import { exec as Exec } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { Octokit } from 'octokit';
const exec = promisify(Exec);

type Issue = {
  cloneUrl: string;
  repo: string;
  owner: string;
  issueNumber: number;
};

const githubClient = new Octokit();

function getIssue(issueUrl: string): Issue {
  const [, owner, repo, issueNumber] =
    issueUrl.match(/^https:\/\/github.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/) ?? [];
  if (!owner || !repo || !issueNumber) {
    throw new Error(`Invalid issue URL: ${issueUrl}`);
  }

  return {
    cloneUrl: `https://github.com/${owner}/${repo}.git`,
    repo,
    owner,
    issueNumber: parseInt(issueNumber, 10),
  };
}

async function getIssueComments(issue: Issue) {
  const issueDescription = await githubClient.rest.issues.get({
    owner: issue.owner,
    repo: issue.repo,
    issue_number: issue.issueNumber,
  });

  if (!issueDescription.data.body) {
    throw new Error(`Issue ${issue.issueNumber} has no description`);
  }

  let comments: string[] = [];
  if (issueDescription.data.comments > 0) {
    const issueComments = await githubClient.rest.issues.listComments({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.issueNumber,
    });

    comments = issueComments.data.map((comment) => comment.body).filter(Boolean) as string[];
  }

  return {
    description: issueDescription.data.body,
    comments,
  };
}

function formatIssue(desc: { description: string; comments: string[] }) {
  return [
    desc.description,
    desc.comments.length > 0 ? '\n\nComments:\n' : '',
    ...desc.comments.map((comment) => `> ${comment}`),
  ]
    .filter(Boolean)
    .join('\n');
}

async function main() {
  const [, , issueUrl] = process.argv;
  if (!issueUrl) {
    throw new Error(`Usage: node index.js <issue-url>`);
  }

  const issue = getIssue(issueUrl);

  const checkoutDir = join(tmpdir(), `navie-gh-${issue.owner}-${issue.repo}-${issue.issueNumber}`);

  try {
    const tmpDir = await mkdir(checkoutDir, { recursive: true });
    await exec(`git clone --depth=1 ${issue.cloneUrl} ${tmpDir}`);

    const comments = await getIssueComments(issue);
    const navie = new NavieClient();
    const { threadId } = await navie.exec({
      prompt: `ignoring specific implementation details and downstream code, please provide a root cause analysis of the problem specifically within ${issue.repo}`,
      codeSelection: formatIssue(comments),
      cwd: tmpDir,
    });
    await navie.exec({
      prompt: `@test behavior that is expected to trigger the issue in ${issue.repo} described above. do not include any specific implementation details or downstream code, the test should be generic, invoke the root cause, and not specific to any particular implementation`,
      codeSelection: formatIssue(comments),
      cwd: tmpDir,
      threadId,
    });
    await navie.exec({
      prompt: `@plan /history=999 a high-level plan for how to fix the issue in ${issue.repo} described above. the solution should not be derived from specific implementation details of downstream code`,
      codeSelection: formatIssue(comments),
      cwd: tmpDir,
      threadId,
    });
    const { message: finalOutput } = await navie.exec({
      prompt: `/nocontext /history=999 Summarize the given conversation to be provided as a useful summary of the issue, including the following:

- the high-level description of the problem
- the high-level plan for how to fix the problem
- the test case that is expected to trigger the problem

This summary will be written to the GitHub issue as useful context for the software engineers who will be working on the fix.`,
      cwd: tmpDir,
      threadId,
    });
    await writeFile('issue.md', finalOutput);
    await exec('code issue.md');
  } finally {
    await rm(checkoutDir, { recursive: true, force: true });
  }
}

main();
