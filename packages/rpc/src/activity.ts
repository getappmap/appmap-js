export namespace ActivityRpc {
  export namespace V1 {
    export namespace Settings {
      export const SetMethod = 'v1.activity.settings.set';
      export type SetParams = {
        baseBranch?: string;
        intervalSeconds?: number;
      };
      export type SetResponse = {};

      export const GetMethod = 'v1.activity.settings.get';
      export type GetParams = {};
      export type GetResponse = {
        baseBranch: string | undefined;
        intervalSeconds: number;
      };
    }

    export namespace Current {
      export const Method = 'v1.activity.current';
      export type Params = {};

      export type ProjectState = {
        projectDirectory: string;
        commit: string;
        branch: string;
        baseBranch: string;
        diffs: string[];
        diffDigest: string;
      };

      export type Response = {
        name: string;
        title: string;
        description: string;
        projectStates: ProjectState[];
        digest: string;
      };
    }

    export namespace Suggest {
      export namespace Tests {
        export const Method = 'v1.activity.suggest.tests';
        export type Params = {
          keywords?: string;
          codeSelection?: string;
          paths?: string[];
          baseBranch?: string;
          tokenLimit?: number;
          limit?: number;
        };
        export type SuggestedTest = {
          location: string;
          description: string;
        };
        export type Response = SuggestedTest[];
      }
    }

    export namespace FileAccess {
      export const OpenMethod = 'v1.activity.fileAccess.open';
      export type Params = {
        location: string;
      };
      export type Response = {};

      export const ViewMethod = 'v1.activity.fileAccess.view';
      export type ViewParams = {
        location: string;
      };

      export const EditMethod = 'v1.activity.fileAccess.edit';
      export type EditParams = {
        location: string;
      };

      export const CloseMethod = 'v1.activity.fileAccess.close';
      export type CloseParams = {
        location: string;
      };

      export const DeleteMethod = 'v1.activity.fileAccess.delete';
      export type DeleteParams = {
        location: string;
      };
    }
  }
}
