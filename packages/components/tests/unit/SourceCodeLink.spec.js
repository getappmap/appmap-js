import { mount, createWrapper } from '@vue/test-utils';
import SourceCodeLink from '@/components/SourceCodeLink.vue';
import scenario from '@/stories/data/scenario.json';
import { buildAppMap } from '@appland/models';

describe('SourceCodeLink.vue', () => {
  it('view source emits an event from root', async () => {
    const appMap = buildAppMap(scenario).normalize().build();
    const event = appMap.events.find((e) => e.isCall() && e.path);
    const wrapper = mount(SourceCodeLink, {
      propsData: {
        object: event,
      },
    });
    const expected = {
      location: event.path,
      error: 'This is a warning',
      externalUrl: 'https://example.com',
    };

    wrapper.vm.$root.$emit('response-resolve-location', expected);

    await new Promise((resolve) => wrapper.vm.$nextTick(() => resolve()));

    wrapper.find('[data-cy="external-link"]').trigger('click');

    const rootWrapper = createWrapper(wrapper.vm.$root);
    const events = rootWrapper.emitted();
    const [[requestLocation]] = events['request-resolve-location'];
    expect(requestLocation).toBe(`${event.path}:${event.lineno}`);

    const [[{ location, externalUrl, error }]] = events.viewSource;
    expect(location).toBe(expected.location);
    expect(externalUrl).toBe(expected.externalUrl);
    expect(error).toBe(expected.error);
  });
});
