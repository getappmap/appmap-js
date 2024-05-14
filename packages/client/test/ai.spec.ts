import { CreateUserMessage, UpdateAgentMessage } from '../dist/src';
import { AI, CreateAgentMessage, setConfiguration } from '../src';
import { UpdateUserMessage } from '../src/ai';

describe('ai', () => {
  const apiUrl = 'http://localhost:3000';
  const apiKey = 'test';

  beforeEach(() => setConfiguration({ apiURL: apiUrl, apiKey }));
  afterEach(() => jest.restoreAllMocks());

  const fetchJSON = (json: any) => () =>
    (global.fetch = jest.fn(() => ({ ok: true, json: () => json })) as any);

  describe('sendMessageFeedback', () => {
    beforeEach(fetchJSON({}));

    it('constructs an expected API call', async () => {
      const body = { messageId: 'messageId', sentiment: 1 };
      await AI.sendMessageFeedback(body.messageId, body.sentiment);
      expect(fetch).toHaveBeenCalledWith(`${apiUrl}/v1/ai/feedback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: body.messageId,
          sentiment: body.sentiment,
        }),
      });
    });
  });

  describe('createConversationThread', () => {
    beforeEach(fetchJSON({ id: 'the-id' }));

    it('constructs an expected API call', async () => {
      const metadata = {
        modelParameters: {},
        projectParameters: { directoryCount: 0, directories: [] },
      };
      const thread = await AI.createConversationThread(metadata);
      expect(thread.id).toEqual('the-id');
      expect(fetch).toHaveBeenCalledWith(`${apiUrl}/v1/ai/conversation-threads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });
    });
  });

  describe('create user message', () => {
    beforeEach(fetchJSON({ id: 'the-id' }));

    it('constructs an expected API call', async () => {
      const metadata: CreateUserMessage = { questionLength: 1 };
      const message = await AI.createUserMessage('threadId', metadata);
      expect(message.id).toEqual('the-id');
      expect(fetch).toHaveBeenCalledWith(`${apiUrl}/v1/ai/user-messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: 'threadId',
          metadata,
        }),
      });
    });
  });

  describe('update user message', () => {
    beforeEach(fetchJSON({}));

    it('constructs an expected API call', async () => {
      const metadata: UpdateUserMessage = {
        agentName: 'the-agent',
        classification: [{ name: 'architecture', weight: 'high' }],
      };
      await AI.updateUserMessage('messageId', metadata);
      expect(fetch).toHaveBeenCalledWith(`${apiUrl}/v1/ai/user-messages/messageId`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });
    });
  });

  describe('create agent message', () => {
    beforeEach(fetchJSON({ id: 'the-id' }));

    it('constructs an expected API call', async () => {
      const metadata: CreateAgentMessage = {};
      const message = await AI.createAgentMessage('threadId', metadata);
      expect(message.id).toEqual('the-id');
      expect(fetch).toHaveBeenCalledWith(`${apiUrl}/v1/ai/agent-messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: 'threadId',
          metadata,
        }),
      });
    });
  });

  describe('update agent message', () => {
    beforeEach(fetchJSON({}));

    it('constructs an expected API call', async () => {
      const metadata: UpdateAgentMessage = { responseLength: 1000, responseTime: 1000 };
      await AI.updateAgentMessage('messageId', metadata);
      expect(fetch).toHaveBeenCalledWith(`${apiUrl}/v1/ai/agent-messages/messageId`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });
    });
  });
});
