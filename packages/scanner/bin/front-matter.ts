#!/usr/bin/env ts-node

import { readFile, writeFile } from 'fs/promises';
import { dump } from 'js-yaml';

import { Rule } from '../src/types';
import { allRules } from './util';

function toTitleWord(word: string): string {
  if (['http', 'rpc', 'sql'].includes(word.toLowerCase())) {
    return word.toUpperCase();
  }
  return word;
}

type LabelFrontMatter = {
  name: string;
  rules: string[];
};

type RuleFrontMatter = {
  rule: string;
  name: string;
  title: string;
  impactDomain: string;
  impactSubdomains: string[];
  scope?: string;
  labels?: string[];
  references?: any;
};

async function writeFrontMatter(docFileName: string, frontMatter: any) {
  const docFile = (await readFile(docFileName)).toString();
  const docFileTokens = docFile.split('---');
  const docBody = docFileTokens[docFileTokens.length - 1];
  const newDocBody = ['', '\n' + dump(frontMatter), docBody].join('---');
  writeFile(docFileName, newDocBody);
}

const labelRules: Record<string, Rule[]> = {};

(async function () {
  Promise.all(
    (await allRules()).map(async (rule: Rule) => {
      (rule.labels || []).forEach((label) => {
        if (!labelRules[label]) labelRules[label] = [];

        labelRules[label].push(rule);
      });

      const ruleWords = rule.id.split('-');
      const ruleFirstWord = ruleWords[0];
      const frontMatter: RuleFrontMatter = {
        rule: rule.id,
        name: [
          toTitleWord([ruleFirstWord[0].toUpperCase(), ruleFirstWord.substring(1)].join('')),
          ruleWords.slice(1).map(toTitleWord).join(' '),
        ].join(' '),
        title: rule.title,
        impactDomain: rule.impactDomain,
        impactSubdomains: rule.impactSubdomains,
      };
      if (rule.references) {
        frontMatter.references = Object.keys(rule.references).reduce((memo, name) => {
          memo[name] = rule.references![name].toString();
          return memo;
        }, {} as Record<string, string>);
      }
      if (rule.labels) {
        frontMatter.labels = rule.labels;
      }
      if (rule.scope) {
        frontMatter.scope = rule.scope;
      }
      return writeFrontMatter(`./doc/rules/${rule.id}.md`, frontMatter);
    })
  ).then(() =>
    Promise.all(
      Object.keys(labelRules).map((label) => {
        const frontMatter: LabelFrontMatter = {
          name: label,
          rules: labelRules[label].map((rule) => rule.id),
        };
        return writeFrontMatter(`./doc/labels/${label}.md`, frontMatter);
      })
    )
  );
})();
