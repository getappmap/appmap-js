<template>
  <section class="section">
    <h1 class="section__title">{{title}}</h1>
    <div class="section__content">
      <slot />
    </div>
  </section>
</template>

<script>
export default {
  name: 'v-section',

  props: {
    title: {
      type: String,
      required: true,
    },
  },
};
</script>

<style scoped lang="scss">
  .section {
    display: flex;
    flex-direction: column;

    &__title {
      padding: 0.4rem 1rem;
      font-size: 0.8rem;
      color: $gray6;
      background-color: $black;
      text-align: center;
    }

    &__content {
      flex: 1;
      overflow: auto;
    }
  }
</style>
