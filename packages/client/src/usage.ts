import { Metadata } from '@appland/models';
import { ServiceEndpoint } from './configuration';
import makeRequest from './makeRequest';

interface UsageDescription {
  readonly usage: number;
  readonly limit: number;
}

interface ErrorResponse {
  statusCode: number;
  message: string;
}

export interface UsageReport {
  readonly events: UsageDescription;
  readonly appmaps: UsageDescription;
  readonly contributors: UsageDescription;
  readonly cycleStart: Date | null;
  readonly cycleEnd: Date | null;
}

export interface UsageUpdateDto {
  readonly events?: number;
  readonly appmaps?: number;
  readonly contributors?: number;
  readonly metadata?: Metadata;
  readonly ci?: boolean;
}

export default class Usage {
  private static readonly usagePath = 'v1/usage';

  static async get(): Promise<UsageReport> {
    const response = await makeRequest({
      service: ServiceEndpoint.ServiceApi,
      path: this.usagePath,
    });

    const responseJson = JSON.parse(response.body.toString('utf-8')) as UsageReport | ErrorResponse;
    if (!response.ok) {
      if ('message' in responseJson) throw new Error(responseJson.message);
      throw new Error(`Got unexpected status code ${response.statusCode}`);
    }

    return responseJson as UsageReport;
  }

  static async update(dto: UsageUpdateDto): Promise<void> {
    // Consider this to be a no-op if there's nothing to report.
    if (!dto.events && !dto.appmaps) return;

    await makeRequest({
      service: ServiceEndpoint.ServiceApi,
      path: this.usagePath,
      method: 'POST',
      body: JSON.stringify(dto),
      retry: false,
    });
  }
}
