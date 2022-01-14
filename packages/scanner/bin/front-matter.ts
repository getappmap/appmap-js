#!/usr/bin/env ts-node

import { lstatSync, readdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { dump } from 'js-yaml';

import { Rule } from '../src/types';

function isRuleFile(ruleFile: string): boolean {
  return !lstatSync(ruleFilePath('.', ruleFile)).isDirectory() && ruleFile !== 'types.d.ts';
}

function ruleFilePath(prefix: string, ruleFile: string): string {
  return `${prefix}/src/rules/${ruleFile}`;
}

function toTitleWord(word: string): string {
  if (['http', 'rpc', 'sql'].includes(word.toLowerCase())) {
    return word.toUpperCase();
  }
  return word;
}

type FrontMatter = {
  id: string;
  name: string;
  title: string;
  impactDomain?: string;
  scope?: string;
  labels?: string[];
  references?: any;
};

Promise.all(
  readdirSync('./src/rules')
    .filter(isRuleFile)
    .map(async (ruleFileName: string) => {
      const rule: Rule = (await import(ruleFilePath('..', ruleFileName))).default;
      const name = ruleFileName.split('.')[0];
      const ruleWords = rule.id.split('-');
      const ruleFirstWord = ruleWords[0];
      const frontMatter: FrontMatter = {
        id: rule.id,
        name: [
          toTitleWord([ruleFirstWord[0].toUpperCase(), ruleFirstWord.substring(1)].join('')),
          ruleWords.slice(1).map(toTitleWord).join(' '),
        ].join(' '),
        title: rule.title,
      };
      if (rule.references) {
        frontMatter.references = Object.keys(rule.references).reduce((memo, name) => {
          memo[name] = rule.references![name].toString();
          return memo;
        }, {} as Record<string, string>);
      }
      if (rule.impactDomain) {
        frontMatter.impactDomain = rule.impactDomain;
      }
      if (rule.labels) {
        frontMatter.labels = rule.labels;
      }
      if (rule.scope) {
        frontMatter.scope = rule.scope;
      }
      const docFileName = `./doc/rules/${name}.md`;
      const docFile = (await readFile(docFileName)).toString();
      const docFileTokens = docFile.split('---');
      const docBody = docFileTokens[docFileTokens.length - 1];
      const newDocBody = ['', '\n' + dump(frontMatter), docBody].join('---');
      writeFile(docFileName, newDocBody);
    })
);
