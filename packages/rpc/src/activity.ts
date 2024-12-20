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
      export namespace Tasks {
        export const Method = 'v1.activity.suggest.tasks';
        export type TaskOption = {
          name: string;
          value: string | number;
        };
        export type TaskType =
          | 'explain'
          | 'document'
          | 'plan'
          | 'generate'
          | 'diagram'
          | 'test'
          | 'review';
        export type Task = {
          id: string;
          type: TaskType;
          prompt: string;
          options: TaskOption[];
          temperature?: number;
          modelName?: string;
          elapsedTime?: number;
        };
        export type Params = {
          taskId?: string;
          taskTypes?: TaskType[];
          prompt?: string;
          codeSelection?: string;
        };
        export type Response = {
          tasks: string[];
        };
      }

      export namespace Tests {
        export const Method = 'v1.activity.suggest.tests';
        export type Params = {
          taskId?: string;
          prompt?: string;
          codeSelection?: string;
          paths?: string[];
          keywords?: string[];
        };
        export type SuggestedTest = {
          location: string;
          description: string;
        };
        export type Response = SuggestedTest[];
      }
    }

    export namespace FileAccessEvent {
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
