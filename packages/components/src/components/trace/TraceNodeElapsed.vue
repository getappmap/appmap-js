<template functional>
  <div class="trace-node__elapsed">
    <span class="trace-node__elapsed-time">
      <slot />
      {{ String((props.time * 1000).toFixed(0)) + 'ms' }}
    </span>
  </div>
</template>

<script>
export default {
  name: 'v-trace-node-elapsed',
  props: {
    time: {
      type: Number,
      required: true,
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
</style>
