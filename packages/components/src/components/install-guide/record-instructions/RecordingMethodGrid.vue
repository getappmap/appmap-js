<template>
  <div class="recording-method-grid">
    <slot />
  </div>
</template>

<script>
export default {
  mounted() {
    this.sortChildren();
  },
  updated() {
    this.sortChildren();
  },
  methods: {
    sortChildren() {
      [...this.$el.children]
        .sort((a, b) => parseInt(b.dataset.sortScore, 10) - parseInt(a.dataset.sortScore, 10))
        .forEach((el) => this.$el.appendChild(el));
    },
  },
};
</script>

<style lang="scss" scoped>
.recording-method-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 1rem;
}
</style>
