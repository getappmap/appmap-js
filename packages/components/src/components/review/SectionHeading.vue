<template>
  <div class="section-heading">
    <h2 class="section-heading__title">{{ title }}</h2>
    <p v-if="subtitle" class="section-heading__subtitle">{{ subtitle }}</p>
    <div class="section-heading__decorator"></div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

export default Vue.extend({
  name: 'SectionHeading',
  props: {
    title: {
      type: String as PropType<string>,
      required: true,
    },
    subtitle: {
      type: String as PropType<string | undefined>,
      required: false,
    },
  },
});
</script>

<style scoped lang="scss">
.section-heading {
  &__title {
    margin: 0;
    font-size: 1.75rem;
    font-weight: bold;
    color: $color-foreground-light;
  }

  &__subtitle {
    color: $color-foreground-secondary;
    margin-top: 0.5rem;
  }

  &__decorator {
    width: 5rem;
    height: 0.25rem;
    background-color: $color-highlight;
    margin-top: 0.5rem;
    border-radius: $border-radius;
  }
}
</style>
