<template>
  <header class="app-header">
    <div class="app-header__container">
      <div class="app-header__brand">
        <!-- Placeholder for Shield icon. Replace with your project's icon component -->
        <shield />
        <h1 class="app-header__title">AppMap Code Review</h1>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import Vue from 'vue';
import { Shield } from 'lucide-vue';

export default Vue.extend({
  name: 'v-header',
  components: {
    Shield,
  },
});
</script>

<style scoped lang="scss">
$text-xl-equivalent: 1.25rem; //

.app-header {
  background-color: $color-background;
  border-bottom: 1px solid $color-tile-background;
  padding-top: 1rem;
  padding-bottom: 1rem;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  position: sticky;
  top: 0;
  z-index: 10;
  font-family: $font-family;

  &__container {
    width: 100%;
    max-width: $max-width;
    margin-left: auto;
    margin-right: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__brand-icon {
    color: $color-highlight;
    height: 1.5rem;
    width: 1.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
  }

  &__title {
    color: $color-foreground-light;
    font-size: $text-xl-equivalent;
    font-weight: 600;
  }

  &__nav-list {
    display: flex;
    list-style: none;
    padding: 0;
    margin: 0;
    gap: 1.5rem;
  }

  &__nav-item {
    // No specific styles needed for li itself if only containing an 'a' tag
  }

  &__nav-link {
    color: $color-foreground-dark;
    text-decoration: none;
    transition: color 0.2s ease-in-out;

    &:hover {
      color: $color-foreground-light;
    }
  }
}
</style>
