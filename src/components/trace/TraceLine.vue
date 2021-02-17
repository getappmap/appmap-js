<template>
  <svg xlmns="http://www.w3.org/2000/svg" class="connections">
    <path class="edge" v-for="(path, i) in paths" :key="i" :d="path" />
  </svg>
</template>

<script>
export default {
  name: 'v-trace-path',
  props: {
    height: {
      type: Number,
    },
  },
  data() {
    return {
      paths: [],
    };
  },
  methods: {
    async renderPaths() {
      this.paths.push(`m0 0 v${this.height}`);
    },
  },
  mounted() {
    this.renderPaths();
  },
};
</script>

<style scoped lang="scss">
.connections {
  width: 7.5rem;
  overflow: visible;
}

.edge {
  fill: none;
  stroke: $gray2;
  stroke-width: 3px;
}
</style>
