import VInstructions from '@/components/chat-search/Instructions.vue';
import { mount } from '@vue/test-utils';
import eventBus from '@/lib/eventBus';

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
        props: {
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

    it('emits an event when clicking an AppMap', async () => {
      const wrapper = mount(VInstructions, {
        props: {
          appmaps,
        },
      });

      const spy = jest.fn();
      eventBus.on('open-appmap', spy);

      const listItems = wrapper.findAll('[data-cy="appmap-list-item"]');
      await Promise.all(listItems.map((item) => item.trigger('click')));

      expect(spy).toHaveBeenCalledTimes(appmaps.length);
      spy.mock.calls.forEach(([path], i) => {
        expect(path).toBe(`path${i}`);
      });
      eventBus.off('open-appmap', spy);
    });
  });
});
