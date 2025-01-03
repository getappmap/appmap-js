<template>
  <div
    class="subscription-status-loader"
    data-cy="plan-status-loading"
    v-if="subscription === undefined"
  >
    <v-skeleton-loader class="loader" />
  </div>
  <div class="subscription-status" data-cy="plan-status-free" v-else-if="!isSubscribed">
    Limited free plan <a :href="subscribeUrl" target="_blank">Subscribe now</a>
  </div>
  <div class="subscription-status" data-cy="plan-status-pro" v-else>
    {{ planName }} <a :href="subscribeUrl" target="_blank">Manage Subscription</a>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VSkeletonLoader from '@/components/SkeletonLoader.vue';
import { getSubscribeUrl } from '@/lib/subscribe';

export default Vue.extend({
  name: 'v-subscription-status',
  components: { VSkeletonLoader },
  props: {
    subscription: {
      type: Object,
    },
    email: {
      type: String,
    },
  },
  computed: {
    isSubscribed(): boolean {
      return this.subscription?.subscriptions?.length > 0;
    },
    planName(): string {
      return this.subscription?.subscriptions?.[0]?.productName ?? 'AppMap Pro';
    },
    subscribeUrl(): string {
      return getSubscribeUrl(this.email);
    },
  },
});
</script>

<style lang="scss" scoped>
.subscription-status {
  align-self: center;
  a {
    color: $color-link;
    text-decoration: none;
    &:hover {
      color: $color-link-hover;
      text-decoration: underline;
    }
  }
}

.subscription-status-loader {
  width: 90%;
  height: 1.2em;
  .loader {
    border-radius: $border-radius;
  }
}
</style>
