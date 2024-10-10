<template>
  <div class="intellij-notice">
    <v-add-file-button class="button" @click.native="addFiles" />
    <p>
      or click the <span class="pin"><v-pin-icon /></span> pin icon in a Navie response
    </p>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VAddFileButton from '@/components/AddFileButton.vue';
import VPinIcon from '@/assets/pin.svg';

export default {
  name: 'v-intellij-notice',

  components: {
    VAddFileButton,
    VPinIcon,
  },
  methods: {
    addFiles() {
      this.$root.$emit('choose-files-to-pin');
    },
  },
};
</script>
<style lang="scss" scoped>
.intellij-notice {
  margin-bottom: 2em;

  p {
    user-select: none;
    line-height: 1.5;
    font-size: 1em;
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
  }
}
</style>
