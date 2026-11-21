import { readFileSync } from 'fs';

// A deliberately small, dependency-free executable Gherkin subset. Unknown
// grammar/steps fail rather than being ignored. Each scenario executes in order.
export function scenarios(file: string): { name: string; steps: string[] }[] {
  const result: { name: string; steps: string[] }[] = [];
  let current: (typeof result)[number] | undefined;
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('Feature:')) continue;
    if (line.startsWith('Scenario:')) {
      current = { name: line.slice('Scenario:'.length).trim(), steps: [] };
      result.push(current);
    } else if (/^(Given|When|Then|And) /.test(line) && current) current.steps.push(line);
    else if (current) throw new Error(`Unsupported Gherkin: ${line}`);
  }
  if (!result.length || result.some((s) => !s.steps[0]?.startsWith('Given ')))
    throw new Error('Gherkin scenarios require Given steps');
  return result;
}
