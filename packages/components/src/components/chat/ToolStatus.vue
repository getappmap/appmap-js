<template>
  <div
    :class="{
      'tool-status': 1,
      'tool-status--complete': complete,
      'tool-status--interactive': interactive,
    }"
    data-cy="tool-status"
  >
    <component :is="completeIconComponent" v-if="complete" class="tool-status__loader" />
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
import VDocument from '@/assets/document.svg';

export default Vue.extend({
  name: 'v-tool-status',
  components: {
    VLoader,
    VCheck,
    VDocument,
  },
  props: {
    title: String,
    status: String,
    completeIcon: {
      type: String,
      default: 'check',
      validator: (value: unknown) => !!['check', 'document'].find((x) => x === value),
    },
    complete: {
      type: Boolean,
      default: false,
    },
    interactive: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    completeIconComponent(): Vue.Component {
      return this.completeIcon === 'check' ? VCheck : VDocument;
    },
  },
});
</script>

<style lang="scss" scoped>
.tool-status {
  display: grid;
  grid-template-columns: 1.5rem 1fr;
  flex-direction: column;
  width: fit-content;
  color: $color-foreground;
  align-items: stretch;

  &--complete {
    .tool-status__loader {
      path {
        fill: $color-highlight;
      }
    }
  }

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
    width: 50%;

    path {
      fill: $color-foreground;
    }
  }

  &--interactive {
    &:hover {
      cursor: pointer;
      background-color: $color-background-light;
    }
  }
}
</style>
