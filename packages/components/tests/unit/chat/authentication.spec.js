import VChat from '@/pages/Chat.vue';
import VChatSearch from '@/pages/ChatSearch.vue';
import { mount } from '@vue/test-utils';
import { setConfiguration, loadConfiguration } from '@appland/client';

describe('Authentication', () => {
  const apiKey = 'apiKey';
  const apiUrl = 'apiUrl';

  beforeEach(() => {
    setConfiguration({
      apiKey: undefined,
      apiURL: undefined,
    });
  });

  it('authenticates Chat', async () => {
    const wrapper = mount(VChat, { propsData: { apiKey, apiUrl } });
    await wrapper.vm.$nextTick();
    expect(loadConfiguration()).toStrictEqual({
      apiKey,
      apiURL: apiUrl,
      baseURL: expect.any(String),
    });
  });

  it('authenticates ChatSearch', async () => {
    const wrapper = mount(VChatSearch, { propsData: { apiKey, apiUrl, appmapRpcFn: () => true } });
    await wrapper.vm.$nextTick();
    expect(loadConfiguration()).toStrictEqual({
      apiKey,
      apiURL: apiUrl,
      baseURL: expect.any(String),
    });
  });
});
