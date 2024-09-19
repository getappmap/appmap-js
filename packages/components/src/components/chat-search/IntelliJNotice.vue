<template>
  <div>
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
.button {
  margin-bottom: 0.5rem;
}

p {
  margin-top: 0;
  margin-bottom: 2rem;
}

.pin {
  display: inline-block;
  // background-color: rgba(black, 0.1);
  color: $gray4;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  user-select: none;

  svg {
    height: 16px;
    width: 16px;
    vertical-align: text-bottom;

    path {
      fill: $gray4;
    }
  }
}
</style>
