export default interface CommandOptions {
  app?: string;
  appmapDir?: string;
  config: string;
  fail?: boolean;
  reportFile: string;
  upload: boolean;
  updateCommitStatus: boolean;
  verbose?: boolean;
}
