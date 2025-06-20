<template>
  <v-modal v-on="$listeners">
    <div class="modal-outer details-dialog">
      <div class="modal-content">
        <slot />
        <div class="footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </v-modal>
</template>

<script lang="ts">
import Vue from 'vue';
import VModal from '@/components/Modal.vue';

export default Vue.extend({
  components: { VModal },
});
</script>

<style scoped lang="scss">
.modal-outer {
  background-color: $color-background;
  padding: 0 0.25em;
  border-radius: $border-radius-big;
  box-shadow: $shadow-tile;
  position: relative;
  max-height: 85vh;
  height: fit-content;
  overflow-y: hidden;
  color: $color-foreground;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  overflow: hidden;

  &.details-dialog {
    width: 90vw;
    max-width: 800px;
  }

  .modal-content {
    padding: 0em 2em;
    overflow-x: visible;
    overflow-y: auto;
    max-height: inherit;

    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: $color-background;
      display: block;
      z-index: 1;
    }
  }
}
</style>
