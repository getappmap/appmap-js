import VInstructions from '@/components/chat-search/Instructions.vue';
import { mount, createWrapper } from '@vue/test-utils';

describe('components/chat-search/Instructions.vue', () => {
  const appmaps = Array.from({ length: 3 }).map((_, i) => ({
    name: 'appmap' + i,
    path: 'path' + i,
    createdAt: new Date(2020, 0, i + 1).toUTCString(),
    recordingMethod: 'tests',
  }));

  describe('Most recent AppMap recordings', () => {
    it('displays a list of the most recent AppMap recordings', () => {
      const wrapper = mount(VInstructions, {
        propsData: {
          appmaps,
        },
      });

      const listItems = wrapper.findAll('[data-cy="appmap-list-item"]');
      expect(listItems.length).toBe(appmaps.length);
      listItems.wrappers.forEach((item, i) => {
        expect(item.find('[data-cy="name"]').text()).toBe('appmap' + i);
        expect(item.find('[data-cy="time"]').text()).toBe(`1/${i + 1}/2020, 12:00:00 AM`);
      });
    });

    it('emits an event when clicking an AppMap', () => {
      const wrapper = mount(VInstructions, {
        propsData: {
          appmaps,
        },
      });

      const listItems = wrapper.findAll('[data-cy="appmap-list-item"]');
      listItems.wrappers.forEach((item, i) => {
        item.trigger('click');
      });

      const rootWrapper = createWrapper(wrapper.vm.$root);
      const emitted = rootWrapper.emitted('open-appmap');
      expect(emitted).toHaveLength(appmaps.length);
      emitted.forEach((path, i) => {
        expect(path).toStrictEqual([`path${i}`]);
      });
    });
  });
});
