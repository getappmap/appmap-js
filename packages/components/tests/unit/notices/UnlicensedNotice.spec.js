import VUnlicensedNotice from '@/components/notices/UnlicensedNotice.vue';
import { mount } from '@vue/test-utils';
import eventBus from '@/lib/eventBus';

describe('UnlicensedNotice.vue', () => {
  it('emits a `clink-link` event when the user clicks the CTA', async () => {
    const purchaseUrl = 'https://example.com/purchase';
    const wrapper = mount(VUnlicensedNotice, { props: { purchaseUrl } });
    const spy = jest.fn();
    eventBus.on('click-link', spy);

    await wrapper.find('[data-cy="purchase"]').trigger('click');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(purchaseUrl);
    eventBus.off('click-link', spy);
  });

  it('does not render a purchase button if the purchase URL is not provided', () => {
    const wrapper = mount(VUnlicensedNotice);
    expect(wrapper.find('[data-cy="purchase"]').exists()).toBe(false);
  });

  it('emits a `clink-link` event when the user clicks any link', async () => {
    const wrapper = mount(VUnlicensedNotice);
    const spy = jest.fn();
    eventBus.on('click-link', spy);

    const allLinks = wrapper.findAll('a[href]');
    await Promise.all(allLinks.map((link) => link.trigger('click')));

    expect(spy).toHaveBeenCalledTimes(allLinks.length);

    const links = spy.mock.calls.map(([href]) => href);
    expect(links).toEqual([
      'https://appmap.io/slack',
      'https://appmap.io/docs',
      'mailto:support@appmap.io',
    ]);
    eventBus.off('click-link', spy);
  });
});
