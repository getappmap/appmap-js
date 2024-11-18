import { load } from 'js-yaml';
import { navie } from './navie';
import { Feature, featureSearchString } from './types';
import { ContextV2 } from '@appland/navie';

const README_PROMPT = `## Task

Your task is to document a feature in the style of a software architecture document. Use the
available project information to document the feature.

Document the feature from a usage point of view, not from an implementation point of view. Focus
on the design and behavior of the feature as it is used by the end user or other parts of the
system.

Avoid including implementation details in the documentation. Do not provide a code
breakdown, as the user is not interested in that information.

When discussing code, provide only high level class information such as module names and
function signatures. Describe the flow of information between modules. Keep the information flow
description high level. Include method signatures and types, but do not include implementation
details unless they are central to the feature being described.

Do not emit anything before or after the documentation content. Just emit the documentation content.

Avoid using tentative language such as "may", "might", "could", "appears", "likely" etc. Describe
only what you see from the data.

Include the following sections in the documentation:

- Title
- Description
- Component Architecture
- Data Types
- Key Functions
`;

export type DocumentFeatureOptions = {
  prompt?: string;
  include?: string;
  exclude?: string;
};

export type FeatureArtifact = {
  content: string;
  question: string;
  prompt?: string;
};

type BaseNavieOptions = {
  include?: string;
  exclude?: string;
};

export type FeatureDocumentation = {
  readme: FeatureArtifact;
  classDiagram: FeatureArtifact;
  dependencyFiles: string[];
};

function baseNavieOptions(options: BaseNavieOptions): string[] {
  const result: string[] = ['/noprojectinfo'];
  if (options.include) result.push(`/include=${options.include}`);
  if (options.exclude) result.push(`/exclude=${options.exclude}`);
  return result;
}

export async function featureContext(
  feature: Feature,
  documentation: string,
  options = {} as BaseNavieOptions
): Promise<(ContextV2.ContextItem | ContextV2.FileContextItem)[]> {
  const navieOptions = baseNavieOptions(options);
  navieOptions.unshift('@context /nofence /noterms');

  const question = [...navieOptions, featureSearchString(feature)].join(' ');

  const contextStr = await navie('.', question, {
    codeSelection: documentation,
  });
  return load(contextStr) as (ContextV2.ContextItem | ContextV2.FileContextItem)[];
}

export function contextFiles(
  context: (ContextV2.ContextItem | ContextV2.FileContextItem)[]
): string[] {
  const files = new Set<string>();
  for (const contextItem of context) {
    if (!ContextV2.isFileContextItem(contextItem)) continue;

    if (contextItem.type !== ContextV2.ContextItemType.CodeSnippet) continue;

    if (!contextItem.location) {
      console.warn(`Context item has no location: ${JSON.stringify(contextItem)}`);
      continue;
    }

    const [path] = contextItem.location.split(':');
    files.add(path);
  }

  return Array.from(files).sort();
}

export async function featureClassDiagram(
  feature: Feature,
  documentation: string,
  options = {} as BaseNavieOptions
): Promise<FeatureArtifact> {
  const navieOptions = baseNavieOptions(options);
  navieOptions.unshift('@diagram');

  const question = [
    ...navieOptions,
    `Create a class diagram for the feature "${featureSearchString(
      feature
    )}", using the provided documentation as a guide.`,
  ].join(' ');

  const diagram = await navie('.', question, {
    codeSelection: documentation,
  });
  return {
    content: diagram,
    question,
  };
}

export async function featureReadme(
  feature: Feature,
  options = {} as DocumentFeatureOptions
): Promise<FeatureArtifact> {
  const prompt = [README_PROMPT];
  if (options.prompt) prompt.push(options.prompt);

  const navieOptions = baseNavieOptions(options);
  navieOptions.unshift('@explain');

  const question = [...navieOptions, `Document the feature "${featureSearchString(feature)}"`].join(
    ' '
  );
  const promptStr = prompt.join('\n\n');

  const documentation = await navie('.', question, {
    prompt: promptStr,
  });

  return {
    content: documentation,
    question,
    prompt: promptStr,
  };
}

export default async function documentFeature(
  feature: Feature,
  options = {} as DocumentFeatureOptions
): Promise<FeatureDocumentation> {
  const readme = await featureReadme(feature, options);
  const context = await featureContext(feature, readme.content, options);
  const dependencyFiles = contextFiles(context);
  const classDiagram = await featureClassDiagram(feature, readme.content, options);
  return {
    readme,
    classDiagram,
    dependencyFiles,
  };
}
