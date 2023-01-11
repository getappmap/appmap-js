export default interface CommandOptions {
  directory?: string;
  stateFile: string;
  verbose?: boolean;
  finding: string[];
  state: string;
  comment?: string;
}
