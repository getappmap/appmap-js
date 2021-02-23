/* eslint-disable no-restricted-syntax */

import { AuthenticationMissing } from './authenticationMissing';
import { IllegalPackageDependency } from './illegalPackageDependency';
import { QueryFromView } from './queryFromView';
import scan from './scan';

export default function applandScans() {
  const scanners = [
    new AuthenticationMissing(),
    new QueryFromView(),
    new IllegalPackageDependency('SQL', ['app/models']),
  ];

  // eslint-disable-next-line func-names
  return function (events) {
    // eslint-disable-next-line prefer-arrow-callback
    return scanners.reduce((accumulator, scanner) => {
      const { targets, matches, errors } = scan(scanner)(events);
      accumulator.push({ scanner, targets, matches, errors });
      return accumulator;
    }, []);
  };
}
