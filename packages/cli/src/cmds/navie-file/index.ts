import { execSync } from 'child_process';
import { readFile, writeFile } from 'fs/promises';
import { load } from 'js-yaml';
import yargs, { Arguments } from 'yargs';
import { z } from 'zod';
import { buildNavieProvider } from '../navie';
import INavie, { INavieProvider } from '../../rpc/explain/navie/inavie';
import { explainHandler } from '../../rpc/explain/explain';

type NavieFileCommandOptions = {
  file: string;
  output?: string;
};

const ContextExec = z.object({
  type: z.literal('exec'),
  command: z.string(),
});

const ContextCompletion = z.object({
  type: z.literal('completion'),
  system_prompt: z.string().optional(),
  prompt: z.string(),
});

const NavieContext = z.record(
  z.string(),
  z.discriminatedUnion('type', [ContextExec, ContextCompletion])
);

const NavieDeclaration = z.object({
  context: NavieContext,
});

type DependencyNode = {
  name: string;
  children: DependencyNode[];
};

function getReferences(input: string) {
  const matches = input.matchAll(/\${([^}]+)}/g);
  return [...matches].map((match) => match[1]);
}

async function loadFile(file: string) {
  const buffer = await readFile(file, 'utf-8');
  const declaration = load(buffer);
  try {
    return NavieDeclaration.parse(declaration);
  } catch (e) {
    console.error(`Error parsing declaration file: ${e}`);
    process.exit(1);
  }
}

async function depthTraversal(node: DependencyNode, fn: (name: string) => void | Promise<void>) {
  for (const child of node.children) await depthTraversal(child, fn);
  await fn(node.name);
}

async function navieCompletion(prompt: string, systemPrompt?: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let output = '';
    const attachNavie = (navie: INavie) =>
      navie
        .on('complete', () => resolve(output))
        .on('error', reject)
        .on('token', (token) => (output += token));

    const capturingProvider = (...args: Parameters<INavieProvider>) =>
      attachNavie(buildNavieProvider({ verbose: false })(...args));

    const result = explainHandler(capturingProvider, undefined).handler({
      question: prompt,
      prompt: systemPrompt,
    });
    if (result instanceof Promise) {
      result.catch(reject);
    }
  });
}

function resolveReferences(value: string, dependencies: Record<string, string>) {
  return getReferences(value).reduce(
    (acc, ref) => acc.replace(`\${${ref}}`, dependencies[ref]),
    value
  );
}

class NavieFileCommand implements yargs.CommandModule<unknown, NavieFileCommandOptions> {
  public readonly command = 'navie-file <file>';
  public readonly describe = 'Execute a Navie declaration file';

  public builder(args: yargs.Argv) {
    return args
      .positional('file', {
        describe: 'path to the declaration file',
        type: 'string',
        demandOption: true,
      })
      .option('output', {
        describe: 'output file',
        type: 'string',
      })
      .strict()
      .usage('Usage: $0 navie-file <file>');
  }

  public async handler(argv: Arguments<NavieFileCommandOptions>) {
    const declaration = await loadFile(argv.file);
    const dependencies = Object.entries(declaration.context).reduce((acc, [key, value]) => {
      switch (value.type) {
        case 'exec':
          acc[key] = getReferences(value.command);
          break;
        case 'completion': {
          const references = new Set(
            [
              getReferences(value.prompt),
              value.system_prompt ? getReferences(value.system_prompt) : [],
            ].flat()
          );
          acc[key] = [...references];
          break;
        }
      }
      return acc;
    }, {} as Record<string, string[]>);

    const reverseDependencies = Object.entries(dependencies).reduce((acc, [key, value]) => {
      acc[key] ??= [];
      value.forEach((ref) => (acc[ref] ??= []).push(key));
      return acc;
    }, {} as Record<string, string[]>);

    const rootItems = Object.keys(reverseDependencies).filter(
      (key) => !reverseDependencies[key].length
    );
    function buildDependencyTree(name: string) {
      const node: DependencyNode = { name, children: dependencies[name].map(buildDependencyTree) };
      return node;
    }
    const dependencyRoots: DependencyNode[] = rootItems.map(buildDependencyTree);
    const resolvedDependencies = {} as Record<string, string>;
    for (const root of dependencyRoots) {
      await depthTraversal(root, async (name) => {
        const value = declaration.context[name];
        switch (value.type) {
          case 'exec':
            resolvedDependencies[name] = execSync(value.command).toString();
            break;
          case 'completion': {
            const prompt = resolveReferences(value.prompt, resolvedDependencies);
            const systemPrompt = value.system_prompt
              ? resolveReferences(value.system_prompt, resolvedDependencies)
              : undefined;
            resolvedDependencies[name] = await navieCompletion(prompt, systemPrompt);
            break;
          }
        }
      });

      if (argv.output) {
        await writeFile(argv.output, resolvedDependencies[root.name]);
      } else {
        console.log(resolvedDependencies[root.name]);
      }
    }
  }
}

const navieFileCommand = new NavieFileCommand();
export default navieFileCommand;
