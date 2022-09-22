/* eslint-disable max-classes-per-file */
import { AppMap as AppMapDataType, Metadata as MetadataDataType } from '@appland/models';
import { IncomingMessage } from 'http';
import FormData from 'form-data';
import assert from 'assert';
import reportJSON from './reportJson';
import get from './get';
import { RetryOptions } from './retryOptions';
import retry from './retry';
import buildRequest from './buildRequest';
import retryOnError from './retryOnError';
import retryOn503 from './retryOn503';
import { errorMessage } from './handleError';
import reportJson from './reportJson';

// Returned when the AppMap is uploaded.
export type UploadAppMapResponse = {
  uuid: string;
};

// returned when the AppMap is accepted but the user needs to go login.
// If set, the user should be directed to /scenario_uploads/{upload_id} with the token as a parameter.
export type UploadAppMapPendingResponse = {
  upload_id: string;
  token: string;
};

export type UploadCreateAppMapResponse = {
  completed?: UploadAppMapResponse;
  pending?: UploadAppMapPendingResponse;
};

export type CreateAppMapOptions = {
  app?: string;
  metadata?: MetadataDataType;
};

type PerformUploadOptions = {
  path: string;
  requireApiKey: boolean;
};

export default class AppMap {
  constructor(public uuid: string) {}

  async get(): Promise<AppMapDataType> {
    const requestPath = ['api/appmaps', this.uuid].join('/');
    return get(requestPath).then((response) => reportJSON<AppMapDataType>(response));
  }

  static async create(
    data: Buffer,
    options: CreateAppMapOptions,
    retryOptions: RetryOptions = {}
  ): Promise<UploadAppMapResponse> {
    const response = await AppMap.performCreate(
      { path: 'api/appmaps', requireApiKey: true },
      data,
      options,
      retryOptions
    );
    assert(response.completed, 'AppMap.create.completed is undefined');
    return response.completed;
  }

  static async createUpload(
    data: Buffer,
    options: CreateAppMapOptions,
    retryOptions: RetryOptions = {}
  ): Promise<UploadCreateAppMapResponse> {
    return AppMap.performCreate(
      { path: 'api/appmaps/create_upload', requireApiKey: false },
      data,
      options,
      retryOptions
    );
  }

  protected static async performCreate(
    performOptions: PerformUploadOptions,
    data: Buffer,
    options: CreateAppMapOptions,
    retryOptions: RetryOptions = {}
  ): Promise<UploadCreateAppMapResponse> {
    const makeRequest = async (): Promise<IncomingMessage> => {
      const retrier = retry(`Upload AppMap`, retryOptions, makeRequest);
      const form = new FormData();
      form.append('data', data.toString());
      if (options.metadata) {
        form.append('metadata', JSON.stringify(options.metadata));
      }
      if (options.app) {
        form.append('app', options.app);
      }
      const request = await buildRequest(performOptions.path, performOptions.requireApiKey);
      return new Promise<IncomingMessage>((resolve, reject) => {
        const interaction = request.requestFunction(
          request.url,
          {
            method: 'POST',
            headers: {
              ...request.headers,
              ...form.getHeaders(),
            },
          },
          resolve
        );
        interaction.on('error', retryOnError(retrier, resolve, reject));
        form.pipe(interaction);
      }).then(retryOn503(retrier));
    };

    const handleUpload = async (response: IncomingMessage): Promise<UploadCreateAppMapResponse> => {
      const appmap = await reportJson<UploadAppMapResponse>(response);
      return { completed: appmap };
    };

    const handleRedirect = async (
      response: IncomingMessage
      // eslint-disable-next-line consistent-return
    ): Promise<UploadCreateAppMapResponse | undefined> => {
      if (!response.statusCode) {
        throw new Error('No status code was provided by the server');
      }

      const { location } = response.headers;
      const { statusCode } = response;
      if (statusCode >= 400) {
        const error = await errorMessage(statusCode, response);
        throw new Error(error);
      }

      if (statusCode >= 300 && statusCode <= 399 && location) {
        const uploadPending = await reportJson<UploadAppMapPendingResponse>(response);
        return {
          pending: uploadPending,
        };
      }
    };

    return makeRequest().then(
      async (response) => (await handleRedirect(response)) || (await handleUpload(response))
    );
  }
}
