<template>
  <div class="subscription-status">
    <div class="subscription-status__header">
      <h3>Subscription Status</h3>
    </div>
    <div class="subscription-status__content" v-if="subscription">
      <div class="subscription-status__content_enrollment_data">
        <h4>Enrollment Date</h4>
        <p>{{ subscription.enrollmentDate }}</p>
      </div>
      <div class="subscription-status__content__no_products" v-if="!enrolled">
        <h4>Subscription Status</h4>
        <p>Not enrolled</p>
      </div>
      <div class="subscription-status__content__products" v-else>
        <div
          v-for="item in subscription.subscriptions"
          :key="item"
          class="subscription-status__content__products"
        >
          {{ item }}
        </div>
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
  },
  computed: {
    enrolled(): boolean {
      return this.subscription.subscriptions.length > 0;
    },
  },
});
</script>
