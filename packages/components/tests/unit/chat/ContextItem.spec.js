import { createWrapper, mount } from '@vue/test-utils';
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
  it('renders content for other types', async () => {
    const content = 'printf("Hello, world!\\n");';
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
    await wrapper.find('[data-cy="context-header"]').trigger('click');
    expect(wrapper.text()).toContain(content);
  });
  it('emits an event when the user clicks to open the location', () => {
    const location = 'app/models/user.rb:10';
    const directory = '/home/user/land-of-apps/sample_app_6th_ed';
    const contextItem = {
      location,
      directory,
      type: 'code-snippet',
      content: '# frozen_string_literal: true\n',
    };
    const wrapper = mount(VContextItem, {
      propsData: {
        contextItem,
      },
    });

    wrapper.find('[data-cy="context-item"] [data-cy="open"]').trigger('click');

    const rootWrapper = createWrapper(wrapper.vm.$root);
    const events = rootWrapper.emitted('open-location');
    expect(events).toHaveLength(1);
    expect(events[0]).toStrictEqual([location, directory]);
  });
  it('renders Windows paths correctly', () => {
    const wrapper = mount(VContextItem, {
      propsData: {
        contextItem: {
          type: 'data-request',
          location: 'C:\\Users\\Me\\Projects\\AppMap\\app\\controllers\\users_controller.rb:43',
          content: '# frozen_string_literal: true\n',
          directory: 'C:\\Users\\Me\\Projects\\AppMap',
        },
      },
    });
    expect(wrapper.find('[data-cy="context-item-header"]').text()).toBe('users controller');
  });
});
