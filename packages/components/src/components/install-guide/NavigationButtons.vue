<template>
  <div :class="classes">
    <v-button
      label="Back"
      kind="ghost"
      data-cy="back-button"
      @click.native="$root.$emit('page-previous')"
      v-if="!first"
    />
    <v-button
      c
      kind="ghost"
      label="Next"
      data-cy="next-button"
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
  justify-content: space-between;

  &--right {
    justify-content: right;
  }
}
</style>
