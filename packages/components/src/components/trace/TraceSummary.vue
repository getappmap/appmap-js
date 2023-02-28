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
    async getElement() {
      await this.$nextTick();
      return this.$refs.text;
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
    position: relative;
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

    &::before {
      content: '';
      display: block;
      position: absolute;
      top: 50%;
      left: -1rem;
      width: 1.1rem;
      height: 4px;
      transform: translateY(-1px);
      background-color: $gray4;
      z-index: -1;
    }
  }
  padding-top: 0.75em;
}
</style>
