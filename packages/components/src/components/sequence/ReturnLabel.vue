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
  max-width: 160px;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-style: italic;
  color: lighten($gray4, 20);

  .name {
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .tooltip {
    position: fixed;
    background-color: #fff;
    color: #000;
    border: 1px solid #ccc;
    padding: 5px;
    z-index: 1;
    opacity: 0.9;
    display: none;
    max-width: 450px;
    overflow-wrap: break-word;
  }
}

.label:hover .tooltip {
  display: inline-block;
}

.hidden {
  display: none;
}
</style>
