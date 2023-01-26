<template>
  <div style="display: contents">
    <div class="sequence-actor" :style="{ 'grid-column': gridColumn, 'grid-row': row }">
      <div class="label-container">
        <span class="label"> {{ actor.name }} </span>
      </div>
    </div>
    <template v-if="row > 0 && index > 0">
      <div
        class="sequence-actor-lane"
        :style="{ 'grid-column': gridColumn, 'grid-row-start': row, 'grid-row-end': gridSpan }"
      >
        <div class="sequence-actor-lane-separator"></div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
export default {
  name: 'v-sequence-actor',

  components: {},

  props: {
    actor: {
      type: Object,
      required: true,
      readonly: true,
    },
    row: {
      type: Number,
      required: true,
      readonly: true,
    },
    index: {
      type: Number,
      required: true,
      readonly: true,
    },
    height: {
      type: Number,
      required: true,
      readonly: true,
    },
  },
  computed: {
    gridColumn(): number {
      return this.index + 1;
    },
    gridSpan(): number {
      return this.height + 2;
    },
  },
};
</script>

<style scoped lang="scss">
.label-container {
  margin: 0 10px;
  background-color: gray;
  text-align: center;
  padding: 3px;
  min-width: 8rem;
  min-height: 3rem;
  z-index: 1; // Overlay the swim lane dashed lines
  overflow: hidden;
  text-overflow: ellipsis;
  left: 50%;
  position: relative;
}

.sequence-actor-lane-separator {
  border-left: 1px dashed gray;
  height: 100%;
}
</style>
