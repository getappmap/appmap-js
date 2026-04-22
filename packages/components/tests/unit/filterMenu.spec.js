import { mount } from '@vue/test-utils';
import eventBus from '@/lib/eventBus';
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

  let wrapper;

  beforeEach(() => {
    const filter = new AppMapFilter();
    const appMap = buildAppMap().source(data).normalize().build();
    store.commit(SET_SELECTED_SAVED_FILTER, defaultFilter);
    wrapper = mount(FilterMenu, {
      props: { filteredAppMap: filter.filter(appMap) },
      global: { plugins: [store], mocks: { navigator } },
    });
  });

  it('emits the correct event when deleting', async () => {
    const spy = jest.fn();
    eventBus.on('deleteFilter', spy);
    expect(wrapper.find('option:checked').text()).toBe('AppMap default');
    wrapper.find('select.filters__select').findAll('option').at(1).setSelected();
    expect(wrapper.find('option:checked').text()).toBe('another test');
    await wrapper.find('[data-cy="delete-filter-button"]').trigger('click');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(savedFilters[1]);
    eventBus.off('deleteFilter', spy);
  });

  it('emits the correct event when setting as default', async () => {
    const spy = jest.fn();
    eventBus.on('defaultFilter', spy);
    expect(wrapper.find('option:checked').text()).toBe('AppMap default');
    wrapper.find('select.filters__select').findAll('option').at(1).setSelected();
    expect(wrapper.find('option:checked').text()).toBe('another test');
    await wrapper.find('[data-cy="default-filter-button"]').trigger('click');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(savedFilters[1]);
    eventBus.off('defaultFilter', spy);
  });

  it('copies the state to the clipboard', async () => {
    expect(wrapper.find('option:checked').text()).toBe('AppMap default');
    wrapper.find('[data-cy="copy-filter-button"]').trigger('click');
    const actualClipboardText = await navigator.clipboard.readText();
    expect(actualClipboardText).toBe(defaultFilter.state);
  });

  it('emits the correct event when saving', async () => {
    const spy = jest.fn();
    eventBus.on('saveFilter', spy);
    wrapper.findAll('label.filters__checkbox').at(2).trigger('click');
    wrapper.find('input.filters__input').setValue('test');
    expect(wrapper.find('input.filters__input').element.value).toBe('test');
    await wrapper.find('[data-cy="save-filter-button"]').trigger('click');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(filterToSave);
    eventBus.off('saveFilter', spy);
  });
});
