import { mount } from '@vue/test-utils';
import DetailsPanelList from '@/components/DetailsPanelList.vue';

describe('DetailsPanelList.vue', () => {
  it('displays the number of unique calls', () => {
    const items = {
      a: { id: 'a', name: 'itemA' },
      b: { id: 'b', name: 'itemB' },
    };

    const wrapper = mount(DetailsPanelList, {
      propsData: {
        items: [items.a, items.a, items.a, items.b],
        uniqueItems: true,
        nameKey: 'name',
      },
    });

    expect(wrapper.get('.list-item').text()).toMatch('itemA');
    expect(wrapper.get('.list-item__count').text()).toMatch('3');
  });
});
