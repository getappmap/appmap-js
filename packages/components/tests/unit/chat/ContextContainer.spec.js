import VContextContainer from '@/components/chat/ContextContainer.vue';
import { createWrapper, mount } from '@vue/test-utils';

describe('components/chat/ContextContainer.vue', () => {
  it('renders pinned state', async () => {
    let wrapper = mount(VContextContainer, { provide: { pinnedItems: [{ handle: 0 }] } });
    expect(wrapper.find('[data-cy="pin"][data-pinned]').exists()).toBe(true);

    wrapper = mount(VContextContainer);
    expect(wrapper.find('[data-cy="pin"]:not([data-pinned])').exists()).toBe(true);
  });

  it('emits pin event', async () => {
    const wrapper = mount(VContextContainer);
    await wrapper.find('[data-cy="pin"]').trigger('click');

    const events = wrapper.emitted().pin;
    expect(events).toStrictEqual([[{ pinned: true, handle: wrapper.vm.valueHandle }]]);
  });

  it('opens a non-collapsible file item', async () => {
    const location = '/home/user/my-project/app/models/user.rb';
    const wrapper = mount(VContextContainer, {
      propsData: {
        language: 'javascript',
        location,
        isFile: true,
        isCollapsible: false,
      },
    });

    const rootWrapper = createWrapper(wrapper.vm.$root);
    await wrapper.find('[data-cy="open"]').trigger('click');

    const actual = rootWrapper.emitted()['open-location'];
    expect(actual).toHaveLength(1);
    expect(actual[0][0]).toStrictEqual(location);
  });
});
