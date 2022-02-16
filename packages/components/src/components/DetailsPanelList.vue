<template>
  <v-list
    class="v-details-panel-list"
    v-if="items && items.length > 0"
    :title="title"
  >
    <v-list-item
      v-for="(item, index) in filteredItems"
      :key="index"
      @click.native="selectItem(item)"
    >
      {{ nameOf(item.object) }}
      <span class="list-item__count" v-if="uniqueItems && item.count > 1">
        {{ item.count }}
      </span>
      <span
        class="list-item__event-quickview"
        v-if="eventQuickview"
        @click.stop="focusEvent(item)"
        title="View event in Trace view"
      >
        <EyeIcon />
      </span>
    </v-list-item>
  </v-list>
</template>

<script>
import EyeIcon from '@/assets/eye.svg';
import VList from '@/components/common/List.vue';
import VListItem from '@/components/common/ListItem.vue';
import { SELECT_OBJECT, SET_FOCUSED_EVENT } from '@/store/vsCode';

export default {
  name: 'v-details-panel-list',
  components: {
    EyeIcon,
    VList,
    VListItem,
  },
  props: {
    title: String,
    items: {
      type: Array,
      default: () => [],
    },
    uniqueItems: {
      type: Boolean,
      default: true,
    },
    nameKey: {
      type: String,
    },
    eventQuickview: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    nameOf(item) {
      if (this.nameKey) {
        return item[this.nameKey];
      }

      return item.prettyName || item.name || item.toString();
    },
    selectItem(item) {
      if (this.$store) {
        this.$store.commit(SELECT_OBJECT, item.object);
      }
    },
    focusEvent(item) {
      if (this.$store) {
        this.$store.commit(SET_FOCUSED_EVENT, item.object);
      }
    },
  },
  computed: {
    filteredItems() {
      if (!this.uniqueItems) {
        return this.items.map((item) => ({ object: item }));
      }

      return Object.values(
        this.items.reduce((memo, item) => {
          const { id } = item;
          let memoElement = memo[id];
          if (!memoElement) {
            memoElement = { object: item, count: 0 };
            memo[id] = memoElement; // eslint-disable-line no-param-reassign
          }
          memoElement.count += 1;
          return memo;
        }, {})
      );
    },
  },
};
</script>

<style scoped lang="scss">
.list-item__count {
  margin-left: 1rem;
  border-radius: 0.5rem;
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  line-height: 1;
  color: currentColor;
  background-color: rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

.list-item__event-quickview {
  margin-left: 1rem;
  padding: 0.25rem;
  color: $gray4;
  line-height: 0;
  cursor: pointer;

  &:hover,
  &:active {
    color: $gray5;
  }

  svg {
    width: 1rem;
    height: 1rem;
    fill: currentColor;
  }
}
</style>
