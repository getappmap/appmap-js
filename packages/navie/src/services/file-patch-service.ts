import { ChatOpenAI } from '@langchain/openai';
import { warn } from 'console';
import { readFile } from 'fs/promises';
import OpenAI from 'openai';
import { createPatch } from 'diff';

import InteractionHistory from '../interaction-history';
import trimFences from '../lib/trim-fences';

export type FileUpdate = {
  file: string;
  content: string;
};

const SYSTEM_PROMPT = `**File Change Applier**

Your job is to apply a code change to an existing file.

**Inputs**

- **existing-code**: The existing code in the file.
- **suggested-change**: The code change to apply.

**Output**

Respond with the segment of existing code to which the suggested change should be applied.

The existing code segment should be surrounded by context lines that are unchanged. The context lines
should be the same as the original code.

Try to include 3 lines of context at the beginning and end of the output code segment.

**Example**

Input:
<existing-code>
class UsersController < ApplicationController
  before_action :logged_in_user, only: [:index, :edit, :update, :destroy,
                                        :following, :followers]
  before_action :correct_user,   only: [:edit, :update]
  before_action :admin_user,     only: :destroy

  def index
    @users = User.paginate(page: params[:page])
  end

  def show
    @user = User.find(params[:id])
    @microposts = Rails.cache.fetch(@user.microposts_cache_key) do
      @user.microposts.paginate(page: params[:page])
    end
  end
</existing-code>

<suggested-change>
  def index
    @users = User.paginate(page: params[:page])
    total_microposts = Micropost.count
    Rails.logger.info "Total number of microposts available: #{total_microposts}"
  end
</suggested-change>

Output:
  before_action :correct_user,   only: [:edit, :update]
  before_action :admin_user,     only: :destroy

  def index
    @users = User.paginate(page: params[:page])
  end

  def show
    @user = User.find(params[:id])
`;

export default class FilePatchService {
  constructor(
    public history: InteractionHistory,
    public modelName: string,
    public temperature: number
  ) {}

  async apply(fileUpdate: FileUpdate): Promise<string[] | undefined> {
    const fileContents = await readFile(fileUpdate.file, 'utf8');

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
        content: `<suggested-change>${fileUpdate.content}</suggested-change>`,
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
    // eslint-disable-next-line no-await-in-loop
    for await (const token of response) {
      tokens.push(token.choices.map((choice) => choice.delta.content).join(''));
    }
    const rawResponse = tokens.join('');
    warn(`Code change response:\n${rawResponse}`);
    const codeResponse = trimFences(rawResponse);

    if (!codeResponse) return [`Failed to extract code response from file contents.`];

    const startIndex = fileContents.indexOf(codeResponse);
    if (startIndex === -1) return [`Failed to find code response in file contents.`];

    let patch: string;
    try {
      patch = createPatch(fileUpdate.file, codeResponse, fileUpdate.content);
      warn(`Patch:\n${patch}`);
    } catch (err: any) {
      return [`Failed to create patch: ${err}`];
    }

    return [patch];

    // await writeFile(fileUpdate.file, rawResponse, 'utf8');
  }
}
