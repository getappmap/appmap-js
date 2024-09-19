import VContext from '@/components/chat-search/Context.vue';
import { mount } from '@vue/test-utils';

describe('components/chat-search/Context.vue', () => {
  it('shows Navie help when empty', () => {
    const wrapper = mount(VContext);

    expect(wrapper.find('[data-cy="context-notice"]').exists()).toBe(true);
  });

  it("doesn't show Navie help when there's something in the context", () => {
    const wrapper = mount(VContext, {
      propsData: {
        contextResponse: [
          {
            type: 'sequence-diagram',
          },
        ],
      },
    });

    expect(wrapper.find('[data-cy="context-notice"]').exists()).toBe(false);
  });
});
