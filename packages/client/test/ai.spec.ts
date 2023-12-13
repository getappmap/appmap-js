import { AI, setConfiguration } from '../src';

describe('ai', () => {
  describe('sendMessageFeedback', () => {
    const apiUrl = 'http://localhost:3000';
    const apiKey = 'test';
    beforeEach(() => {
      setConfiguration({ apiURL: apiUrl, apiKey });
      global.fetch = jest.fn(() => ({ ok: true })) as any;
    });

    afterEach(() => {
      (fetch as jest.Mock).mockClear();
    });

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
});
