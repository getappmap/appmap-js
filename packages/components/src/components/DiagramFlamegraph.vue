<template>
  <div class="diagram-flame">
    <div ref="d3Container"></div>
  </div>
</template>

<script>
// namespace import to better support commonjs
import * as d3 from 'd3';
import * as Flamegraph from 'd3-flame-graph';
import { digestEventArray } from '../lib/flamegraph';

const { flamegraph: createFlamegraph } = Flamegraph;

export default {
  name: 'v-diagram-flame',

  props: {
    events: {
      type: Array,
    },
  },

  data() {
    return {};
  },

  mounted() {
    const flamegraph = createFlamegraph();
    flamegraph.selfValue(false); // each node's value contains the sum of its children (as well as its own value)
    flamegraph.width(960);
    d3.select(this.$refs.d3Container).datum(digestEventArray(this.events)).call(flamegraph);
  },
};
</script>

<style scoped lang="scss">
.diagram-flame {
  padding: 20px 20px 20px 20px;
}
</style>
