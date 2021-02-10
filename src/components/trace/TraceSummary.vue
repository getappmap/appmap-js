<template>
  <div class="trace-summary" @click="$emit('click')">
    <div ref="text" class="trace-summary__content">
      +{{ event.children.length }} more
    </div>
  </div>
</template>

<script>
import { Event } from '@/lib/models';
import VTracePath from './TracePath.vue';

export default {
  name: 'v-trace-summary',
  components: {
    VTracePath,
  },
  props: {
    event: {
      type: Event,
      required: true,
    },
  },
  methods: {
    getElement() {
      return new Promise((resolve) =>
        this.$nextTick(() => resolve(this.$refs.text))
      );
    },
  },
};
</script>

<style lang="scss">
.trace-summary {
  user-select: none;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  cursor: pointer;

  &__content {
    margin: 0.75em;
    padding: 0.25em;
    background: $gray2;
    color: #bababa;
  }
  padding-top: 0.75em;
}
</style>
