export default interface CommandOptions {
  verbose?: boolean;
  directory?: string;
  mergeKey: string;
  app?: string;
  fail?: boolean;
  updateCommitStatus: boolean;
}
