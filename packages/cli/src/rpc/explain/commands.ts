import { ExplainRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';

const EXPLAIN_DESCRIPTION = `
The @explain command is used to build code understanding of the project by engaging in a
free-form conversation with the Navie AI. Ask questions about the codebase, and Navie will
respond with explanations, diagrams, code snippets, and more.
`.trim();

const DIAGRAM_DESCRIPTION = `
The @diagram command is used to request a diagram from Navie. Navie can generate flowchart,
entity-relationship diagram (ERD), sequence diagram, and class diagram formats. You can specify
in your question which type of diagram you want. If you want to adjust a diagram, you can follow
up with @diagram questiions that specify the changes you want. In the Navie UI, you can copy,
save, edit, and share diagrams using the menus and buttons.
`.trim();

const PLAN_DESCRIPTION = `
The @plan command is used to request an implementation plan from Navie. Your question should
describe a code issue - you can even copy and paste an issue description from an issue tracking
system. Navie will respond with a plan that includes an analysis of the issue and a list of
steps to implement a solution. 
`.trim();

const GENERATE_DESCRIPTION = `
The @generate command is used to request code generation from Navie. Once you have created a
plan with the @plan command, you can follow up by asking Navie to @generate code that implements.
In fact, if your previous question was a @plan command, you can simply ask Navie to @generate.
`;

const HELP_DESCRIPTION = `
The @help command is used to request help with AppMap and Navie AI. Navie has help documentation
built in, so you can ask questions about how to use Navie, how to use AppMap, and about best
practices for code understanding, planning, code generation, and software architecture. 
`.trim();

const CONTEXT_DESCRIPTION = `
The @context command is used to request context from Navie. Navie searches the project
for runtime data, code snippets, documentation, and other information that's relevant to a
question. The @context command provides a way to retrieve this context without asking a question.
`.trim();

function commandsHandler(): ExplainRpc.ExplainCommandsResponse {
  return {
    commands: [
      {
        name: 'explain',
        description: EXPLAIN_DESCRIPTION,
        referenceUrl: 'https://appmap.io/docs/reference/navie.html#explain',
      },
      {
        name: 'diagram',
        description: DIAGRAM_DESCRIPTION,
        referenceUrl: 'https://appmap.io/docs/reference/navie.html#diagram',
        demoUrls: [],
      },
      {
        name: 'plan',
        description: PLAN_DESCRIPTION,
        referenceUrl: 'https://appmap.io/docs/reference/navie.html#plan',
        demoUrls: ['https://vimeo.com/985121150'],
      },
      {
        name: 'generate',
        description: GENERATE_DESCRIPTION,
        referenceUrl: 'https://appmap.io/docs/reference/navie.html#generate',
        demoUrls: ['https://vimeo.com/985121150'],
      },
      {
        name: 'help',
        description: HELP_DESCRIPTION,
        referenceUrl: 'https://appmap.io/docs/reference/navie.html#help',
      },
      {
        name: 'context',
        description: CONTEXT_DESCRIPTION,
        demoUrls: ['https://vimeo.com/981594290'],
      },
    ],
  };
}

export const explainCommands: () => RpcHandler<
  ExplainRpc.ExplainCommandsOptions,
  ExplainRpc.ExplainCommandsResponse
> = () => ({
  name: ExplainRpc.ExplainCommandsFunctionName,
  handler: commandsHandler,
});
