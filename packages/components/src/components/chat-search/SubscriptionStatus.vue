<template>
  <div class="subscription-status">
    <div class="loaded" v-if="subscription">
      <div class="not-subscribed" v-if="!enrolled">
        <template v-if="usage7days !== undefined">
          <p>
            <span>The free plan includes {{ limit7days }} chats per week.</span>
            <br />
            <span :class="remainingChatsClass">You've used {{ usage7days }}.</span>
          </p>
        </template>
        <template v-else>
          <p>You're not subscribed.</p>
        </template>
        <p class="subscription-link">
          <a href="https://appmap.io/docs/reference/subscriptions.html"> Subscribe now &raquo; </a>
        </p>
      </div>
      <div class="subscribed" v-else>You're subscribed</div>
    </div>
    <div class="loading" v-else>
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
  padding-right: 1rem;
  flex: 1 1 auto;
  text-align: right;
  font-size: 90%;

  .usage-over {
    color: red;
    font-size: 110%;
  }

  .not-subscribed {
    display: flex;
    flex-direction: row;
    align-items: flex-start;

    p {
      margin: 0;
      height: 3rem;
      vertical-align: middle;
    }

    .subscription-link {
      margin-left: 1rem;
      margin-top: 0.5rem;

      a {
        color: white;
        text-decoration: underline;
      }
    }
  }
}
</style>
