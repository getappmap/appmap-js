#!/usr/bin/env ts-node

import { readFile } from 'fs/promises';
import { exit } from 'process';
import { allRules } from './util';
import RuleInstance from '../src/ruleInstance';

(async function () {
  const noDocRules: string[] = [];
  Promise.all(
    (await allRules()).map(async (rule: RuleInstance) => {
      const name = rule.id;
      const docFileName = `./doc/rules/${name}.md`;
      try {
        await readFile(docFileName);
      } catch (err) {
        noDocRules.push(rule.id);
      }
    })
  ).then(() => {
    if (noDocRules.length > 0) {
      console.error(`Some rules aren't documented in doc/rules: ${noDocRules.join(', ')}`);
      exit(1);
    }
  });
})();
