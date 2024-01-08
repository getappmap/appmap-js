import VConfigurationRequiredNotice from '@/components/notices/ConfigurationRequiredNotice.vue';
import { createWrapper, mount } from '@vue/test-utils';

describe('ConfigurationRequiredNotice.vue', () => {
  it('emits a `clink-link` event when the user clicks any link', () => {
    const wrapper = mount(VConfigurationRequiredNotice);
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
