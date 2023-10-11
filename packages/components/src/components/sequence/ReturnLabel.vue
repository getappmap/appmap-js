<template functional>
  <div class="label">
    <span class="name">{{ props.label }}</span>
    <span :class="[props.returnValue ? 'tooltip' : 'hidden']">{{ props.returnValue }}</span>
  </div>
</template>

<script>
import { ActionSpec } from './ActionSpec';

export default {
  name: 'v-sequence-return-label',

  props: {
    actionSpec: {
      type: ActionSpec,
      required: true,
      readonly: true,
    },
    returnValue: {
      type: String,
      required: true,
      readonly: true,
    },
    label: {
      type: String,
      readonly: true,
    },
  },
};
</script>

<style scoped lang="scss">
// See also: CallLabel .label
.label {
  display: inline-block;
  font-size: 9pt;
  font-family: 'IBM Plex Mono', monospace;
  margin-left: 1em;
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-style: italic;
  color: lighten($gray4, 20);
}

.tooltip {
  position: absolute;
  background-color: #fff;
  color: #000;
  border: 1px solid #ccc;
  padding: 5px;
  z-index: 1;
  opacity: 0.9;
  display: none;
}

.label:hover .tooltip {
  display: inline-block;
}

.hidden {
  display: none;
}
</style>
