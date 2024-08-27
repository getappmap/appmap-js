export namespace FileRpc {
  export const UpdateFunctionName = 'file.update';

  export type UpdateOptions = {
    file: string;
    modified: string;
    original?: string;
  };

  export type UpdateResponse = {
    exists: boolean;
    succeeded: boolean;
    original?: string;
    modified?: string;
  };
}
