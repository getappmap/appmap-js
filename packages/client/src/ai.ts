import { io } from 'socket.io-client';
import AIClient, { Callbacks } from './aiClient';
import { getConfiguration } from './loadConfiguration';

export type Permissions = {
  useNavieAIProxy: boolean;
};

export type ConversationCount = {
  daysAgo: number;
  count: number;
};

export type Usage = {
  conversationCounts: ConversationCount[];
};

export type ModelParameters = {
  baseUrl?: string;
  model?: string;
  aiKeyName?: string;
};

export type ProjectDirectory = {
  hasAppMapConfig: boolean;
  language?: string;
};

export type ProjectParameters = {
  directoryCount: number;
  codeEditor?: string;
  directories: ProjectDirectory[];
};

export type SubscriptionItem = {
  productName: string;
};

export type Subscription = {
  enrollmentDate: Date;
  subscriptions: SubscriptionItem[];
};

export type CreateConversationThread = {
  modelParameters: ModelParameters;
  projectParameters: ProjectParameters;
};

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
