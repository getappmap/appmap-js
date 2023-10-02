import yargs from 'yargs';
import { existsSync } from 'fs';
import { warn } from 'console';
import { OpenAI } from 'openai';
import assert from 'assert';
import { readFile } from 'fs/promises';
import { inspect } from 'util';
import * as diff from 'diff';

import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { findFiles, verbose } from '../../utils';
import UI from '../userInteraction';

export const command = 'install-github-action';
export const describe = 'Install the AppMap GitHub action to a project';

export default async function buildOpenAIApi(): Promise<OpenAI | undefined> {
  let gptKey = process.env.OPENAI_API_KEY;
  if (!gptKey) {
    const gptKey = UI.prompt({
      message: 'Enter your OpenAI API key',
      mask: '*',
    });
    if (!gptKey) return;
  }

  return new OpenAI({ apiKey: gptKey });
}

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });

  return args.strict();
};

async function installGitHubAction() {
  if (!existsSync('.github')) {
    warn(`.github directory does not exist`);
    return;
  }

  const workflowFiles = await findFiles('.github', '.yml');
  if (workflowFiles.length === 0) {
    warn(`No workflows found in .github directory`);
    return;
  }

  let workflowFile: string;
  {
    const answer = await UI.prompt({
      type: 'list',
      name: 'action',
      message: 'Choose a workflow file:',
      choices: workflowFiles,
    });
    if (!answer) return;

    workflowFile = answer.action;
  }
  const workflowStr = await readFile(workflowFile, 'utf-8');

  UI.status = `Suggesting AppMap installation to GitHub Workflow ${workflowFile}`;

  const ai = await buildOpenAIApi();
  if (!ai) return;

  const snippet = `
    - name: Prepare bundle for AppMap installation
      run: bundle config unset deployment
    - name: Install AppMap
      id: install-appmap
      uses: getappmap/install-action@v1
      with:
        build-tool: bundler
`

  const result = await ai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'Respond with a complete copy of the workflow'
      },
      {
        role: 'system',
        content: 'Include two line breaks before and after the injected snippet'
      },
      {
        role: 'user',
        content:
          'I want to add a step to the following GitHub Action workflow that runs after the language tools are installed, but before the tests are run',
      },
      {
        role: 'user',
        content: `Inject my workflow snippet which is: SNIPPET\n${snippet}END SNIPPET`
      }
      {
        role: 'user',
        content: workflowStr,
      },
    ],
    model: 'gpt-3.5-turbo',
  });

  const response = result.choices
    .map((choice) => (assert(choice.message), choice.message.content))
    .filter(Boolean)
    .join('\n');

  UI.success();

  const patch = diff.createTwoFilesPatch(workflowFile, workflowFile, workflowStr, response);

  warn(patch);
}

export const handler = async (argv: any) => {
  verbose(argv.verbose);

  const { directory } = argv;
  handleWorkingDirectory(directory);

  await installGitHubAction();
};
