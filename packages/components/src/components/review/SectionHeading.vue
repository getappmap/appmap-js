<template>
  <div class="section-heading">
    <div class="section-heading__title">
      <h2>{{ title }} <v-loader class="section-heading__loader" v-if="loading" /></h2>
      <slot />
    </div>

    <p v-if="subtitle" class="section-heading__subtitle">{{ subtitle }}</p>

    <v-skeleton-loader v-if="loading" class="section-heading__decorator" />
    <div class="section-heading__decorator section-heading__decorator--loaded" v-else></div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import VLoader from '@/components/chat/Loader.vue';
import VSkeletonLoader from '@/components/SkeletonLoader.vue';

export default Vue.extend({
  name: 'SectionHeading',
  components: {
    VLoader,
    VSkeletonLoader,
  },
  props: {
    title: {
      type: String as PropType<string>,
      required: true,
    },
    subtitle: {
      type: String as PropType<string | undefined>,
      required: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style scoped lang="scss">
.section-heading {
  &__title {
    display: flex;
    h2 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: bold;
      color: $color-foreground-light;
    }
  }

  &__subtitle {
    color: $color-foreground-secondary;
    margin-top: 0.5rem;
  }

  &__decorator {
    width: 5rem !important;
    height: 0.25rem !important;
    border-radius: $border-radius;
    margin-top: 0.5rem;

    &--loaded {
      background-color: $color-highlight;
    }
  }

  &__loader {
    display: inline-flex !important;
    transform: translateY(-50%);
    align-items: center;
    justify-content: center;
    width: 2rem !important;
    opacity: 0.2;
    padding-left: 1em;
  }
}
</style>
