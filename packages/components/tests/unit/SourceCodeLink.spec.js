import { mount } from '@vue/test-utils';
import SourceCodeLink from '@/components/SourceCodeLink.vue';
import scenario from '@/stories/data/scenario.json';
import { buildAppMap } from '@appland/models';
import eventBus from '@/lib/eventBus';

describe('SourceCodeLink.vue', () => {
  it('view source emits an event from root', async () => {
    const appMap = buildAppMap(scenario).normalize().build();
    const event = appMap.events.find((e) => e.isCall() && e.path);
    const wrapper = mount(SourceCodeLink, {
      props: {
        object: event,
      },
    });
    const expected = {
      location: event.path,
      error: 'This is a warning',
      externalUrl: 'https://example.com',
    };

    const requestSpy = jest.fn();
    const viewSourceSpy = jest.fn();
    eventBus.on('request-resolve-location', requestSpy);
    eventBus.on('viewSource', viewSourceSpy);

    eventBus.emit('response-resolve-location', expected);

    await new Promise((resolve) => wrapper.vm.$nextTick(() => resolve()));

    wrapper.find('[data-cy="external-link"]').trigger('click');

    expect(requestSpy).toHaveBeenCalledWith(`${event.path}:${event.lineno}`);
    const [[{ location, externalUrl, error }]] = viewSourceSpy.mock.calls;
    expect(location).toBe(expected.location);
    expect(externalUrl).toBe(expected.externalUrl);
    expect(error).toBe(expected.error);

    eventBus.off('request-resolve-location', requestSpy);
    eventBus.off('viewSource', viewSourceSpy);
  });
});
