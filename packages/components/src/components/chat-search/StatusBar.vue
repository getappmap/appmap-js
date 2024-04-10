<template>
  <div :class="['status-bar', `status-bar--${level}`]" data-cy="status-bar">
    <div class="status-bar__header" data-cy="status-bar-header" @click="toggleShowBody">
      <span class="status-bar__header__title">
        <v-warning-icon class="warning-icon" v-if="level === 'warning' || level === 'error'" />
        <v-success-icon class="success-icon" v-if="level === 'success'" />
        <v-info-icon class="info-icon" v-if="level === 'info'" />
        <slot name="header" />
      </span>
      <v-chevron-down-icon :class="['toggle-icon', showBody ? 'up' : 'down']" />
    </div>
    <div :class="['status-bar__body', showBody ? 'show' : 'hide']">
      <slot name="body" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import VChevronDownIcon from '@/assets/fa-solid_chevron-down.svg';
import VWarningIcon from '@/assets/exclamation-circle.svg';
import VSuccessIcon from '@/assets/success-checkmark.svg';
import VInfoIcon from '@/assets/info-circle.svg';

export default Vue.extend({
  name: 'v-status-bar',

  components: {
    VChevronDownIcon,
    VWarningIcon,
    VSuccessIcon,
    VInfoIcon,
  },

  data() {
    return {
      showBody: false,
    };
  },

  props: {
    level: {
      type: String as PropType<'info' | 'success' | 'warning' | 'error'>,
      default: 'success',
      validator: (value: string) => ['info', 'success', 'warning', 'error'].includes(value),
    },
  },

  methods: {
    toggleShowBody() {
      this.showBody = !this.showBody;
    },
  },
});
</script>

<style lang="scss" scoped>
$fg: #ececec;

.status-bar {
  align-items: center;
  color: $fg;
  padding: 0.75rem;
  transition: background-color 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: $border-radius;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: $transition;
    font-size: 0.9rem;

    &__title {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .warning-icon,
      .success-icon,
      .info-icon {
        fill: $fg;
        width: 20px;

        path {
          fill: $fg;
        }
      }
    }

    &:hover {
      cursor: pointer;
      color: rgba(255, 255, 255, 0.5);
      transition: $transition;

      .toggle-icon {
        transition: $transition;
        fill: rgba(255, 255, 255, 0.5);
      }
    }

    .toggle-icon {
      fill: $gray6;
      width: 12px !important;
      transform: rotate(180deg);
      transition: $transition;

      &.down {
        transform: rotate(0deg);
      }
    }
  }

  &__body {
    margin-top: 1rem;
    font-size: 0.85rem;
    padding: 0.5rem;

    &.show {
      display: block;
    }

    &.hide {
      display: none;
    }
  }

  &--success,
  &--info {
    background-color: rgba(128, 128, 255, 0.1);
  }

  &--warning {
    background-color: #d2d6251e;
  }

  &--error {
    background-color: #d6252570;
  }
}
</style>
