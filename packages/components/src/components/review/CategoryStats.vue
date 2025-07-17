<template>
  <div class="category-stats">
    <span class="suggestion-count high" v-if="counts.high">
      {{ counts.high }}
    </span>
    <span class="suggestion-count medium" v-if="counts.medium">
      {{ counts.medium }}
    </span>
    <span class="suggestion-count low" v-if="counts.low">
      {{ counts.low }}
    </span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { PropType } from 'vue';
import { type Suggestion } from '.';

export default Vue.extend({
  name: 'CategoryStats',
  props: {
    items: {
      type: Array as PropType<Suggestion[]>,
      required: true,
    },
  },
  computed: {
    counts(): { high: number; medium: number; low: number; total: number } {
      const counts = { high: 0, medium: 0, low: 0, total: 0 };
      for (const item of this.items) {
        counts[item.priority]++;
        counts.total++;
      }
      return counts;
    },
  },
});
</script>

<style scoped lang="scss">
.category-stats {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-left: auto;

  .suggestion-count {
    padding: 0.125rem 0.5rem;
    &.high {
      color: $color-error;
      &::after {
        content: 'high';
        margin-left: 0.25rem;
      }
    }
    &.medium {
      color: $color-warning;
      &::after {
        content: 'medium';
        margin-left: 0.25rem;
      }
    }
    &.low {
      color: $color-foreground;
      &::after {
        content: 'low';
        margin-left: 0.25rem;
      }
    }
  }
}
</style>
