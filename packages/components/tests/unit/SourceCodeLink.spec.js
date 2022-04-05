import { mount, createWrapper } from '@vue/test-utils';
import SourceCodeLink from '@/components/SourceCodeLink.vue';
import scenario from '@/stories/data/scenario.json';
import { buildAppMap } from '@appland/models';

describe('SourceCodeLink.vue', () => {
  it('view source emits an event from root', () => {
    const appMap = buildAppMap(scenario).normalize().build();
    const event = appMap.events.find((e) => e.isCall() && e.path);
    const wrapper = mount(SourceCodeLink, {
      propsData: {
        object: event,
      },
    });

    requestAnimationFrame(() => {
      wrapper.vm.$root.$emit('response-resolve-location', {
        location: event.path,
        external: true,
      });

      wrapper.find('[data-cy="external-link"]').trigger('click');

      const rootWrapper = createWrapper(wrapper.vm.$root);
      const events = rootWrapper.emitted();
      const [[requestLocation]] = events['request-resolve-location'];
      expect(requestLocation).toBe(event.path);

      const [[location]] = events.viewSource;
      expect(location).toBe(event.path);
    });
  });
});
