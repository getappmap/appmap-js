<template>
  <div class="trace-node__elapsed">
    <span class="trace-node__elapsed-time">
      <Clock class="trace-node__elapsed-icon" />
      {{ elapsedTime }}
    </span>
  </div>
</template>

<script>
import Clock from '@/assets/clock.svg';

export default {
  name: 'v-trace-node-elapsed',
  components: {
    Clock,
  },
  props: {
    time: {
      type: Number,
      required: true,
    },
  },
  computed: {
    elapsedTime() {
      return `${this.time.toFixed(2)}s`;
    },
  },
};
</script>

<style scoped lang="scss">
.trace-node__elapsed {
  margin-top: 0.5rem;
}

.trace-node__elapsed-time {
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.3rem;
  color: #eaeaea;
  background-color: #3e4864;
  white-space: nowrap;
}

.trace-node__elapsed-icon {
  margin-right: 0.3rem;
  width: 1em;
  height: 1em;
  fill: currentColor;
}
</style>
