<template>
  <div :class="{ 'tool-status': 1, 'tool-status--complete': complete }" data-cy="tool-status">
    <v-check v-if="complete" class="tool-status__loader" />
    <v-loader v-else class="tool-status__loader" />
    <div class="tool-status__info">
      <div class="tool-status__action" data-cy="title">{{ title }}</div>
      <div class="tool-status__status" data-cy="status">{{ status }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VLoader from '@/components/chat/Loader.vue';
import VCheck from '@/assets/check.svg';

export default Vue.extend({
  name: 'v-tool-status',
  components: {
    VLoader,
    VCheck,
  },
  props: {
    title: String,
    status: String,
    complete: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.tool-status {
  display: grid;
  grid-template-columns: 1.5rem 1fr;
  flex-direction: column;
  border: 1px solid #7289c5;
  border-radius: $border-radius;
  padding: 0.5rem;
  width: fit-content;
  color: #ececec;
  align-items: stretch;

  &__info {
    grid-column: 2;
    padding-left: 0.5rem;
  }

  &__action {
    font-size: 0.8rem;
    font-weight: 600;
  }

  &__status {
    font-size: 0.75rem;
  }

  &__loader {
    justify-self: center;
    width: 75%;

    path {
      fill: #ececec;
    }
  }
}
</style>
