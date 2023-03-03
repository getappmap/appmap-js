import makeRequest from './makeRequest';
import loadConfiguration, { DefaultURL as ProductionUrl } from './loadConfiguration';

export enum SubscriptionFeature {
  OpenApi = 'openapi',
  Analysis = 'analysis',
}

export enum SubscriptionEntity {
  User = 'user',
  System = 'system',
}

interface SubscriptionResponse {
  readonly features: ReadonlyArray<SubscriptionFeature>;
  readonly entities: ReadonlyArray<SubscriptionEntity>;
  readonly expires_at: string;
}

export interface UsageReport {
  readonly feature: SubscriptionFeature;
  readonly entity: SubscriptionEntity;
  readonly usage: Record<string, unknown>;
}

export default class Subscription {
  private static readonly indexPath = 'api/subscriptions';
  private static readonly usagePath = 'api/subscriptions/usage';
  private readonly config = loadConfiguration();

  static async get(): Promise<Subscription | undefined> {
    try {
      const response = await makeRequest({ path: this.indexPath });
      if (!response.ok) {
        throw new Error(`Received unexpected status code ${response.statusCode}`);
      }

      const responseJson = JSON.parse(response.body.toString('utf-8')) as SubscriptionResponse;

      return new Subscription(
        responseJson.features,
        responseJson.entities,
        new Date(responseJson.expires_at)
      );
    } catch {
      return new Subscription();
    }
  }

  static async reportUsage(
    feature: SubscriptionFeature,
    entity: SubscriptionEntity,
    usage: Record<string, unknown>
  ): Promise<void> {
    try {
      await makeRequest({
        path: this.usagePath,
        method: 'POST',
        body: JSON.stringify({
          feature,
          entity,
          usage,
        }),
        retry: false,
      });
    } catch {
      // for the time being, do nothing.
    }
  }

  constructor(
    public readonly features?: ReadonlyArray<SubscriptionFeature>,
    public readonly entities?: ReadonlyArray<SubscriptionEntity>,
    public readonly expiresAt?: Date
  ) {}

  entitledTo(feature: SubscriptionFeature): boolean {
    return this.features !== undefined && this.features.includes(feature);
  }

  hasSeatType(entity: SubscriptionEntity): boolean {
    return this.entities !== undefined && this.entities.includes(entity);
  }

  get active(): boolean {
    return this.expiresAt !== undefined && this.expiresAt > new Date();
  }

  get authentic(): boolean {
    try {
      const { baseURL, apiKey } = this.config;
      if (baseURL !== ProductionUrl) return false;
      if (typeof apiKey !== 'string') return false;

      const [userLogin, userKey] = Buffer.from(apiKey, 'base64').toString('utf-8').split(':');
      if (!userLogin || userLogin.length === 0) return false;
      return Boolean(
        userKey && /[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[\da-f]{4}-[\da-f]{12}/.test(userKey)
      );
    } catch {
      return false;
    }
  }
}
