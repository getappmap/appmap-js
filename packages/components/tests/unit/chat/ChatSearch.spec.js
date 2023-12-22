import VChatSearch from '@/pages/ChatSearch.vue';
import { createWrapper, mount } from '@vue/test-utils';

describe('ChatSearch.vue', () => {
  it('can be resized', async () => {
    const wrapper = mount(VChatSearch);
    const lhsPanel = wrapper.find('[data-cy="resize-left"]');
    Object.defineProperty(lhsPanel.element, 'offsetWidth', { value: 300 });

    const resizeHandle = wrapper.find('[data-cy="resize-handle"]');
    const resizeBy = 100;

    resizeHandle.trigger('mousedown');
    resizeHandle.trigger('mousemove', { clientX: 0 });
    await wrapper.vm.$nextTick();
    const initialWidth = Number.parseInt(lhsPanel.element.style.width.replace('px', ''), 10);

    resizeHandle.trigger('mousemove', { clientX: resizeBy });
    await wrapper.vm.$nextTick();
    const newWidth = Number.parseInt(lhsPanel.element.style.width.replace('px', ''), 10);

    expect(newWidth).toBe(initialWidth + resizeBy);
  });

  it('makes expected RPC calls when the user asks a question', async () => {
    const searchResponse = {
      results: [
        {
          appmap: 'example.appmap.json',
          events: [],
          score: 1.0,
        },
      ],
    };
    const messagesCalled = {
      explain: [(cb) => cb(null, null, 'requestId')],
      'explain.status': [
        (cb) => cb(null, null, { step: 'build-vector-terms' }),
        (cb) =>
          cb(null, null, {
            step: 'explain',
            searchResponse,
          }),
        (cb) =>
          cb(null, null, {
            step: 'complete',
            searchResponse,
            explaination: 'Contact IT',
          }),
      ],
      'appmap.metadata': [(cb) => cb(null, null, {})],
      'appmap.data': [(cb) => cb(null, null, '{}')],
    };
    const wrapper = mount(VChatSearch, {
      propsData: {
        appmapRpcFn: (method, _, callback) => messagesCalled[method].shift()(callback),
      },
    });

    await wrapper.vm.sendMessage('How do I reset my password?', () => {});
    await wrapper.vm.$nextTick();

    Object.values(messagesCalled).forEach((calls) => {
      // Callbacks are consumed on use, so we expect the array to be empty
      expect(calls).toBeArrayOfSize(0);
    });
  });
});
