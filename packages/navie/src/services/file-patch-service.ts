import { ChatOpenAI } from '@langchain/openai';
import { warn } from 'console';
import { readFile } from 'fs/promises';
import OpenAI from 'openai';

import InteractionHistory from '../interaction-history';
import completion from '../lib/completion';

export type FileUpdate = {
  file: string;
  content: string;
};

const SYSTEM_PROMPT = `**File Patch Generator**

Your job is to generate a patch to an existing file.

**Inputs**

- **suggested-change**: The code change to apply.
- **existing-code**: The existing code in the file.

**Output**

Respond with a patch in unified diff format that can be applied to the existing code to apply the suggested change.

Emit:

* **Start line:** The line number where the change should be made.
* **Existing line count:** The number of lines in the existing code (without removed lines).
* **Suggested line count:** The number of lines in the suggested change (with added lines).
* **Diff:** The diff of the existing code and the suggested change.

Include 5 lines of context before and after the change.

**Example**

Input:
<existing-code>
1class MicropostsController < ApplicationController
2  before_action :logged_in_user, only: [:create, :destroy]
3  before_action :correct_user, only: :destroy
4
5  def create
6    @micropost = current_user.microposts.build(micropost_params)
7    @micropost.image.attach(params[:micropost][:image])
8    if @micropost.save
9      flash[:success] = "Micropost created!"
10      redirect_to root_url
11    else
12      @feed_items = current_user.feed.paginate(page: params[:page])
13      render "static_pages/home", status: :unprocessable_entity
14    end
15  end
16
17  def destroy
18    @micropost.destroy
19    flash[:success] = "Micropost deleted"
25  end
26
27  private
28
29  def micropost_params
30    params.require(:micropost).permit(:content, :image)
31  end
</existing-code>

<suggested-change>
  def destroy
    @micropost.destroy
    flash[:success] = "Micropost deleted"
    if request.referrer.nil?
      redirect_to root_url, status: :see_other
    else
      redirect_to request.referrer, status: :see_other
    end
  end

  private
</suggested-change>

Output:
\`\`\`diff
--- a/app/controllers/microposts_controller.rb
+++ b/app/controllers/microposts_controller.rb
@@ -17,6 +17,11 @@ class MicropostsController < ApplicationController
   def destroy
     @micropost.destroy
     flash[:success] = "Micropost deleted"
+    if request.referrer.nil?
+      redirect_to root_url, status: :see_other
+    else
+      redirect_to request.referrer, status: :see_other
+    end
   end
 
   private
\`\`\`
`;

export default class FilePatchService {
  constructor(
    public history: InteractionHistory,
    public modelName: string,
    public temperature: number
  ) {}

  async generatePatch(fileUpdate: FileUpdate): Promise<string | undefined> {
    const fileContents = await readFile(fileUpdate.file, 'utf8');

    const openAI: ChatOpenAI = new ChatOpenAI({
      modelName: this.modelName,
      temperature: this.temperature,
    });

    const fileWithNumberedLines = fileContents
      .split('\n')
      .map((line, index) => `${index + 1}${line}`)
      .join('\n');

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        content: SYSTEM_PROMPT,
        role: 'system',
      },
      {
        content: `<existing-code>${fileWithNumberedLines}</existing-code>`,
        role: 'user',
      },
      {
        content: `<suggested-change>${fileUpdate.content}</suggested-change>`,
        role: 'user',
      },
    ];

    const response = completion(openAI, messages);
    const tokens = Array<string>();
    for await (const token of response) {
      tokens.push(token);
    }
    const rawResponse = tokens.join('');
    warn(`Code change response:\n${rawResponse}`);
    return rawResponse;
  }
}
