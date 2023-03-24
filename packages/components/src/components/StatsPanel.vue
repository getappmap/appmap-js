<template>
  <div class="stats-panel" data-cy="stats-panel">
    <div class="heading">
      <h1><StatsIconLg />Stats</h1>
      <CloseIcon class="close-me" @click.stop="closeStatsPanel" />
    </div>

    <ul class="stats-table">
      <li>
        <ul class="stats-row row-header">
          <li>
            <strong data-cy="function-header" @click="updateSorting('function')">Function</strong>
          </li>
          <li><strong data-cy="count-header" @click="updateSorting('count')">Count</strong></li>
          <li>
            <strong data-cy="size-header" @click="updateSorting('size')">Size on disk</strong>
          </li>
          <li class="location">
            <strong data-cy="location-header" @click="updateSorting('location')">Location</strong>
          </li>
        </ul>
      </li>
      <li class="pruned-row">
        <ul class="stats-row pruned">
          <li><HiddenIcon />function:activerecord/ActiveRecord::Relation#records</li>
          <li>2,234</li>
          <li>21.7mb</li>
          <li class="location">
            <a href="/">app/helpers/spree/admin/navigation_helper.rb:114</a>
          </li>
        </ul>
      </li>
      <li class="pruned-row">
        <ul class="stats-row pruned">
          <li><HiddenIcon />function:activerecord/ActiveRecord::Relation#records</li>
          <li>2,234</li>
          <li>21.7mb</li>
          <li class="location">
            <a href="/">app/helpers/spree/admin/navigation_helper.rb:114</a>
          </li>
        </ul>
      </li>
      <li v-for="func in functions" :key="func['function']">
        <ul class="stats-row">
          <li class="fqid">
            <a
              v-if="isAvailable(removeFunctionPrefix(func['function']))"
              href="#"
              @click.prevent="openFunction(removeFunctionPrefix(func['function']))"
            >
              {{ removeFunctionPrefix(func['function']) }}
            </a>
            <div class="hidden-fqid" v-else>
              <HiddenIcon />
              {{ removeFunctionPrefix(func['function']) }}
            </div>
          </li>
          <li>{{ func.count }}</li>
          <li>{{ displaySize(func.size) }}</li>
          <li class="location">
            <a v-if="isPath(func.location)" href="/" @click.prevent="openLocation(func.location)">
              {{ func.location }}
            </a>
            <div v-else>{{ func.location }}</div>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script>
const KILOBYTE = 1000;
const MEGABYTE = KILOBYTE * 1000;
const GIGABYTE = MEGABYTE * 1000;
import CloseIcon from '@/assets/close.svg';
import StatsIconLg from '@/assets/stats-icon-lg.svg';
import HiddenIcon from '@/assets/hidden-icon.svg';
// import StatsIcon from '@/assets/stats-icon.svg';
import { SET_FOCUSED_EVENT, SET_VIEW, VIEW_SEQUENCE, SELECT_CODE_OBJECT } from '@/store/vsCode';

export default {
  name: 'v-stats-panel',

  components: {
    CloseIcon,
    StatsIconLg,
    HiddenIcon,
    // StatsIcon,
  },

  props: {
    stats: {
      type: Object,
      default: () => ({}),
    },
    appMap: {
      type: Object,
    },
  },

  data() {
    return {
      sortBy: 'count',
      sortAscending: false,
    };
  },

  computed: {
    functions() {
      if (this.stats.functions) return this.sortFunctions(this.stats.functions.slice());
      return [];
    },
  },

  methods: {
    updateSorting(sortBy) {
      this.sortAscending = !this.sortAscending;
      this.sortBy = sortBy;
    },

    sortFunctions(functionsArray) {
      return functionsArray.sort(this.sorter);
    },

    sorter(a, b) {
      if (['count', 'size'].includes(this.sortBy)) {
        return this.sortAscending
          ? a[this.sortBy] - b[this.sortBy]
          : b[this.sortBy] - a[this.sortBy];
      }
      return this.sortAscending
        ? a[this.sortBy].localeCompare(b[this.sortBy])
        : b[this.sortBy].localeCompare(a[this.sortBy]);
    },

    displaySize(sizeInBytes) {
      let divisor;
      let suffix;

      if (sizeInBytes > GIGABYTE) {
        divisor = GIGABYTE;
        suffix = 'GB';
      } else if (sizeInBytes > MEGABYTE) {
        divisor = MEGABYTE;
        suffix = 'MB';
      } else if (sizeInBytes > KILOBYTE) {
        divisor = KILOBYTE;
        suffix = 'KB';
      } else {
        divisor = 1;
        suffix = 'bytes';
      }

      return `${(sizeInBytes / divisor).toFixed(1)} ${suffix}`;
    },

    removeFunctionPrefix(fqid) {
      if (fqid.startsWith('function:')) return fqid.slice('function:'.length);
      return fqid;
    },

    isPath(location) {
      return /[\\/]/.test(location);
    },

    isAvailable(fqid) {
      return this.appMap.classMap.codeObjectsById[fqid];
    },

    closeStatsPanel() {
      this.$emit('closeStatsPanel');
    },

    openLocation(location) {
      this.$root.$emit('viewSource', { location });
    },

    openFunction(fqid) {
      const codeObject = this.appMap.classMap.codeObjectsById[fqid];
      if (codeObject) {
        const firstEvent = codeObject.events[0];

        this.$store.commit(SET_VIEW, VIEW_SEQUENCE);
        this.$store.commit(SELECT_CODE_OBJECT, codeObject);
        this.$store.commit(SET_FOCUSED_EVENT, firstEvent);
        this.$emit('closeStatsPanel');
      }
    },
  },
};
</script>

<style scoped lang="scss">
.stats-panel {
  background-color: $gray2;
  border-radius: 1rem;
  box-shadow: 0px 0px 20px 2px rgb(0 0 0 / 90%);
}
.stats-table {
  list-style-type: none;
  padding: 1.5rem;
  margin: 0 0 2rem 0;
  font-size: 0.95rem;
  li {
    border-bottom: 1px solid lighten($gray2, 15);
  }
  .stats-row {
    display: grid;
    grid-template-columns: 2fr 100px 100px 1fr;
    gap: 1rem;
    padding: 0.7rem 0;
    list-style-type: none;
    align-items: center;
    li {
      border-bottom: 0;
      color: $gray5;
      word-break: break-all;
    }
    strong {
      color: $gray4;
      &:hover {
        cursor: pointer;
        color: $white;
      }
    }
    .location,
    .fqid {
      word-break: keep-all;
      overflow: hidden;
      text-overflow: ellipsis;
      .hidden-fqid {
        color: $gray4;
        display: flex;
        align-items: center;
        svg {
          margin-right: 0.5rem;
          width: 1rem;
          height: 1rem;
        }
      }
      a {
        color: $brightblue;
        text-decoration: none;
        &:hover {
          text-decoration: underline;
          cursor: pointer;
        }
      }
    }
    &.pruned {
      grid-template-columns: 2fr 100px 100px 1fr;
      color: $gray4;
      li {
        color: $gray4;
        word-break: keep-all;
        overflow: hidden;
        text-overflow: ellipsis;
        display: flex;
        align-items: center;
      }
      a {
        color: $gray4;
      }
      svg {
        margin-right: 0.5rem;
        width: 1rem;
        height: 1rem;
      }
    }
  }
}
</style>
