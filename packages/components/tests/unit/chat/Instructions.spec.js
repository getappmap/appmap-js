import VInstructions from '@/components/chat-search/Instructions.vue';
import { mount, createWrapper } from '@vue/test-utils';

describe('components/chat-search/Instructions.vue', () => {
  const appmaps = Array.from({ length: 3 }).map((_, i) => ({
    name: 'appmap' + i,
    path: 'path' + i,
    createdAt: new Date(2020, 0, i + 1).toUTCString(),
    recordingMethod: 'tests',
  }));

  describe('when appmapYmlPresent is false', () => {
    it('informs the user no config is present', () => {
      const wrapper = mount(VInstructions, {});

      expect(wrapper.find('[data-cy="alert-no-config"]').exists()).toBe(true);
      expect(wrapper.find('[data-cy="alert-success"]').exists()).toBe(false);
      expect(wrapper.find('[data-cy="alert-no-data"]').exists()).toBe(false);
    });
  });

  describe('when appmapYmlPresent is true', () => {
    describe('with AppMaps', () => {
      it('informs the user no data are present', () => {
        const wrapper = mount(VInstructions, {
          propsData: {
            appmapYmlPresent: true,
          },
        });

        expect(wrapper.find('[data-cy="alert-no-config"]').exists()).toBe(false);
        expect(wrapper.find('[data-cy="alert-success"]').exists()).toBe(false);
        expect(wrapper.find('[data-cy="alert-no-data"]').exists()).toBe(true);
      });
    });

    describe('without AppMaps', () => {
      it('informs the user what code objects are available', () => {
        const numTables = 1;
        const numRoutes = 2;
        const numClasses = 3;
        const numPackages = 4;
        const wrapper = mount(VInstructions, {
          propsData: {
            appmapStats: {
              numAppMaps: appmaps.length,
              tables: Array.from({ length: numTables }),
              routes: Array.from({ length: numRoutes }),
              classes: Array.from({ length: numClasses }),
              packages: Array.from({ length: numPackages }),
            },
            appmapYmlPresent: true,
            appmaps,
          },
        });

        expect(wrapper.find('[data-cy="alert-no-config"]').exists()).toBe(false);
        expect(wrapper.find('[data-cy="alert-success"]').exists()).toBe(true);
        expect(wrapper.find('[data-cy="alert-no-data"]').exists()).toBe(false);

        const stats = wrapper.find('[data-cy="stats"]');
        expect(stats.text()).toMatch(new RegExp(`${numTables}\\s+distinct SQL tables`));
        expect(stats.text()).toMatch(new RegExp(`${numRoutes}\\s+distinct HTTP routes`));
        expect(stats.text()).toMatch(new RegExp(`${numClasses}\\s+classes`));
        expect(stats.text()).toMatch(new RegExp(`${numPackages}\\s+packages`));
      });
    });
  });

  describe('Most recent AppMap recordings', () => {
    it('displays a list of the most recent AppMap recordings', () => {
      const wrapper = mount(VInstructions, {
        propsData: {
          appmapYmlPresent: true,
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
          appmapYmlPresent: true,
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
