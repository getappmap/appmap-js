#!/usr/bin/env ts-node

import { readFile } from 'fs/promises';
import { exit } from 'process';
import { Rule } from '../src/types';
import { allRules } from './util';

const labels = new Set<string>();
const noDocLabels: string[] = [];
(async function () {
  Promise.all(
    (await allRules()).map(async (rule: Rule) => {
      (rule.labels || []).forEach((label) => labels.add(label));
    })
  )
    .then(() =>
      Promise.all(
        [...labels].map(async (label) => {
          const docFileName = `./doc/labels/${label}.md`;
          try {
            await readFile(docFileName);
          } catch (err) {
            noDocLabels.push(label);
          }
        })
      )
    )
    .then(() => {
      if (noDocLabels.length > 0) {
        console.error(
          `Some labels aren't documented in doc/labels: ${noDocLabels.sort().join(', ')}`
        );
        exit(1);
      }
    });
})();
