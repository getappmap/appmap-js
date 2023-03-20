<template>
  <div class="lane" :style="inlineStyle">
    <div class="sequence-actor-lane-separator" />
    <div class="offset">
      <div class="on-top">
        <div class="sequence-actor" :data-actor-id="actor.id">
          <div ref="label_container" :class="labelClasses" @click="selectCodeObject">
            <span class="label"> {{ actor.name }} </span>
            <template v-if="interactive">
              <span class="hide-container" @click.stop="hideCodeObject">
                <XIcon />
              </span>
            </template>
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
import XIcon from '@/assets/x-icon.svg';

export default {
  name: 'v-sequence-actor',
  components: {
    XIcon,
  },

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
    interactive: {
      type: Boolean,
      required: true,
      readonly: true,
    },
    appMap: {
      type: Object,
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
        interactive: this.interactive,
      };
    },
  },
  methods: {
    hideCodeObject() {
      this.$root.$emit('addHiddenName', this.actor.id);
    },
    selectCodeObject() {
      if (this.appMap) {
        const codeObject = this.appMap.classMap.codeObjects.find(
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
            this.$refs.label_container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
  box-shadow: 0px 0px 20px 0px rgba(0, 0, 0, 0.55);

  min-width: 145px;
  min-height: 60px;
  max-width: $min-width - 6;
  width: fit-content;

  transform: translateX(-50%);
  position: absolute;

  // These attributes are taken from the component diagram package element.
  background-color: $black;
  color: $white;
  font-size: 9pt;
  border: 2px solid lighten($gray4, 15);
  border-radius: 0.25rem;
  display: flex;
  justify-content: center;
  align-items: center;

  &--selected {
    background-color: #444e69;
  }

  .hide-container {
    position: absolute;
    display: inline-block;
    right: 0px;
    top: 0px;
    z-index: 99999;
    padding: 5px;
    border-radius: 4px;

    &:hover {
      color: blue;
      text-decoration: underline;
      cursor: pointer;
    }

    svg {
      fill: $white;
      opacity: 33%;
      &:hover {
        opacity: 93%;
      }
    }
  }
}

.interactive.label-container:hover {
  cursor: pointer;
  background-color: #444e69;
  .hide-container {
    background-color: #444e69;
  }
}

.lane {
  min-width: $min-width;
  min-height: $min-height;
}

.on-top {
  position: absolute;
  z-index: 99999;
  height: 100%;
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
