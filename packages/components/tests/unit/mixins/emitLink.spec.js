import VVsCodeExtension from '@/pages/VsCodeExtension.vue';
import { mount } from '@vue/test-utils';
import eventBus from '@/lib/eventBus';

describe('UnlicensedNotice.vue', () => {
  it('only binds click handlers once', async () => {
    // The VsCodeExtension component includes this Mixin, and so does
    // the unlicensed notice. Meaning, the click handlers should attempt
    // to bind twice, and we should only bind once.
    const wrapper = mount(VVsCodeExtension, { props: { isLicensed: false } });
    const spy = jest.fn();
    eventBus.on('click-link', spy);

    const allLinks = wrapper.findAll('a[href]');
    await Promise.all(allLinks.map((link) => link.trigger('click')));

    // If they'd been bound twice, we'd have twice as many events.
    expect(spy).toHaveBeenCalledTimes(allLinks.length);
    eventBus.off('click-link', spy);
  });
});
