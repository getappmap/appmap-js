import * as _ from 'lodash';

export const unique = (arr1: string[], arr2: string[]): string[] => _.sortBy(_.uniq(arr1.concat(arr2)));
