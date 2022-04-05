import { mount, createWrapper } from '@vue/test-utils';
import DetailsPanelEvent from '@/components/DetailsPanelEvent.vue';
import scenario from '@/stories/data/scenario.json';
import { store, SET_APPMAP_DATA } from '@/store/vsCode';

store.commit(SET_APPMAP_DATA, scenario);

describe('DetailsPanelEvent.vue', () => {
  it('HTTP events display response values', () => {
    const event = store.state.appMap.events.find(
      (e) => e.http_server_response && e.http_server_response.mime_type
    ).callEvent;

    const wrapper = mount(DetailsPanelEvent, {
      propsData: {
        object: event,
      },
      store,
    });

    /* eslint-disable camelcase */
    const { mime_type, status } = event.returnEvent.http_server_response;

    expect(wrapper.text()).toContain('HTTP response');
    expect(wrapper.text()).toContain(mime_type);
    expect(wrapper.text()).toContain(status);
    /* eslint-enable camelcase */
  });
});
