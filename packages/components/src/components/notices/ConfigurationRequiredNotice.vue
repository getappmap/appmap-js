<template>
  <div class="configuration-required-notice" data-cy="notice-configuration">
    <div class="notice">
      <v-appmap-logo />
      <p class="configuration-required-notice__title">Additional configuration required</p>
      <p>To finish setting up this view, edit this macro and select an AppMap from the dropdown.</p>
      <p>
        If you don't yet have an AppMap, drag one into this page in edit mode. Once uploaded, the
        file can be removed from the page.
      </p>
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
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import VAppmapLogo from '@/assets/appmap-full-logo.svg';
import EmitLinkMixin from '@/components/mixins/emitLink';

export default Vue.extend({
  name: 'v-configuration-required-notice',
  components: {
    VAppmapLogo,
  },
  mixins: [EmitLinkMixin],
});
</script>

<style lang="scss" scoped>
.configuration-required-notice {
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
    max-width: 60%;
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

  a {
    color: $brightblue;
    text-decoration: none;

    &:hover,
    &:active {
      color: $brightblue;
    }
  }

  p {
    margin-block-start: 1em;
    margin-block-end: 1em;
  }
}
</style>
