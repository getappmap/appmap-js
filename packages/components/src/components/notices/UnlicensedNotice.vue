<template>
  <div class="unlicensed-notice">
    <div class="notice">
      <v-appmap-logo />
      <h1 class="unlicensed-notice__title">License expired</h1>
      <p>
        To continue enjoying all the great features of this software, an active license is required.
        Your support is crucial in helping us enhance and develop new features for our community.
      </p>
      <a :href="purchaseUrl" class="cta" data-cy="purchase" v-if="purchaseUrl" target="_blank">
        <v-button class="cta" data-cy="purchase"> Purchase AppMap </v-button>
      </a>
      <p>
        Need assistance or have questions? Join the
        <a href="https://appmap.io/slack" target="_blank" rel="noopener noreferrer">
          AppMap Community Slack
        </a>
        for interactive support or check out our
        <a href="https://appmap.io/docs" target="_blank" rel="noopener noreferrer"> documentation</a
        >. For more direct assistance, our support team is just an
        <a href="mailto:support@appmap.io">email</a> away.
      </p>
      <p>Thank you for being a vital part of our community, we hope to see you again soon!</p>
    </div>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VAppmapLogo from '@/assets/appmap-full-logo.svg';
import VButton from '@/components/Button.vue';

export default {
  components: {
    VAppmapLogo,
    VButton,
  },
  props: {
    purchaseUrl: {
      type: String,
      required: false,
    },
  },
};
</script>

<style lang="scss" scoped>
.unlicensed-notice {
  display: flex;
  position: absolute;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-family: $appland-text-font-family;
  line-height: 1.5;
  color: $base03;
  background-color: $black;
  z-index: 2147483647;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;

  .notice {
    display: flex;
    flex-direction: column;
    max-width: 50%;
    min-width: 16rem;
  }

  &__title {
    margin-bottom: 1rem;
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(to right, $royal, $hotpink);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .cta {
    width: fit-content;
    align-self: center;
  }

  p {
    margin-block-start: 1em;
    margin-block-end: 1em;
  }

  a {
    color: $brightblue;
    text-decoration: none;

    &:hover,
    &:active {
      color: $brightblue;
    }
  }

  .empty-state-diagram {
    margin-top: 4rem;
  }
}
</style>
