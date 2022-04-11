import { mount, createWrapper } from '@vue/test-utils';
import DetailsPanelEvent from '@/components/DetailsPanelEvent.vue';
import scenario from '@/stories/data/scenario.json';
import { store, SET_APPMAP_DATA } from '@/store/vsCode';
import { Event } from '@appland/models';

store.commit(SET_APPMAP_DATA, scenario);

function sqlEvent(sql, database) {
  const event = new Event({
    id: 1,
    event: 'call',
    sql_query: {
      database_type: database,
      sql,
    },
  });
  event.link(new Event({ id: 2, event: 'return' }));
  return event;
}

describe('DetailsPanelEvent.vue', () => {
  it('formats SQL using the database hints', () => {
    const wrapper = mount(DetailsPanelEvent, {
      propsData: {
        object: sqlEvent(
          'INSERT INTO "misago_themes_css" ("theme_id", "name", "url", "source_file", "source_hash", "source_needs_building", "build_file", "build_hash", "size", "order", "modified_on") VALUES (279, \'test\', \'https://cdn.example.com/style.css\', \'\', NULL, false, \'\', NULL, 0, 0, \'2021-11-18T04:32:10.691674+00:00\'::timestamptz) RETURNING "misago_themes_css"."id"',
          'postgresql'
        ),
      },
      store,
    });

    expect(wrapper.text()).toContain('    "theme_id"');
  });

  it('renders SQL as-is upon failure to format', () => {
    const expectedText =
      'INSERT INTO "misago_themes_css" ("theme_id", "name", "url", "source_file", "source_hash", "source_needs_building", "build_file", "build_hash", "size", "order", "modified_on") VALUES (279, \'test\', \'https://cdn.example.com/style.css\', \'\', NULL, false, \'\', NULL, 0, 0, \'2021-11-18T04:32:10.691674+00:00\'::timestamptz) RETURNING "misago_themes_css"."id"';
    const wrapper = mount(DetailsPanelEvent, {
      propsData: {
        object: sqlEvent(expectedText, 'sql'),
      },
      store,
    });

    expect(wrapper.text()).toContain(expectedText);
  });

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
