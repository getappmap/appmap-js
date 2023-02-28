<template>
  <div :class="classes">
    <v-loader-icon v-if="isPending" />
    <v-check-icon v-if="!isPending" />
    <p>{{ message }}</p>
  </div>
</template>

<script>
import VLoaderIcon from '@/assets/eva_loader-outline.svg';
import VCheckIcon from '@/assets/check.svg';

export default {
  name: 'PendingState',
  components: { VLoaderIcon, VCheckIcon },
  props: {
    isPending: Boolean,
    message: String,
  },
  computed: {
    classes() {
      return {
        pending: true,
        'pending--animate': this.isPending,
      };
    },
  },
};
</script>

<style lang="scss">
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.pending {
  display: flex;
  justify-content: center;
  align-items: end;

  p {
    margin: auto 0;
    vertical-align: middle;
  }

  svg {
    margin: auto 0;
    margin-right: 0.5em;
    width: 24px;
    fill: $white;
  }

  &--animate svg {
    animation: spin 4s linear infinite;
    fill: $white;
  }
}
</style>
