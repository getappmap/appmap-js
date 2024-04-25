import { mount } from '@vue/test-utils';
import VContextItem from '@/components/chat-search/ContextItem.vue';

describe('ContextItem', () => {
  it('does not render content for sequence diagrams', () => {
    const contextItem = {
      type: 'sequence-diagram',
      location: 'app/models/user.rb:10',
      content: '@plantuml',
    };
    const wrapper = mount(VContextItem, {
      propsData: {
        contextItem,
      },
    });
    expect(wrapper.find('[data-cy="context-item-content"]').exists()).toBe(false);
  });
  it('renders content for other types', () => {
    const content = 'printf("Hello, world!\n");';
    const contextItem = {
      type: 'code-snippet',
      location: 'app/user.c:10',
      content,
    };
    const wrapper = mount(VContextItem, {
      propsData: {
        contextItem,
      },
    });
    expect(wrapper.find('[data-cy="context-item-content"]').text()).toContain(content);
  });
});
