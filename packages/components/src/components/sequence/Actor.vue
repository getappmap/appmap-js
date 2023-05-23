<template>
  <div class="lane" :style="inlineStyle">
    <div class="sequence-actor-lane-separator" />
    <div class="offset">
      <div class="on-top">
        <div class="sequence-actor" :data-actor-id="actor.id">
          <div ref="label_container" :class="labelClasses" @click="selectCodeObject">
            <template v-if="interactive">
              <div class="control-wrap">
                <span class="hide-container" @click.stop="hideCodeObject">
                  <XIcon />
                </span>
                <v-popper
                  class="hover-text-popper"
                  text="Expand this package to its classes"
                  placement="left"
                  text-align="left"
                  v-if="expandable"
                >
                  <div class="expand-actor" @click.stop="onExpand"><ExpandIcon /></div>
                </v-popper>
                <v-popper
                  class="hover-text-popper"
                  text="Collapse this class to its parent package"
                  placement="left"
                  text-align="left"
                  v-if="isClass"
                >
                  <div class="collapse-actor" @click.stop="onCollapse"><CollapseIcon /></div>
                </v-popper>
              </div>
            </template>
            <span :class="['label', type]">
              {{ actor.name }}
              <span v-if="expandable">({{ numClasses }})</span>
            </span>
          </div>
          <div v-if="expandable" class="label-container stack stack1"></div>
          <div v-if="expandable" class="label-container stack stack2"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { SELECT_CODE_OBJECT, ADD_EXPANDED_PACKAGE, REMOVE_EXPANDED_PACKAGE } from '@/store/vsCode';
import { CodeObject } from '@appland/models';
import XIcon from '@/assets/x-icon.svg';
import VPopper from '@/components/Popper.vue';
import ExpandIcon from '@/assets/expand-icon.svg';
import CollapseIcon from '@/assets/collapse-icon.svg';

export default {
  name: 'v-sequence-actor',
  components: {
    XIcon,
    VPopper,
    ExpandIcon,
    CollapseIcon,
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
    type() {
      if (this.actor.id && this.actor.id.includes(':')) return this.actor.id.split(':')[0];
      return '';
    },
    expandable() {
      return this.isPackage && this.numClasses && this.numClasses > 1;
    },
    isPackage() {
      return this.actor.id.includes('package');
    },
    isClass() {
      return this.actor.id.includes('class');
    },
    numClasses() {
      const match = this.actor.id.match(/:(?<id>.*)/);
      if (match && match.groups && this.appMap) {
        const codeObj = this.appMap.classMap.codeObjectFromId(match.groups.id);
        if (codeObj) return codeObj.classes.length;
      }
      return 0;
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
    codeObjectFromActor() {
      const match = this.actor.id.match(/:(?<id>.*)/);

      if (match && match.groups) {
        const codeObj = this.appMap.classMap.codeObjectFromId(match.groups.id);
        if (codeObj) return codeObj;
      }
    },
    onExpand() {
      const codeObj = this.codeObjectFromActor();
      if (codeObj) {
        this.$store.commit(ADD_EXPANDED_PACKAGE, codeObj);
      }
    },
    onCollapse() {
      const codeObj = this.codeObjectFromActor();
      if (codeObj) this.$store.commit(REMOVE_EXPANDED_PACKAGE, codeObj);
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
$min-width: 175px; // See: CallLabel .label wax-width
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
  z-index: 5;

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
  border: 1px solid $gray4; //lighten($gray4, 15);
  border-radius: 0;
  display: grid;
  grid-template-rows: 20px auto;
  grid-template-columns: 100%;
  justify-content: center;
  align-items: center;
  transition: $transition;

  &--selected {
    background-color: $gray2; //$actor-highlight;
    .label {
      text-shadow: #181b24 0 0 12px;
      &.http {
        color: #bd64e1;
      }

      &.external-service {
        color: $yellow;
      }
      &.package {
        color: $teal;
      }
      &.class {
        color: lighten($blue, 13);
      }
      &.database {
        color: lighten($royal, 13);
      }
    }
  }

  .label {
    padding-bottom: 1rem;
  }

  .hover-text-popper {
    z-index: 99999;
  }
  .expand-actor,
  .collapse-actor {
    z-index: 99999;
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: -1px;
    transition: $transition;
    color: #e3e5e854;
    &:hover {
      color: $white;
      cursor: pointer;
    }
  }
  .hide-container {
    display: inline-block;
    z-index: 99999;

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

  .control-wrap {
    width: 100%;
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.5rem;
  }

  .http {
    color: #8e45aa;
  }

  .external-service {
    color: $yellow;
  }
  .package {
    color: $teal;
  }
  .class {
    color: $blue;
  }
  .database {
    color: $royal;
  }
}

.label-container.stack {
  //border: 2px solid $black;
  border-radius: 0rem;
  &.stack1 {
    z-index: 4;
    margin: 8px 0 0 6px;
    border: 1px solid darken($gray4, 15);
  }
  &.stack2 {
    z-index: 3;
    margin: 14px 0 0 12px;
    border: 1px solid darken($gray4, 30);
  }
}

.interactive.label-container:hover {
  cursor: pointer;
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
  border-left: 1px dashed #242c41; //$gray4;
  position: relative;
  height: 100%;
  width: 1px;
  top: 0;
  left: 100%;
  float: left;
}
</style>
