import VContextContainer from '@/components/chat/ContextContainer.vue';
import { createWrapper, mount } from '@vue/test-utils';

describe('components/chat/ContextContainer.vue', () => {
  it('renders pinned state', async () => {
    const uri = 'urn:uuid:0';
    let wrapper = mount(VContextContainer, {
      propsData: { uri },
      provide: { pinnedItems: [{ uri }] },
    });
    expect(wrapper.find('[data-cy="pin"][data-pinned]').exists()).toBe(true);

    await wrapper.setProps({ uri: 'urn:uuid:1' });
    expect(wrapper.find('[data-cy="pin"]:not([data-pinned])').exists()).toBe(true);
  });

  it('emits pin event', async () => {
    const wrapper = mount(VContextContainer, { propsData: { uri: 'urn:uuid:0' } });
    await wrapper.find('[data-cy="pin"]').trigger('click');

    const events = wrapper.emitted().pin;
    expect(events).toStrictEqual([[{ pinned: true, uri: wrapper.vm.valueUri }]]);
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
