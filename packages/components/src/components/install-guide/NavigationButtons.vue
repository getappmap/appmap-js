<template>
  <div :class="classes">
    <!-- <v-button
      label="Back"
      kind="ghost"
      @click.native="$root.$emit('page-previous')"
      v-if="!first"
    /> -->
    <v-button
      c
      label="NEXT STEP"
      @click.native="$root.$emit('page-next')"
      v-if="!last"
    />
  </div>
</template>

<script>
import VButton from '@/components/Button.vue';

export default {
  name: 'navigation-buttons',

  components: { VButton },

  props: {
    first: {
      type: Boolean,
      default: false,
    },
    last: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    classes() {
      return {
        buttons: true,
        'buttons--right': this.first,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
.buttons {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;

  &--right {
    justify-content: right;
  }
}
</style>
