#!/usr/bin/env ts-node

import { readFile } from 'fs/promises';
import { exit } from 'process';
import { allRules } from './util';

const noDocRules: string[] = [];
Promise.all(
  allRules().map(async (ruleFileName: string) => {
    const name = ruleFileName.split('.')[0];
    const docFileName = `./doc/rules/${name}.md`;
    try {
      await readFile(docFileName);
    } catch (err) {
      noDocRules.push(ruleFileName);
    }
  })
).then(() => {
  if (noDocRules.length > 0) {
    console.error(`Some rules aren't documented in doc/rules: ${noDocRules.join(', ')}`);
    exit(1);
  }
});
