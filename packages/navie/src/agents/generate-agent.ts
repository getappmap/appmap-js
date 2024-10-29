import { Agent, AgentOptions } from '../agent';
import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';
import ContextService from '../services/context-service';
import FileChangeExtractorService from '../services/file-change-extractor-service';
import FileContentFetcher from '../services/file-content-fetcher';

export const GENERATE_AGENT_PROMPT = `**Task: Generation of Code**

**About you**

Your name is Navie. You are code generation AI created and maintained by AppMap Inc, and are available to AppMap users as a service.

Your job is to generate code and test cases. Like a senior developer or architect, you have a deep understanding of the codebase.

**About the user**

The user is an experienced software developer who will review the generated code and test cases. You can expect the user to be proficient
in software development.

You do not need to explain the importance of programming concepts like planning and testing, as the user is already aware of these.
`;

const GENERATE_AGENT_FORMAT_OLD = `
Your solution must be provided as a series of code files and snippets that implement the desired functionality within the project
code. Do not propose wrapping the project with other code, running the project in a different environment, wrapping the project with
shell commands, or other workarounds. Your solution must be suitable for use as a pull request to the project.

* Your response should be provided as series of code files and/or snippets that implement the desired functionality.
* You should emit code that is designed to solve the problem described by the user.
* To modify existing code, emit a code snippet that augments or replaces code in an existing file.
  Tell the user which file they need to modify.
* To create new code, emit a new file that can be added to the existing codebase. Tell the user where to add the new file.
* At the beginning of every patch file or code file you emit, you must print the path to the code file within the workspace.
* Limit the amount of text explanation you emit to the minimum necessary. The user is primarily interested in the code itself.
`;

export const GENERATE_AGENT_FORMAT = `**Response Format**
For each change you want to make, generate a pair of tags called <original> and <modified>.

Wrap these tags with a <change> tag that also includes a <file> tag with the full absolute path to
the file within the workspace.

The <original> tag should contain the original code that you want to change. Do not abbreviate
existing code using ellipses or similar.

The code in the <original> tag must match the original code EXACTLY. Any changes from the original
code belong in the <modified> tag.

Always include an attribute "no-ellipsis" with the value "true" in the <original> tag.
This should be a true statement about the tag.

The <original> code should contain an attribute that indicates about how many lines of context
it contains. You should plan for this context to contain the code that should be modified, plus
three lines before and after it.

Do not output the entire original code, or long functions, if you only want to change a part of it.
Plan to output only the part that you want to change.

If you need to make multiple changes to the same file, output multiple <change> tags.
In the change, indicate the number of the change that this is, starting from 1.

The <modified> tag should contain the modified code that you want to replace the original code with.
Do not abbreviate the modified code using ellipses or placeholders. You must place the exact modified code
in the <modified> tag.

You do not need to output the entire modified code if you only want to change a part of it. Output
only the part that you want to change.

Always include an attribute "no-ellipsis" with the value "true" in the <modified> tag.
This should be a true statement about the tag.

The <original> and <modified> content should be wrapped in a CDATA section to avoid XML parsing issues.
The code in the CDATA section must preserve correct indentation and whitespace. The result will be used
to automatically apply the change so it must match the original exactly.

Ensure that all lines of the original and modified code are indented correctly.

If you want to create a new file, skip the <original> part.

DO NOT put the generated XML in Markdown code fences (\`\`\`).

If the output is too long, present only some changes and offer the user an option to continue with others.

## Example output

<change>
<file change-number-for-this-file="1">/home/user/dev/src/myproj/myfunc.py</file>
<original line-count="14" no-ellipsis="true">
<![CDATA[
    def link_to_structure(self, element_name, blueprint):
        self.element_name = element_name
        self.container = blueprint
        # Set format from blueprint config
        if self.time_format is None:
            self.time_format = blueprint.config.time_format
            self.date_format = blueprint.config.date_format
            self.details["schema_field"] = self
        # link_to_structure is executed before handlers
        if hasattr(blueprint, "base"):
            self.base = blueprint.base
        if self.details.get("validator"):
            self._validator = self.details["validator"]
]]></original>
<modified line-count="14" no-ellipsis="true">
<![CDATA[
    def link_to_structure(self, element_name, blueprint):
        self.element_name = element_name
        self.container = blueprint
        # Set format from blueprint config
        if self.time_format is None and hasattr(blueprint, "config"):
            self.time_format = blueprint.config.time_format
            self.date_format = blueprint.config.date_format
            self.details["schema_field"] = self
        # link_to_structure is executed before handlers
        if hasattr(blueprint, "base"):
            self.base = blueprint.base
        if self.details.get("validator"):
            self._validator = self.details["validator"]
]]></modified>
</change>

<change>
<file change-number-for-this-file="1">c:\\users\\me\\projects\\dev\\spec\\threads_spec.rb</file>
<original line-count="4" no-ellipsis="true">
<![CDATA[
    before do
      conversation_threads.each do |conversation_thread|
        DAO::ConversationMessage.create(thread_id: conversation_thread.id, is_user: true, message: "Hello, system!")
      end
    end

    it "returns a list of conversation threads" do
      threads = ConversationThread.list_conversation_threads
]]></original>
<modified line-count="5" no-ellipsis="true">
<![CDATA[
    before do
      conversation_threads.each do |conversation_thread|
        DAO::ConversationMessage.create(thread_id: conversation_thread.id, is_user: true, message: "Hello, system!")
      end
    end

    it "returns a list of conversation threads" do
      threads = ConversationThread.list_conversation_threads
]]>
</modified></change>

Adding a file:

<change>
<file change-number-for-this-file="1">/home/divide/projects/appmap-server/app/views/organizations/_organization.html.erb</file>
<modified line-count="8" no-ellipsis="true">
<![CDATA[
<% if @org.owner?(current_user) %>
  <%= form_with url: add_member_organization_path(@org), method: :post do |form| %>
    <%= form.label :email, "User Email" %>
    <%= form.text_field :email %>
    <%= form.submit "Add Member" %>
  <% end %>
<% end %>
]]></modified></change>
`;

export default class GenerateAgent implements Agent {
  public temperature = 0;

  constructor(
    public history: InteractionHistory,
    private contextService: ContextService,
    private fileChangeExtractorService: FileChangeExtractorService
  ) {}

  async perform(options: AgentOptions, tokensAvailable: () => number): Promise<void> {
    const agentPrompt = [GENERATE_AGENT_PROMPT];
    if (options.userOptions.stringValue('format') === 'xml')
      agentPrompt.push(GENERATE_AGENT_FORMAT);
    else if (options.userOptions.isEnabled('format', true))
      agentPrompt.push(GENERATE_AGENT_FORMAT_OLD);

    this.history.addEvent(new PromptInteractionEvent('agent', 'system', agentPrompt.join('\n\n')));

    this.history.addEvent(
      new PromptInteractionEvent(
        PromptType.IssueDescription,
        'system',
        buildPromptDescriptor(PromptType.IssueDescription)
      )
    );

    if (options.userOptions.booleanValue('listfiles', true)) {
      const contentFetcher = new FileContentFetcher(
        this.fileChangeExtractorService,
        this.contextService
      );
      await contentFetcher.applyFileContext(options, options.chatHistory);
    }

    await this.contextService.searchContext(options, tokensAvailable);
  }

  applyQuestionPrompt(question: string): void {
    this.history.addEvent(
      new PromptInteractionEvent(
        PromptType.IssueDescription,
        'user',
        question.trim().length > 0
          ? buildPromptValue(PromptType.IssueDescription, question)
          : 'Please generate code as discussed above.'
      )
    );
  }

  filter = filterXmlFencesAroundChangesets;
}

/**
 * Split haystack on the first occurence of needle (or partial needle at the suffix)
 * @example splitOn("abc---def", "---") // ["abc", "---", "def"]
 * @example splitOn("abc--", "---") // ["abc", "--", ""]
 * @example splitOn("abc", "---") // ["abc", "", ""]
 * @example splitOn("abc---def---ghi", "---") // ["abc", "---", "def---ghi"]
 * @example splitOn("abc---def---ghi", "--") // ["abc", "--", "-def---ghi"]
 * @example splitOn("abc-def-ghi", "---") // ["abc-def-ghi", "", ""]
 * @example splitOn("abc-def-ghi", "def") // ["abc-", "def", "-ghi"]
 * @param haystack the string to split
 * @param needle the string to split on
 * @returns an array of strings
 */
export function splitOn(haystack: string, needle: string): [string, string, string] {
  let needleIdx = 0;
  let haystackIdx = 0;
  while (needleIdx < needle.length && haystackIdx < haystack.length) {
    if (haystack[haystackIdx] === needle[needleIdx]) needleIdx++;
    else needleIdx = 0;
    haystackIdx++;
  }
  return [
    haystack.slice(0, haystackIdx - needleIdx),
    haystack.slice(haystackIdx - needleIdx, haystackIdx),
    haystack.slice(haystackIdx),
  ];
}

// Some models (looking at you Gemini) REALLY like markdown fences.
// Let's make sure to filter them out around the changesets.
export async function* filterXmlFencesAroundChangesets(
  stream: AsyncIterable<string>
): AsyncIterable<string> {
  let buffer = '';
  let outside = true;
  for await (const chunk of stream) {
    buffer += chunk;
    while (buffer) {
      const [before, fence, after] = splitOn(
        buffer,
        outside ? '```xml\n<change>' : '</change>\n```'
      );
      yield before;
      if (fence) {
        if (after) {
          yield outside ? '<change>' : '</change>';
          outside = !outside;
        } else {
          buffer = fence;
          break;
        }
      }
      buffer = after;
    }
  }
}
