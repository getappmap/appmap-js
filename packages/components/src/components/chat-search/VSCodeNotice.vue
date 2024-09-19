<template>
  <div>
    <h3><v-up-arrow />SHIFT + DRAG to put files here</h3>
    <p>
      or click the <span class="pin"><v-pin-icon /></span> pin icon in a Navie response
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
h3 {
  margin-bottom: 0.5rem;
}

p {
  margin-top: 0;
  margin-bottom: 2rem;
}

h3 {
  display: inline-block;
  // background-color: rgba(black, 0.1);
  color: $gray4;
  transition: background-color 0.2s ease-in-out;
  user-select: none;
  svg {
    margin-right: 0.33rem;
  }
}

.pin svg {
  vertical-align: text-bottom;
}

h3,
p {
  svg {
    height: 16px;
    width: 16px;

    path {
      fill: $gray4;
    }
  }
}
</style>
