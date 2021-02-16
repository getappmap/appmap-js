<template>
  <div class="container">
    <div ref="containerContent" style="transform: translate(0px, 0px)">
      <slot />
    </div>
  </div>
</template>

<script>
import Container from '@/lib/diagrams/helpers/container';

export default {
  name: 'v-container',
  methods: {
    buildContainer() {
      return new Container(
        null,
        {
          pan: { momentum: true },
          zoom: { controls: true },
        },
        this.$el,
        this.$refs.containerContent
      );
    },
  },
  mounted() {
    this.buildContainer();
  },
};
</script>

<style scoped lang="scss">
.container {
  overflow: hidden;
}
</style>
