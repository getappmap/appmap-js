<template>
  <div :class="classes">
    <v-button
      label="Back"
      kind="ghost"
      data-cy="back-button"
      @click="pagePrevious()"
      v-if="!first"
    />
    <v-button
      c
      :kind="nextButtonType"
      label="Next"
      data-cy="next-button"
      @click="pageNext()"
      v-if="!last"
    />
  </div>
</template>

<script>
import VButton from '@/components/Button.vue';
import eventBus from '@/lib/eventBus';

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
    complete: {
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
    nextButtonType() {
      return this.complete ? 'primary' : 'ghost';
    },
  },

  methods: {
    pagePrevious() {
      eventBus.emit('page-previous');
    },
    pageNext() {
      eventBus.emit('page-next');
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
