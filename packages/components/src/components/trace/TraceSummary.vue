<template>
  <div
    class="trace-summary"
    @click="$emit('click')"
    @mouseover="hover = true"
    @mouseleave="hover = false"
  >
    <div ref="text" class="trace-summary__content">
      {{ text }}
    </div>
  </div>
</template>

<script>
import { Event } from '@appland/models';

export default {
  name: 'v-trace-summary',
  components: {},
  props: {
    event: {
      type: Event,
      required: true,
    },
  },
  data() {
    return {
      hover: false,
    };
  },
  computed: {
    text() {
      const numChildren = this.event.children.length;
      return `${numChildren} ${numChildren === 1 ? 'child' : 'children'}`;
    },
  },
  methods: {
    getElement() {
      return new Promise((resolve) =>
        this.$nextTick(() => resolve(this.$refs.text))
      );
    },
  },
};
</script>

<style lang="scss">
.trace-summary {
  user-select: none;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  cursor: pointer;

  &__content {
    margin: 1rem 0 0 1rem;
    padding: 0.25em 0.75em;
    background: $gray2;
    color: #bababa;
    transition-property: color, background;
    transition-duration: 0.2s;
    transition-timing-function: ease-in;
    box-shadow: 0.2em 0.2em 10px 0px rgb(0 0 0 / 60%);
    min-width: 1.5rem;
    border-radius: 1rem;
    text-align: center;
    width: fit-content;

    &:hover {
      color: $white;
      background: lighten($gray2, 10);
    }
  }
  padding-top: 0.75em;
}
</style>
