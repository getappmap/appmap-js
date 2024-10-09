<template>
  <div class="copilot-notice" data-cy="copilot-notice">
    <div class="copilot-notice__notification">
      <div class="copilot-notice__notification-icon">
        <v-shield-icon />
      </div>
      <div class="copilot-notice__notification-text">
        Navie is backed by the GitHub Copilot language model to ensure a trusted experience.
      </div>
    </div>
    <div class="copilot-notice__sub-notification">
      <a href="https://appmap.io/docs/navie-reference/navie-copilot-backend.html" target="_blank">
        Learn more
      </a>
      or
      <a href="#" @click.prevent="$emit('on-configure')" data-cy="llm-config-button">
        change the language model provider</a
      >.
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VShieldIcon from '@/assets/shield.svg';

export default Vue.extend({
  components: { VShieldIcon },
});
</script>

<style lang="scss" scoped>
.copilot-notice {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;

  &__notification {
    display: flex;
    padding: 1rem;
    flex-direction: row;
    justify-content: center;
    align-items: flex-end;
    align-items: center;
    max-width: 15rem;
    gap: 1rem;
    border-radius: $border-radius;
    border: 1px solid rgba(146, 146, 146, 0.33);
    background: rgba(116, 109, 217, 0.11);

    &-icon {
      svg {
        width: 24px;
      }
    }
  }

  &__sub-notification {
    a {
      text-decoration: none;
      color: desaturate($brightblue, 30%);

      &:hover,
      &:active {
        color: $brightblue;
        text-decoration: underline;
      }
    }
  }
}
</style>
