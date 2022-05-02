import { lstatSync, readdir } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { Rule } from '../src/types';

export async function allRules(): Promise<Rule[]> {
  const fileRules = await Promise.all(
    (await promisify(readdir)('./src/rules'))
      .filter(isRuleFile)
      .map(async (ruleFile) => (await import(ruleFilePath('..', ruleFile))).default)
  );

  const dirRules = await Promise.all(
    (await promisify(readdir)('./src/rules')).filter(isRuleDir).map(async (ruleDir) => {
      const rule = (await import(ruleFilePath('..', ruleDir, 'metadata.ts'))).default;
      rule.id = ruleDir;
      return rule;
    })
  );

  return [...fileRules, ...dirRules];
}

function isRuleFile(ruleFile: string): boolean {
  return !lstatSync(ruleFilePath('.', ruleFile)).isDirectory() && ruleFile !== 'types.d.ts';
}

function isRuleDir(ruleFile: string): boolean {
  return (
    lstatSync(ruleFilePath('.', ruleFile)).isDirectory() &&
    !['.', '..', 'lib'].includes(ruleFile) &&
    isRuleFile(join(ruleFile, 'metadata.ts'))
  );
}

function ruleFilePath(prefix: string, ...ruleFiles: string[]): string {
  return `${prefix}/src/rules/${join(...ruleFiles)}`;
}
