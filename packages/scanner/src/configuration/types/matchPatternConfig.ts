export default interface MatchPatternConfig {
  ignoreCase: boolean;
  match?: RegExp;
  include?: string;
  equal?: string;
}
