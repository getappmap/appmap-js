import { mount, createWrapper } from '@vue/test-utils';
import FilterMenu from '@/components/FilterMenu.vue';
import {
  store,
  SET_SAVED_FILTERS,
  SET_SELECTED_SAVED_FILTER,
  DEFAULT_FILTER_NAME,
} from '@/store/vsCode';
import data from './fixtures/user_page_scenario.appmap.json';
import { buildAppMap, AppMapFilter } from '@appland/models';

const defaultFilter = {
  filterName: DEFAULT_FILTER_NAME,
  state: 'eyJmaWx0ZXJzIjp7fX0',
  default: true,
};

const savedFilters = [
  defaultFilter,
  {
    filterName: 'another test',
    state: 'eyJmaWx0ZXJzIjp7ImxpbWl0Um9vdEV2ZW50cyI6ZmFsc2UsImhpZGVVbmxhYmVsZWQiOnRydWV9fQ',
    default: false,
  },
  {
    filterName: 'filter',
    state:
      'eyJmaWx0ZXJzIjp7ImxpbWl0Um9vdEV2ZW50cyI6ZmFsc2UsImhpZGVNZWRpYVJlcXVlc3RzIjpmYWxzZSwiaGlkZUVsYXBzZWRUaW1lVW5kZXIiOjF9fQ',
    default: false,
  },
];

const filterToSave = {
  filterName: 'test',
  state: 'eyJmaWx0ZXJzIjp7ImhpZGVFbGFwc2VkVGltZVVuZGVyIjoxfX0',
};

store.commit(SET_SAVED_FILTERS, savedFilters);

describe('FilterMenu.vue', () => {
  let clipboardText;
  Object.assign(navigator, {
    clipboard: {
      async writeText(val) {
        clipboardText = val;
        return Promise.resolve();
      },
      async readText() {
        return Promise.resolve(clipboardText);
      },
    },
  });

  let wrapper; // Wrapper<Vue>
  let rootWrapper; // Wrapper<Vue>

  beforeEach(() => {
    const filter = new AppMapFilter();
    const appMap = buildAppMap().source(data).normalize().build();
    const propsData = { filteredAppMap: filter.filter(appMap) };
    const mocks = { navigator };
    store.commit(SET_SELECTED_SAVED_FILTER, defaultFilter);
    wrapper = mount(FilterMenu, { propsData, store, mocks });
    rootWrapper = createWrapper(wrapper.vm.$root);
  });

  it('emits the correct event when deleting', () => {
    expect(rootWrapper.emitted()['deleteFilter']).toBeUndefined();
    expect(wrapper.find('option:checked').text()).toBe('AppMap default');
    wrapper.find('select.filters__select').findAll('option').at(1).setSelected();
    expect(wrapper.find('option:checked').text()).toBe('another test');
    wrapper.find('[data-cy="delete-filter-button"]').trigger('click');
    expect(rootWrapper.emitted()['deleteFilter']).toBeArrayOfSize(1);
    expect(rootWrapper.emitted()['deleteFilter']).toMatchObject([[savedFilters[1]]]);
  });

  it('emits the correct event when setting as default', () => {
    expect(rootWrapper.emitted()['defaultFilter']).toBeUndefined();
    expect(wrapper.find('option:checked').text()).toBe('AppMap default');
    wrapper.find('select.filters__select').findAll('option').at(1).setSelected();
    expect(wrapper.find('option:checked').text()).toBe('another test');
    wrapper.find('[data-cy="default-filter-button"]').trigger('click');
    expect(rootWrapper.emitted()['defaultFilter']).toBeArrayOfSize(1);
    expect(rootWrapper.emitted()['defaultFilter']).toMatchObject([[savedFilters[1]]]);
  });

  it('copies the state to the clipboard', async () => {
    expect(wrapper.find('option:checked').text()).toBe('AppMap default');
    wrapper.find('[data-cy="copy-filter-button"]').trigger('click');
    const actualClipboardText = await navigator.clipboard.readText();
    expect(actualClipboardText).toBe(defaultFilter.state);
  });

  it('emits the correct event when saving', () => {
    expect(rootWrapper.emitted()['saveFilter']).toBeUndefined();
    wrapper.findAll('label.filters__checkbox').at(2).trigger('click');
    wrapper.find('input.filters__input').setValue('test');
    expect(wrapper.find('input.filters__input').element.value).toBe('test');
    wrapper.find('[data-cy="save-filter-button"]').trigger('click');
    expect(rootWrapper.emitted()['saveFilter']).toBeArrayOfSize(1);
    expect(rootWrapper.emitted()['saveFilter']).toMatchObject([[filterToSave]]);
  });
});
