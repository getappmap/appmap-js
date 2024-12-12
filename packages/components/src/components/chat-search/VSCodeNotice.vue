<template>
  <div class="vscode-notice">
    <p>Drag and hold <v-up-arrow class="arrow" />SHIFT to add files here.</p>
    <p>
      Content within a conversation can be added by clicking the <v-pin-icon class="pin" /> pin icon
      in a Navie response.
    </p>
  </div>
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
.vscode-notice {
  margin-bottom: 2em;

  p {
    &:first-child {
      margin-top: 0;
    }

    user-select: none;
    line-height: 1.5;
    font-size: 1em;

    svg {
      height: 16px;
      width: 16px;

      path {
        fill: $color-foreground;
      }
    }

    .pin {
      vertical-align: text-bottom;
    }

    .arrow {
      margin-right: 0.33rem;
    }
  }
}
</style>
