import MatchPatternConfig from '../../configuration/types/matchPatternConfig';

export default class Options {
  public warningLimit = 5;
  public excludeTables: MatchPatternConfig[] = [
    { match: /^pg_/, ignoreCase: false },
    { match: /^information_schema$/, ignoreCase: true },
  ];
}
