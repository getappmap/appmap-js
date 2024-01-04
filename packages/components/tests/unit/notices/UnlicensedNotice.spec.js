import VUnlicensedNotice from '@/components/notices/UnlicensedNotice.vue';
import { createWrapper, mount } from '@vue/test-utils';

describe('UnlicensedNotice.vue', () => {
  it('emits a `clink-link` event when the user clicks the CTA', () => {
    const purchaseUrl = 'https://example.com/purchase';
    const wrapper = mount(VUnlicensedNotice, { propsData: { purchaseUrl } });
    const rootWrapper = createWrapper(wrapper.vm.$root);

    wrapper.find('[data-cy="purchase"]').trigger('click');

    const events = rootWrapper.emitted('click-link');
    expect(events).toBeArrayOfSize(1);
    expect(events[0][0]).toBe(purchaseUrl);
  });

  it('does not render a purchase button if the purchase URL is not provided', () => {
    const wrapper = mount(VUnlicensedNotice);
    expect(wrapper.find('[data-cy="purchase"]').exists()).toBe(false);
  });

  it('emits a `clink-link` event when the user clicks any link', () => {
    const wrapper = mount(VUnlicensedNotice);
    const rootWrapper = createWrapper(wrapper.vm.$root);

    const allLinks = wrapper.findAll('a[href]');
    allLinks.trigger('click');

    const events = rootWrapper.emitted('click-link');
    expect(events).toBeArrayOfSize(allLinks.length);

    const links = events.map(([href]) => href);
    expect(links).toEqual([
      'https://appmap.io/slack',
      'https://appmap.io/docs',
      'mailto:support@appmap.io',
    ]);
  });
});
