<template>
  <div ref="el">
    <slot />
  </div>
</template>

<script>
import Container from '@/lib/diagrams/helpers/container';

export default {
  name: 'v-container',

  props: {
    options: {
      type: Object,
      required: false,
    },
  },

  methods: {
    initContainer() {
      const childrenNodes = this.$children.map(($child) => $child.$el);
      const container = new Container(this.$refs.el, this.options);

      childrenNodes.forEach((child) => container.appendChild(child));
    },
  },

  mounted() {
    this.initContainer();
  },

  updated() {
    this.initContainer();
  },
};
</script>
