<template>
  <v-button class="event-button" @click.native="emitEvent" size="small" kind="ghost">
    <slot />
  </v-button>
</template>

<script lang="ts">
import Vue from 'vue';
import VButton from '../Button.vue';

export default Vue.extend({
  name: 'v-event-button',
  components: {
    VButton,
  },
  props: {
    event: {
      type: String,
      required: true,
    },
  },
  methods: {
    emitEvent() {
      this.$root.$emit('navie-ui-event', this.event);
    },
  },
});
</script>

<style lang="scss" scoped>
.event-button {
  margin-right: 0.5rem;
}
</style>
