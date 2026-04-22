import VConfigurationRequiredNotice from '@/components/notices/ConfigurationRequiredNotice.vue';
import { mount } from '@vue/test-utils';
import eventBus from '@/lib/eventBus';

describe('ConfigurationRequiredNotice.vue', () => {
  it('emits a `clink-link` event when the user clicks any link', async () => {
    const wrapper = mount(VConfigurationRequiredNotice);
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
