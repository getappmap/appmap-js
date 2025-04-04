import VPinnedItems from '@/components/chat-search/PinnedItems.vue';
import { mount } from '@vue/test-utils';

describe('components/chat-search/PinnedItems.vue', () => {
  it('shows pinning help when no pinned items', () => {
    const wrapper = mount(VPinnedItems);

    expect(wrapper.find('[data-cy="pinned-items-notice"]').exists()).toBe(true);
  });

  it("doesn't show pinning help with pinned items", () => {
    const wrapper = mount(VPinnedItems, {
      propsData: {
        pinnedItems: [{ uri: 'urn:uuid:0', content: '...' }],
      },
    });

    expect(wrapper.find('[data-cy="pinned-items-notice"]').exists()).toBe(false);
  });
});
