<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  name: 'FlashMessage',
  props: {
    type: {
      type: String as PropType<'success' | 'error' | 'info'>,
      default: 'info',
      validator: (value: string) => ['success', 'error', 'info'].includes(value),
    },
  },
  computed: {
    classes() {
      return {
        flash: true,
        [`flash--${this.type}`]: true,
      };
    },
  },
});
</script>

<style lang="scss" scoped>
.flash {
  padding: 1rem;
  border-radius: $border-radius;

  &--success {
    background: linear-gradient(90deg, rgba($success-from, 0.1) 0%, rgba($success-to, 0.05) 100%),
      $color-background;
    border: 1px solid rgba($success-from, 0.1);
    color: $alert-success;
  }
  &--error {
    background: linear-gradient(90deg, rgba($danger-from, 0.1) 0%, rgba($danger-to, 0.05) 100%),
      $color-background;
    border: 1px solid rgba($danger-from, 0.1);
    color: $bad-status;

    code,
    a {
      color: lighten($bad-status, 30%) !important;
    }
  }
  &--info {
    background: linear-gradient(90deg, rgba($general-from, 0.1) 0%, rgba($general-to, 0.05) 100%),
      $color-background;
    border: 1px solid rgba($general-from, 0.1);
    color: $lightblue;

    code {
      color: lighten($lightblue, 25%) !important;
    }
  }
}
</style>
