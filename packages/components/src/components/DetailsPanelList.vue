<template>
  <div class="v-details-panel-list" v-if="items && items.length > 0">
    <h5>{{ title }}</h5>
    <ul>
      <li
        class="list-item"
        v-for="(item, index) in filteredItems"
        :key="index"
        @click="selectItem(item)"
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
      </li>
    </ul>
  </div>
</template>

<script>
import EyeIcon from '@/assets/eye.svg';
import { SELECT_OBJECT, SET_FOCUSED_EVENT } from '@/store/vsCode';

export default {
  name: 'v-details-panel-list',
  components: {
    EyeIcon,
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
.v-details-panel-list {
  list-style-type: none;
  padding: 0;
  margin: 0 -1rem 1.5rem;

  h5 {
    border-bottom: 1px solid #333a4d;
    color: $base03;
    font-size: 0.75rem;
    font-weight: 700;
    line-height: 1.4;
    margin: 0;
    padding: 0.25rem 1rem;
    text-transform: uppercase;
  }

  ul {
    list-style-type: none;
    padding: 0;
    margin-bottom: 1.5rem;
    margin-top: 0;

    .list-item {
      position: relative;
      border-bottom: 1px solid #333a4d;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.25rem 1rem;
      min-height: 2rem;
      font-size: 0.9em;
      color: $light-purple;
      cursor: pointer;
      overflow: hidden;
      z-index: 0;

      &:hover,
      &:active {
        color: $light-purple2;
      }

      &__count {
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

      &__event-quickview {
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
    }

    li {
      border-bottom: 1px solid $base15;
      transition: $transition;

      &:hover,
      &:active {
        color: $base06;
      }
    }
  }
}
</style>
