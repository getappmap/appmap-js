import VContextContainer from '@/components/chat/ContextContainer.vue';
import { mount } from '@vue/test-utils';

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
});
