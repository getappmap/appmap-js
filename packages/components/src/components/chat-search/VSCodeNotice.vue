<template>
  <p>
    Drag and hold <v-up-arrow class="arrow" />SHIFT to add files here<br />
    or click the <v-pin-icon class="pin" /> pin icon in a Navie response
  </p>
</template>

<script lang="ts">
//@ts-nocheck
import VUpArrow from '@/assets/up-arrow-outline.svg';
import VPinIcon from '@/assets/pin.svg';

export default {
  name: 'v-vscode-notice',

  components: {
    VUpArrow,
    VPinIcon,
  },
};
</script>
<style lang="scss" scoped>
p {
  margin-top: 0;
  margin-bottom: 2rem;
  user-select: none;
  line-height: 1.5;
  font-size: 1rem;
  color: rgba(white, 0.66);

  svg {
    height: 16px;
    width: 16px;

    path {
      fill: $gray4;
    }
  }

  .pin {
    vertical-align: text-bottom;
  }

  .arrow {
    margin-right: 0.33rem;
  }
}
</style>
