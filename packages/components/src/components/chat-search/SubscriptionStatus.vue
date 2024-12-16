<template>
  <div class="subscription-status">
    <div class="subscription-status__content" v-if="subscription">
      <div class="subscription-status__content__no_products" v-if="!enrolled">
        <template v-if="usage7days !== undefined">
          <p :class="remainingChatsClass">
            You've used {{ usage7days }} of your {{ limit7days }} chat<br />
            sessions allowed with the free plan.
          </p>
        </template>
        <template v-else> You're not subscribed.</template>
        <p>
          <a href="https://appmap.io/docs/reference/subscriptions.html" class="subscription-info">
            Subscribe now &raquo;
          </a>
        </p>
      </div>
      <div class="subscription-status__content__products" v-else>
        You're subscribed
        <!-- <div
          v-for="item in subscription.subscriptions"
          :key="item"
          class="subscription-status__content__products"
        >
          {{ item }}
        </div> -->
      </div>
    </div>
    <div class="subscription-status__loading" v-else>
      <p>Loading...</p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'v-subscription-status',
  props: {
    subscription: {
      type: Object,
    },
    usage: {
      type: Object,
    },
  },
  computed: {
    enrolled(): boolean {
      return this.subscription.subscriptions.length > 0;
    },
    usage7days(): number | undefined {
      const item = this.usage.conversationCounts.find((item) => item.daysAgo === 7);
      if (item) return item.count;

      return undefined;
    },
    limit7days(): number {
      return 7;
    },
    remainingChatsClass(): number | undefined {
      const usage = this.usage7days;
      if (usage === undefined) return 'usage-ok';

      return usage > this.limit7days ? 'usage-over' : 'usage-ok';
    },
  },
});
</script>

<style lang="scss" scoped>
.subscription-status {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  flex: 1 1 auto;
  text-align: right;

  &__content {
    width: 100%;
  }

  .usage-over {
    color: red;
  }

  .subscription-info {
    color: white;
    text-decoration: underline;
  }
}
</style>
