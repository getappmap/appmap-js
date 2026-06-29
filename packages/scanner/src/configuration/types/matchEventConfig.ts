import type MatchPatternConfig from './matchPatternConfig';

type PropertyName = 'id' | 'type' | 'fqid' | 'query' | 'route';

export default interface MatchEventConfig {
  property: PropertyName;
  test: MatchPatternConfig;
}
