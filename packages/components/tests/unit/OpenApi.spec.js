import { mount, createWrapper } from '@vue/test-utils';
import OpenApi from '@/pages/install-guide/OpenApi.vue';

describe('OpenApi.vue', () => {
  let wrapper;
  let rootWrapper;

  describe('with appmaps', () => {
    beforeEach(() => {
      wrapper = mount(OpenApi, {
        propsData: { numHttpRequests: 10, numAppMaps: 10 },
        stubs: {
          'v-navigation': true,
        },
      });
      rootWrapper = createWrapper(wrapper.vm.$root);
    });

    it('emits an event when the generate button is clicked', () => {
      expect(rootWrapper.emitted()['generate-openapi']).toBeUndefined();
      wrapper.get('[data-cy="generate-openapi"]').trigger('click');
      expect(rootWrapper.emitted()['generate-openapi']).toBeArrayOfSize(1);
    });
  });

  describe('without appmaps', () => {
    beforeEach(() => {
      wrapper = mount(OpenApi, {
        propsData: { numHttpRequests: 0, numAppMaps: 0 },
        stubs: {
          'v-navigation': true,
        },
      });
      rootWrapper = createWrapper(wrapper.vm.$root);
    });

    it('emits an event when opting to record appmaps', () => {
      const event = 'open-instruction';
      expect(rootWrapper.emitted()[event]).toBeUndefined();
      wrapper.get('[data-cy="record-appmaps"]').trigger('click');
      expect(rootWrapper.emitted()[event]).toBeArrayOfSize(1);
      expect(rootWrapper.emitted()[event][0]).toContain('record-appmaps');
    });
  });
});
