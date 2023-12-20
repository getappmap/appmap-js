<template>
  <v-button
    size="small"
    kind="secondary"
    class="ask-ai"
    data-cy="ai-help-primary"
    @click.native="onClick"
  >
    <span class="ask-ai--content">
      <v-ai-icon class="icon" />
      &nbsp; Ask AppMap AI &nbsp;
      <v-badge>NEW</v-badge>
    </span>
  </v-button>
</template>

<script lang="ts">
//@ts-nocheck

import VBadge from '@/components/Badge.vue';
import VButton from '@/components/Button.vue';
import VAiIcon from '@/assets/ai.svg';

export default {
  name: 'v-ai-help',
  components: {
    VBadge,
    VButton,
    VAiIcon,
  },
  methods: {
    onClick() {
      this.$root.$emit('ai-help');
    },
  },
};
</script>

<style lang="scss" scoped>
.ask-ai {
  &--content {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  svg.icon {
    width: 1.2rem;
    height: 1.2rem;
    path {
      fill: $white;
      transition: fill 0.2s ease-in-out;
    }
  }

  &:hover {
    svg.icon {
      path {
        fill: $gray1;
      }
    }
  }
}
</style>
