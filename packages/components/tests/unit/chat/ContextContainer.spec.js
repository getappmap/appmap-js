import VContextContainer from '@/components/chat/ContextContainer.vue';
import { mount } from '@vue/test-utils';
import eventBus from '@/lib/eventBus';

describe('components/chat/ContextContainer.vue', () => {
  it('renders pinned state', async () => {
    const uri = 'urn:uuid:0';
    let wrapper = mount(VContextContainer, {
      props: { uri },
      global: { provide: { pinnedItems: [{ uri }] } },
    });
    expect(wrapper.find('[data-cy="pin"][data-pinned]').exists()).toBe(true);

    await wrapper.setProps({ uri: 'urn:uuid:1' });
    expect(wrapper.find('[data-cy="pin"]:not([data-pinned])').exists()).toBe(true);
  });

  it('emits pin event', async () => {
    const wrapper = mount(VContextContainer, { props: { uri: 'urn:uuid:0' } });
    await wrapper.find('[data-cy="pin"]').trigger('click');

    const events = wrapper.emitted().pin;
    expect(events).toStrictEqual([[{ pinned: true, uri: wrapper.vm.valueUri }]]);
  });

  it('opens a non-collapsible file item', async () => {
    const location = '/home/user/my-project/app/models/user.rb';
    const wrapper = mount(VContextContainer, {
      props: {
        language: 'javascript',
        location,
        isFile: true,
        isCollapsible: false,
      },
    });

    const spy = jest.fn();
    eventBus.on('open-location', spy);
    await wrapper.find('[data-cy="open"]').trigger('click');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(location);
    eventBus.off('open-location', spy);
  });
});
