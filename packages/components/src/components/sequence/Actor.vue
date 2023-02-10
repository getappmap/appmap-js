<template>
  <div class="lane" :style="inlineStyle">
    <div class="sequence-actor-lane-separator" />
    <div class="offset">
      <div class="on-top">
        <div class="sequence-actor" :data-actor-id="actor.id">
          <div
            class="label-container"
            ref="label_container"
            :class="labelClasses"
            @click="selectCodeObject"
          >
            <span class="label"> {{ actor.name }} </span>
            <span class="hide-container" @click.stop="hideCodeObject">[x]</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { SELECT_CODE_OBJECT } from '@/store/vsCode';
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
    hideCodeObject() {
      this.$root.$emit('addHiddenName', this.actor.id);
    },
    selectCodeObject() {
      if (this.$store) {
        const codeObject = this.$store.state.appMap.classMap.codeObjects.find(
          (co: CodeObject) => co.fqid === this.actor.id
        );
        if (codeObject) this.$store.commit(SELECT_CODE_OBJECT, codeObject);
      }
    },
  },
  watch: {
    '$store.getters.selectedObject': {
      handler(selectedObject) {
        if (selectedObject && selectedObject instanceof CodeObject) {
          const ancestorFqids = [selectedObject, ...selectedObject.ancestors()].map(
            (co) => co.fqid
          );
          if (ancestorFqids.indexOf(this.actor.id) > -1) {
            this.$refs.label_container.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      },
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
  left: 100%;
  width: 0;
}

.sequence-actor {
  position: sticky;
  top: 10px;
  z-index: 5; // Overlay the swim lane dashed lines
}

.label-container {
  margin: 3px 0;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow: visible;

  min-width: 145px;
  min-height: 60px;
  max-width: $min-width - 6;
  width: fit-content;

  transform: translateX(-50%);
  position: absolute;

  // These attributes are taken from the component diagram package element.
  background-color: lighten($gray4, 10); //#6fddd6;
  //font-family: 'IBM Plex Mono', monospace;
  color: #010306;
  font-size: 9pt;
  font-weight: 500;
  border: 3px solid lighten($gray4, 10);
  border-radius: 3px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: $transition;

  &--selected {
    background-color: $black;
    color: $white;
  }

  .hide-container {
    position: absolute;
    display: inline-block;
    right: 0;
    top: 0;

    &:hover {
      color: blue;
      text-decoration: underline;
      cursor: pointer;
    }
  }
}

.label-container:hover {
  cursor: pointer;
  background-color: darken($gray4, 20);
  color: $black;
}

.lane {
  min-width: $min-width;
  min-height: $min-height;
  // position: relative;
}

.on-top {
  position: absolute;
  z-index: 1;
  height: 100%;
  // width: 100%;
}

.sequence-actor-lane-separator {
  border-left: 1px dashed $gray4;
  position: relative;
  height: 100%;
  width: 1px;
  top: 0;
  left: 100%;
  float: left;
}
</style>
