import VChat from '@/pages/Chat.vue';
import VChatSearch from '@/pages/ChatSearch.vue';
import { mount } from '@vue/test-utils';
import { setConfiguration, loadConfiguration } from '@appland/client';

describe('Authentication', () => {
  const apiKey = 'apiKey';
  const apiUrl = 'apiUrl';
  const rpcClient = {
    listModels: jest.fn().mockResolvedValue([]),
    getModelConfig: jest.fn().mockResolvedValue([]),
    register: jest.fn().mockResolvedValue({
      thread: {
        id: 'uuid',
        permissions: { useNavieAIProxy: true },
        usage: { conversationCounts: [] },
        subscription: { subscriptions: [] },
      },
    }),
    configuration: jest.fn().mockResolvedValue({ projectDirectories: [] }),
    listMethods: jest.fn().mockResolvedValue([]),
    metadataV1: jest.fn().mockResolvedValue({}),
    thread: {
      subscribe: jest.fn().mockResolvedValue({ on: jest.fn().mockReturnThis() }),
    },
  };

  beforeEach(() => {
    setConfiguration({
      apiKey: undefined,
      apiURL: undefined,
    });
  });

  it('authenticates Chat', async () => {
    const wrapper = mount(VChat, {
      propsData: { apiKey, apiUrl },
      data: () => ({ rpcClient }),
    });
    await wrapper.vm.$nextTick();
    expect(loadConfiguration()).toStrictEqual({
      apiKey,
      apiURL: apiUrl,
      baseURL: expect.any(String),
    });
  });

  it('authenticates ChatSearch', async () => {
    const wrapper = mount(VChatSearch, {
      propsData: { apiKey, apiUrl },
      data: () => ({ rpcClient }),
    });
    await wrapper.vm.$nextTick();
    expect(loadConfiguration()).toStrictEqual({
      apiKey,
      apiURL: apiUrl,
      baseURL: expect.any(String),
    });
  });
});
