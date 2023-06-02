import VFilterMenu from '@/components/FilterMenu.vue';
import {
  buildStore,
  SET_APPMAP_DATA,
  SET_SAVED_FILTERS,
  SET_SELECTED_FILTER,
} from '@/store/vsCode';
import scenario from './data/scenario.json';
import savedFilters from './data/saved_filters.js';

const store = buildStore();
store.commit(SET_APPMAP_DATA, scenario);
store.commit(SET_SAVED_FILTERS, savedFilters);
store.commit(SET_SELECTED_FILTER, savedFilters[0]);
const filteredAppMap = store.state.appMap;

export default {
  title: 'Pages/VS Code',
  component: VFilterMenu,
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VFilterMenu },
  template:
    '<v-filter-menu v-bind="$props" :style="{ color: \'white\', backgroundColor: \'#242c41\' }" />',
  store,
});

export const filterMenu = Template.bind({});
filterMenu.args = { filteredAppMap };
