import { mount } from '@vue/test-utils';
import DetailsPanelClass from '@/components/DetailsPanelClass.vue';
import scenario from '@/stories/data/scenario.json';
import { store, SET_APPMAP_DATA, SELECT_OBJECT } from '@/store/vsCode';

store.commit(SET_APPMAP_DATA, scenario);
store.commit(SELECT_OBJECT, {
  kind: 'component',
  data: { id: 'Spree::BackendConfiguration' },
});

describe('DetailsPanelClass.vue', () => {
  it('class function have number of calls', () => {
    const selectedObject =
      store.state.selectionStack[store.state.selectionStack.length - 1];

    const wrapper = mount(DetailsPanelClass, {
      propsData: {
        objectDescriptor: selectedObject.object,
      },
      store,
    });

    expect(wrapper.find('.list-item').text()).toMatch('menu_items');
    expect(wrapper.find('.list-item__count').text()).toMatch('3');
  });
});
