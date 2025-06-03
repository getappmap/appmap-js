<template>
  <span class="badge" :class="priorityClass">
    <span>{{ priority }}</span>
    <div class="badge-bg" :class="`priority-${priority}`"></div>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    priority: {
      type: String,
      required: true,
      validator: (value: string) => ['low', 'medium', 'high'].includes(value),
    },
  },
  computed: {
    priorityClass(): string {
      return `priority-${this.priority}`;
    },
  },
});
</script>

<style scoped lang="scss">
.badge {
  position: relative;
  padding: 0.125rem 0.25rem;
  padding-top: 0.2rem;
  border-radius: 0.25rem;
  font-size: 0.65rem;
  font-weight: 600;
  vertical-align: bottom;
  text-transform: uppercase;
  white-space: nowrap;
  background-color: transparent !important;

  .badge-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 0.25rem;
    opacity: 0.25;
  }
}

.priority-high {
  color: $color-error !important;
  background-color: $color-error;
}
.priority-medium {
  color: $color-warning !important;
  background-color: $color-warning;
}
.priority-low {
  color: $color-foreground-light !important;
  background-color: $color-foreground-light;
}
.priority-default {
  color: $color-foreground-secondary !important;
  background-color: $color-foreground-secondary;
}
</style>
