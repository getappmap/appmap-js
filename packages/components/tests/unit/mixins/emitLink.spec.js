import VVsCodeExtension from '@/pages/VsCodeExtension.vue';
import { createWrapper, mount } from '@vue/test-utils';

describe('UnlicensedNotice.vue', () => {
  it('only binds click handlers once', () => {
    // The VsCodeExtension component includes this Mixin, and so does
    // the unlicensed notice. Meaning, the click handlers should attempt
    // to bind twice, and we should only bind once.
    const wrapper = mount(VVsCodeExtension, { propsData: { isLicensed: false } });
    const rootWrapper = createWrapper(wrapper.vm.$root);

    const allLinks = wrapper.findAll('a[href]');
    allLinks.trigger('click');

    const events = rootWrapper.emitted('click-link');

    // If they'd been bound twice, we'd have twice as many events.
    expect(events).toBeArrayOfSize(allLinks.length);
  });
});
