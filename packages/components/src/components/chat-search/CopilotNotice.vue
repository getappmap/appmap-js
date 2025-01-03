<template>
  <div class="copilot-notice" data-cy="copilot-notice">
    <div class="copilot-notice__container">
      <v-subscription-status
        class="subscription-status"
        :subscription="subscription"
        :email="email"
      />
      <div class="copilot-notice__notification">
        <div class="copilot-notice__notification-icon">
          <v-shield-icon />
        </div>
        <div class="copilot-notice__notification-text">
          Navie is backed by the GitHub Copilot language model to ensure a trusted experience.
        </div>
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
import VSubscriptionStatus from '@/components/chat-search/SubscriptionStatus.vue';

export default Vue.extend({
  components: { VShieldIcon, VSubscriptionStatus },
  props: {
    subscription: {
      type: Object,
    },
    email: {
      type: String,
    },
  },
});
</script>

<style lang="scss" scoped>
.copilot-notice {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  color: $color-foreground;
  gap: 0.5rem;

  &__container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    background-color: $color-background-dark;
    border: 1px solid $color-border;
    border-radius: $border-radius;

    .subscription-status {
      padding-top: 0.5rem;
    }
  }

  &__notification {
    display: flex;
    padding: 1rem;
    flex-direction: row;
    justify-content: center;
    align-items: flex-end;
    align-items: center;
    max-width: 20rem;
    gap: 1rem;
    border-radius: 0 0 $border-radius $border-radius;
    background-color: $color-background-dark;
    border-top: 1px solid $color-border;

    &-icon {
      svg {
        width: 24px;
      }
    }
  }

  &__sub-notification {
    a {
      text-decoration: none;
      color: $color-link;

      &:hover,
      &:active {
        color: $color-link-hover;
        text-decoration: underline;
      }
    }
  }
}
</style>
