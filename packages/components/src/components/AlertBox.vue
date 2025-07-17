<template>
  <div :class="['alert-box', `alert-box--${level}`]">
    <span class="alert-box--indicator" />
    <div class="alert-box--body">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

export default Vue.extend({
  name: 'v-alert-box',
  components: {},
  props: {
    level: {
      type: String as PropType<'info' | 'warning' | 'error'>,
      default: 'info',
      validator: (value: string) => ['info', 'warning', 'error'].includes(value),
    },
  },
});
</script>

<style lang="scss" scoped>
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}

.alert-box {
  display: grid;
  grid-template-columns: 1rem 1fr;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  transition: background-color 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: $border-radius;

  &--info {
    background-color: rgba(128, 128, 255, 0.1);
    & > .alert-box--indicator {
      background-color: #00a3ff;
      border: 0.2rem solid #46bcff;
      box-shadow: 0 0 0.5rem rgba(0, 163, 255, 0.7);
    }
  }

  &--warning {
    background-color: #d2d6251e;
    & > .alert-box--indicator {
      background-color: #d2d625;
      border: 0.2rem solid #d1d355;
      box-shadow: 0 0 0.5rem rgba(210, 214, 37, 0.7);
    }
  }

  &--error {
    background-color: #d625251e;
    & > .alert-box--indicator {
      background-color: #d62525;
      border: 0.2rem solid #d24040;
      box-shadow: 0 0 0.5rem rgba(214, 37, 37, 0.7);
    }
  }

  &--indicator {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    margin-top: 0.25rem;
    align-self: start;
    justify-self: center;
    animation: pulse 3s infinite ease-in-out;
  }
}
</style>
