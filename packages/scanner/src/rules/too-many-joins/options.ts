import MatchPatternConfig from '../../configuration/types/matchPatternConfig';
import { TooManyJoins } from '../types';

export default class Options implements TooManyJoins.Options {
  public warningLimit = 5;
  public excludeTables: MatchPatternConfig[] = [
    { match: /^pg_/, ignoreCase: false },
    { equal: 'information_schema', ignoreCase: false },
  ];
}
