import ScanError from './scanError';

/* eslint-disable no-restricted-syntax */
export default function scan(scanner) {
  return (events) => {
    const targets = [];
    const matches = [];
    const errors = [];
    for (const scope of scanner.scopes(events)) {
      for (const target of scope.targets()) {
        targets.push(target);
        for (const result of target.evaluate()) {
          if (result instanceof ScanError) {
            errors.push(result);
          } else {
            matches.push(result);
          }
        }
      }
    }
    return { targets, matches, errors };
  };
}
