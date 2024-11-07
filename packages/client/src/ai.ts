import { io } from 'socket.io-client';
import AIClient, { Callbacks } from './aiClient';
import { getConfiguration } from './loadConfiguration';

/**
 * When a conversation is created, the AppMap service reports the permissions assigned to the user,
 * directly or through an organization to which they belong.
 */
export type Permissions = {
  useNavieAIProxy: boolean;
};

/**
 * An activity record for the user, indicating how many conversations were created over a given
 * time period.
 */
export type ConversationCount = {
  daysAgo: number;
  count: number;
};

/**
 * The usage report for a given user, which is reported back to the user when a conversation is
 * created.
 */
export type Usage = {
  conversationCounts: ConversationCount[];
};

/**
 * Model parameters are reported to the AppMap service when a conversation is created.
 */
export type ModelParameters = {
  baseUrl?: string;
  model?: string;
  aiKeyName?: string;
};

/**
 * Project directory information is reported to the AppMap service when a conversation is created.
 */
export type ProjectDirectory = {
  hasAppMapConfig: boolean;
  language?: string;
};

/**
 * The parameters for a project, which are reported to the AppMap service when a conversation is
 * created.
 */
export type ProjectParameters = {
  directoryCount: number;
  codeEditor?: string;
  directories: ProjectDirectory[];
};

/**
 * A specific product to which the user is subscribed.
 */
export type SubscriptionItem = {
  productName: string;
};

/**
 * A record of all subscriptions for a given user, along with the date on which they were first
 * enrolled.
 */
export type Subscription = {
  enrollmentDate: Date;
  subscriptions: SubscriptionItem[];
};

/**
 * These parameters are passed from Navie Client to the Navie Service when a new conversation is
 * created.
 */
export type CreateConversationThread = {
  modelParameters: ModelParameters;
  projectParameters: ProjectParameters;
};

/**
 * This information is reported back to the Navie Client when a conversation is created.
 */
export type ConversationThread = {
  id: string;
  permissions: Permissions;
  usage: Usage;
  subscription: Subscription;
};

export type UserMessage = {
  id: string;
};

export type AgentMessage = {
  id: string;
};

export type Classification = {
  name: string;
  weight: string;
};

export type CreateUserMessage = {
  questionLength?: number;
  codeSelectionLength?: number;
};

/**
 * When a user message is reported to the AppMap service, the agent name (aka command name) and
 * automatically assigned classifications are reported.
 *
 * The agent name will be one of the published Navie commands, such as @explain, @diagram, @plan,
 * @generate, @test, @search, @review, and @help.
 *
 * Classifications are question categories that are assigned by Navie to help the AI respond
 * in the most appropriate way. Classifications are single words like overview, architecture,
 * troubleshoot, feature, generate-diagram, generate-code, explain, and help.
 */
export type UpdateUserMessage = {
  agentName?: string;
  classification?: Classification[];
};

export type CreateAgentMessage = Record<string, never>;

export type UpdateAgentMessage = {
  responseLength?: number;
  responseTime?: number;
};

// eslint-disable-next-line unicorn/no-static-only-class
export default class AI {
  static async connect(callbacks: Callbacks): Promise<AIClient> {
    const configuration = getConfiguration();
    if (!configuration.apiKey) {
      throw new Error('Authentication required');
    }

    const socket = io(configuration.apiURL.replace(/^http/, 'ws'), {
      transports: ['websocket'],
      path: '/v1/ai/conversation',
      reconnection: false,
      auth: {
        token: configuration.apiKey,
      },
    });

    return new Promise((resolve, reject) => {
      socket.on('connect', () => {
        resolve(new AIClient(socket, callbacks));
      });
      socket.on('connect_error', (error) => {
        reject(error);
      });
    });
  }

  static async createConversationThread(
    metadata: CreateConversationThread
  ): Promise<ConversationThread> {
    const response = await this.apiRequest(
      'POST',
      'create conversation thread',
      'v1/ai/conversation-threads',
      metadata
    );
    return response.json() as unknown as ConversationThread;
  }

  static async createUserMessage(
    threadId: string,
    metadata: CreateUserMessage
  ): Promise<UserMessage> {
    const response = await this.createMessage(threadId, 'user', 'user-messages', metadata);
    return response.json() as unknown as UserMessage;
  }

  static async updateUserMessage(messageId: string, metadata: UpdateUserMessage) {
    await this.updateMessage(messageId, 'user', 'user-messages', metadata);
  }

  static async createAgentMessage(
    threadId: string,
    metadata: CreateAgentMessage
  ): Promise<AgentMessage> {
    const response = await this.createMessage(threadId, 'agent', 'agent-messages', metadata);
    return response.json() as unknown as AgentMessage;
  }

  static async updateAgentMessage(messageId: string, metadata: UpdateAgentMessage) {
    await this.updateMessage(messageId, 'agent', 'agent-messages', metadata);
  }

  static async sendMessageFeedback(messageId: string, sentiment: number) {
    await this.apiRequest('POST', 'send feedback', `v1/ai/feedback`, { messageId, sentiment });
  }

  protected static async createMessage<T>(
    threadId: string,
    role: string,
    endpoint: string,
    metadata: T
  ): Promise<Response> {
    return this.apiRequest('POST', `create ${role} message`, `v1/ai/${endpoint}`, {
      threadId,
      metadata,
    });
  }

  protected static async updateMessage<T>(
    messageId: string,
    role: string,
    endpoint: string,
    metadata: T
  ): Promise<void> {
    await this.apiRequest(
      'PATCH',
      `update ${role} message`,
      `v1/ai/${endpoint}/${messageId}`,
      metadata
    );
  }

  protected static async apiRequest<T>(
    method: string,
    description: string,
    urlPath: string,
    body?: T
  ): Promise<Response> {
    const configuration = getConfiguration();
    if (!configuration.apiKey) {
      throw new Error('Authentication required');
    }

    const url = `${configuration.apiURL}/${urlPath}`;
    const headers = {
      Authorization: `Bearer ${configuration.apiKey}`,
      'Content-Type': 'application/json',
    };
    const options = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      let reason = '(unknown reason)';
      try {
        reason = await response.text();
      } catch {
        // Ignore errors from reading the response text
      }
      throw new Error(`Failed to ${description}: ${reason}`);
    }

    return response;
  }
}
