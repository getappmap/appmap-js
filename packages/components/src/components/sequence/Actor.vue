<template>
  <div class="lane" :style="inlineStyle">
    <div class="offset">
      <div class="sequence-actor">
        <div class="label-container" :class="labelClasses" @click="selectCodeObject">
          <span class="label"> {{ actor.name }} </span>
        </div>
      </div>
    </div>
    <div class="sequence-actor-lane-separator" />
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import { SELECT_OBJECT } from '@/store/vsCode';
import { CodeObject } from '@appland/models';

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
    inlineStyle(): { [key: string]: string } {
      return {
        'grid-area': `1 / ${this.index + 1} / ${this.height + 2} / auto`,
      };
    },
    labelClasses(): { [key: string]: string } {
      return {
        'label-container': true,
        'label-container--selected': this.actor === this.selectedActor,
      };
    },
  },
  methods: {
    selectCodeObject() {
      if (this.$store) {
        const codeObject = this.$store.state.appMap.classMap.codeObjects.find(
          (co: CodeObject) => co.fqid === this.actor.id
        );
        if (codeObject) this.$store.commit(SELECT_OBJECT, codeObject);
      }
    },
  },
};
</script>

<style scoped lang="scss">
$min-width: 160px; // See: CallLabel .label wax-width
$min-height: 3rem;

.offset {
  position: relative;
  height: 100%;
  float: left;
  left: 100%;
}

.sequence-actor {
  position: sticky;
  top: 10px;
}

.label-container {
  margin: 3px 0;
  text-align: center;
  padding: 3px;
  z-index: 2175666; // Overlay the swim lane dashed lines
  overflow: hidden;
  text-overflow: ellipsis;
  overflow: visible;
  max-width: $min-width - 6;
  width: fit-content;
  transform: translateX(-50%);
  // These attributes are taken from the component diagram package element.
  background-color: #6fddd6;
  font-family: 'IBM Plex Mono', monospace;
  color: #010306;
  font-size: 75%;
  font-weight: 700;
  border: 3px solid #6fddd6;

  &--selected {
    border: 3px solid #ff07aa;
  }
}

.label-container:hover {
  cursor: pointer;
  color: $lightblue;
}

.lane {
  min-width: $min-width;
  min-height: $min-height;
}

.sequence-actor-lane-separator {
  border-left: 1px dashed #6fddd6;
  position: relative;
  height: 100%;
  width: 1px;
  top: 0;
  left: 100%;
}
</style>
