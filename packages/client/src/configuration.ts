export enum ServiceEndpoint {
  AppLandApi = 'baseURL',
  ServiceApi = 'apiURL',
}

export default interface Configuration {
  baseURL: string;
  apiURL: string;
  apiKey?: string;
  username?: string;
}

export function getServiceUrl(configuration: Configuration, service: ServiceEndpoint): string {
  return configuration[service];
}
