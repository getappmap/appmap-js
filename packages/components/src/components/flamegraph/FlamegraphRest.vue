<template>
  <div class="flamegraph-rest" :style="style"></div>
</template>

<script>
export default {
  name: 'v-flamegraph-rest',
  props: {
    budget: {
      type: Number,
      required: true,
    },
  },
  computed: {
    style() {
      return {
        width: `${this.budget}px`,
      };
    },
  },
};
</script>

<style scoped lang="scss">
.flamegraph-rest {
  align-self: stretch;
  background-color: #fff;
  opacity: 0.05;
}
</style>
