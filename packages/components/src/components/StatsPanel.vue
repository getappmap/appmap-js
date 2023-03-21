<template>
  <div class="stats-panel">
    <div class="heading">
      <h1><StatsIconLg />Stats</h1>
      <CloseIcon class="close-me" @click.stop="closeShareModal" />
    </div>

    <ul class="stats-table">
      <li>
        <ul class="stats-row row-header">
          <li><strong>Function</strong></li>
          <li><strong>Count</strong></li>
          <li><strong>Size on disk</strong></li>
          <li class="location"><strong>Location</strong></li>
        </ul>
      </li>
      <li class="pruned-row">
        <ul class="stats-row pruned">
          <HiddenIcon />
          <li>function:activerecord/ActiveRecord::Relation#records</li>
          <li>2,234</li>
          <li>21.7mb</li>
          <li class="location">
            <a href="/">app/helpers/spree/admin/navigation_helper.rb:114</a>
          </li>
        </ul>
      </li>
      <li class="pruned-row">
        <ul class="stats-row pruned">
          <HiddenIcon />
          <li>function:activerecord/ActiveRecord::Relation#records</li>
          <li>2,234</li>
          <li>21.7mb</li>
          <li class="location">
            <a href="/">app/helpers/spree/admin/navigation_helper.rb:114</a>
          </li>
        </ul>
      </li>
      <li v-for="func in stats" :key="func['function']">
        <ul class="stats-row">
          <li>{{ func['function'] }}</li>
          <li>{{ func.count }}</li>
          <li>{{ displaySize(func.size) }}</li>
          <li class="location">
            <a href="/">{{ func.location }}</a>
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
import HiddenIcon from '@/assets/hidden-icon.svg';
import StatsIcon from '@/assets/stats-icon.svg';
import StatsIconLg from '@/assets/stats-icon-lg.svg';

export default {
  name: 'v-stats-panel',
  props: {
    stats: {
      type: Object,
      default: () => ({}),
    },
  },
  methods: {
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
  },
  components: {
    CloseIcon,
    StatsIcon,
    StatsIconLg,
    HiddenIcon,
  },
};
</script>

<style scoped lang="scss">
.stats-panel {
  background-color: $gray2;
  border-radius: 1rem;
}
.stats-table {
  list-style-type: none;
  padding: 1.5rem;
  margin: 0;
  font-size: 0.95rem;
  li {
    border-bottom: 1px solid lighten($gray2, 15);
  }
  .stats-row {
    display: grid;
    grid-template-columns: 2fr 125px 125px 1fr;
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
    }
    .location {
      word-break: keep-all;
      overflow: hidden;
      text-overflow: ellipsis;
      a {
        color: $brightblue;
        text-decoration: none;
        &:hover {
          text-decoration: underline;
        }
      }
    }
    &.pruned {
      grid-template-columns: 1rem 2fr 125px 125px 1fr;
      color: $gray4;
      li {
        color: $gray4;
      }
      a {
        color: $gray4;
      }
      svg {
        margin-right: 0.5rem;
      }
    }
  }
}
</style>
