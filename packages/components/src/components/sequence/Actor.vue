<template>
  <div style="display: contents">
    <div class="sequence-actor" :style="{ 'grid-column': gridColumn, 'grid-row': row }">
      <div class="label-container" :style="selectionStyle" @click="selectCodeObject">
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
import { SELECT_OBJECT } from '@/store/vsCode';

export default {
  name: 'v-sequence-actor',

  components: {},

  props: {
    actor: {
      type: Object,
      required: true,
      readonly: true,
    },
    selectedActor: {
      type: Object,
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
    selectionStyle(): Record<string, string> {
      const result: Record<string, string> = {};
      if (this.selectedActor && this.actor === this.selectedActor) {
        result.border = '3px solid #ff07aa';
        result.margin = '3px 10px';
      }
      return result;
    },
  },
  ,
  methods: {
    selectCodeObject() {
      if (this.$store ) {
        const codeObject = this.$store.state.appMap.classMap.codeObjects.find((co) => co.fqid === this.actor.id);
        if ( codeObject )
          this.$store.commit(SELECT_OBJECT, codeObject);
      }
    },
  }
};
</script>

<style scoped lang="scss">
.label-container {
  margin: 3px 10px;
  text-align: center;
  padding: 3px;
  min-width: 160px; // See: CallLabel .label wax-width
  min-height: 3rem;
  z-index: 1; // Overlay the swim lane dashed lines
  overflow: hidden;
  text-overflow: ellipsis;
  left: 50%;
  position: relative;
  // These attributes are taken from the component diagram package element.
  background-color: #6fddd6;
  font-family: 'IBM Plex Mono', monospace;
  color: #010306;
  font-size: 75%;
  font-weight: 700;
  border: 3px solid #6fddd6;
}

.sequence-actor-lane-separator {
  border-left: 1px dashed #6fddd6;
  height: 100%;
}
</style>
