import { mount, createWrapper } from '@vue/test-utils';
import DetailsPanelEvent from '@/components/DetailsPanelEvent.vue';
import scenario from '@/stories/data/scenario.json';
import { store, SET_APPMAP_DATA } from '@/store/vsCode';

store.commit(SET_APPMAP_DATA, scenario);

describe('DetailsPanelEvent.vue', () => {
  it('view source emits an event from root', () => {
    const wrapper = mount(DetailsPanelEvent, {
      propsData: {
        objectDescriptor: store.state.appMap.events.find((e) => e.isCall() && e.codeObject),
      },
      store,
    });

    wrapper
      .findComponent({ ref: 'viewSource' })
      .trigger('click');

    const rootWrapper = createWrapper(wrapper.vm.$root);
    expect(rootWrapper.emitted().viewSource).toBeTruthy();
  });
});
