import { ChatVertexAI } from '@langchain/google-vertexai-web';
import { CommandRequest } from '../command';
import { ChatHistory } from '../navie';
import { join, relative, resolve } from 'node:path';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { tool } from '@langchain/core/tools';
import z from 'zod';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { MemorySaver, MessagesAnnotation, StateGraph } from '@langchain/langgraph';
import { config } from 'node:process';
import { HumanMessage } from '@langchain/core/messages';

/**
 * List the contents of a directory at path, up to depth.
 * Only accepts paths that are relative to the project root.
 * @param path
 * @param depth
 */
async function listDir({ path, depth = 2 }: { path: string; depth?: number }): Promise<string> {
  const projectRoot = process.cwd();
  const fullPath = resolve(projectRoot, path);
  if (!fullPath.startsWith(projectRoot)) {
    return `Error: ${path} is not relative to the project root.`;
  }

  const result: string[] = [];
  const queue: Array<{ path: string; depth: number }> = [{ path: fullPath, depth }];

  while (queue.length > 0) {
    const { path, depth } = queue.pop()!;
    const files = await readdir(path);
    for (const file of files) {
      if (file.startsWith('.')) continue;
      if (file === 'node_modules') continue;
      const filePath = join(path, file);
      const fileStat = await stat(filePath);
      if (fileStat.isDirectory() && depth > 0) {
        queue.push({ path: filePath, depth: depth - 1 });
      } else if (fileStat.isFile()) {
        const relativePath = relative(projectRoot, filePath);
        result.push(relativePath);
      }
    }
  }

  return `Here's the files and directories up to ${depth} levels deep in ${path}, excluding hidden items:\n${result.join(
    '\n'
  )}`;
}

async function readFileT({ path }: { path: string }): Promise<string> {
  const projectRoot = process.cwd();
  const fullPath = resolve(projectRoot, path);
  if (!fullPath.startsWith(projectRoot)) {
    return `Error: ${path} is not relative to the project root.`;
  }
  const fileStat = await stat(fullPath);
  if (!fileStat.isFile()) {
    return `Error: ${path} is not a file.`;
  }
  return `Here's the contents of ${path}:\n${await readFile(fullPath, 'utf-8')}`;
}

async function createFile({ path, contents }: { path: string; contents: string }): Promise<string> {
  const projectRoot = process.cwd();
  const fullPath = resolve(projectRoot, path);
  if (!fullPath.startsWith(projectRoot)) {
    return `Error: ${path} is not relative to the project root.`;
  }
  // create any containing directories if needed
  await mkdir(resolve(fullPath, '..'), { recursive: true });
  await writeFile(fullPath, contents.replaceAll('\\n', '\n'));
  return `Created ${path}.`;
}

const listDirTool = tool(listDir, {
  name: 'listDir',
  description: 'List the contents of a directory at path, up to depth.',
  schema: z.object({
    path: z.string().describe('The path to the directory to list.'),
    depth: z.number().describe('The depth to list the directory to.').default(2),
  }),
  verbose: true,
});

const readFileTool = tool(readFileT, {
  name: 'readFile',
  description: 'Read the contents of a file at path.',
  schema: z.object({
    path: z.string().describe('The path to the file to read.'),
  }),
  verbose: true,
});

const createFileTool = tool(createFile, {
  name: 'createFile',
  description: 'Create a file at path with the given contents.',
  schema: z.object({
    path: z.string().describe('The path to the file to create.'),
    contents: z.string().describe('The contents of the file to create.'),
  }),
  verbose: true,
});

const PROMPT = `You are an expert software engineer. You are helping a developer with a codebase.

The user has asked you to document the codebase architecture.
The codebase is in the current directory. You can use the tools available to you to examine the codebase.
Be thorough and verbose. Take your time and prepare detailed documentation.
Use readFile tool to read the contents of relevant code files.

You should create documentation as markdown files in doc directory. Use createFile tool to create a file.
You should make an index.md with an overview and separate md files with architecture details  of different areas of the application.

Your thinking should be thorough and so it's fine if it's very long.
Take your time to read the relevant files and work on your own to create a complete and extensive documentation suite.

Make sure to write the documentation in markdown files in doc directory using createFile tool.
`;

async function* document(
  request: CommandRequest,
  chatHistory?: ChatHistory
): AsyncIterable<string> {
  // const model = new ChatVertexAI({ model: 'gemini-1.5-pro-002' });
  const tools = [listDirTool, readFileTool, createFileTool];
  const model = new ChatOpenAI({ modelName: 'gpt-4o', maxTokens: 16384 }).bindTools(tools);

  let totalTurns = 0;
  // Define the function that determines whether to continue or not
  function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
    const lastMessage = messages[messages.length - 1];

    // If the LLM makes a tool call, then we route to the "tools" node
    if (lastMessage.additional_kwargs.tool_calls) {
      return 'tools';
    }
    // Otherwise, we prod the model to continue or stop (reply to the user) using the special "__end__" node
    totalTurns += 1;
    if (totalTurns > 10) {
      return '__end__';
    } else return 'prod';
  }

  async function callModel(state: typeof MessagesAnnotation.State) {
    const response = await model.invoke(state.messages);

    // We return a list, because this will get added to the existing list
    return { messages: [response] };
  }
  const toolNode = new ToolNode(tools);

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode('agent', callModel)
    .addEdge('__start__', 'agent') // __start__ is a special name for the entrypoint
    .addNode('tools', toolNode)
    .addEdge('tools', 'agent')
    .addNode('prod', () => ({
      messages: [
        new HumanMessage(
          'Please continue examining the application adding more detailed documentation. Make sure to write your output to files in doc directory.'
        ),
      ],
    }))
    .addEdge('prod', 'agent')
    .addConditionalEdges('agent', shouldContinue);

  // Finally, we compile it into a LangChain Runnable.
  const app = workflow.compile();

  const initialListing = await listDir({ path: process.cwd() });
  const stream = await app.stream(
    {
      messages: [
        ...(chatHistory || []),
        { type: 'system', content: PROMPT },
        {
          type: 'user',
          content: initialListing + '\n\n' + request.question,
        },
      ],
    },
    { recursionLimit: 100 } as never
  );
  for await (const chunk of stream) {
    console.log(chunk);
  }
}

export default { execute: document, description: 'Document the current codebase' };
