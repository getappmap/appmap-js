<template>
  <section class="code-labels-section">
    <div class="code-labels-section__container">
      <section-heading title="Suggested Code Labels" />

      <div class="code-labels-section__grid">
        <div v-for="(item, index) in codeLabelItems" :key="index" class="code-labels-section__card">
          <div class="code-labels-section__card-header">
            <!-- Placeholder for Tag icon. Replace with your project's icon component -->
            <span class="code-labels-section__icon" aria-hidden="true">🏷️</span>
            <h3 class="code-labels-section__label-text">{{ item.label }}</h3>
          </div>
          <p class="code-labels-section__description">{{ item.description }}</p>
          <div class="code-labels-section__location">
            {{ item.location }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import Vue from 'vue';
import SectionHeading from '@/components/review/SectionHeading.vue';

interface CodeLabelItem {
  label: string;
  description: string;
  location: string;
}

const codeLabelsData: CodeLabelItem[] = [
  {
    label: 'security.authentication',
    description:
      'JpaUserDetailsService.loadUserByUsername verifies user identity by loading user details from the database',
    location:
      'src/main/java/org/springframework/samples/petclinic/security/JpaUserDetailsService.java:26',
  },
  {
    label: 'security.authorization',
    description:
      'SecurityConfig.filterChain configures authorization rules for different URL patterns',
    location: 'src/main/java/org/springframework/samples/petclinic/config/SecurityConfig.java:38',
  },
  {
    label: 'security.logout',
    description: 'SecurityConfig.filterChain configures the logout functionality',
    location: 'src/main/java/org/springframework/samples/petclinic/config/SecurityConfig.java:47',
  },
  {
    label: 'secret',
    description:
      "User.getPassword returns the user's password which is a sensitive authentication credential",
    location: 'src/main/java/org/springframework/samples/petclinic/user/User.java:46',
  },
];

export default Vue.extend({
  name: 'CodeLabels',
  components: {
    SectionHeading,
  },
  data() {
    return {
      codeLabelItems: codeLabelsData as CodeLabelItem[],
    };
  },
});
</script>

<style scoped lang="scss">
$text-sm-equivalent: $font-size;
$text-xs-equivalent: 12px;

// For bg-gray-850, slightly darker than the card's bg-gray-800 ($color-tile-background)
$color-tile-background-inset: darken($color-tile-background, 4%);

.code-labels-section {
  padding-top: 2.5rem; //
  padding-bottom: 2.5rem;
  font-family: $font-family;

  &__container {
    width: 100%;
    max-width: $max-width;
    margin-left: auto;
    margin-right: auto;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  &__grid {
    margin-top: 1.5rem;
    display: grid;
    gap: 1rem;

    // md:grid-cols-2
    @media (min-width: 768px) {
      // Common breakpoint for 'md'
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  &__card {
    background-color: $color-tile-background; //
    border-radius: $border-radius-big;
    padding: 1.25rem;
    border: 1px solid $color-border;
    transition: border-color 0.2s ease-in-out;

    &:hover {
      border-color: $color-highlight;
    }
  }

  &__card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  &__icon {
    color: $color-link;
    height: 1.25rem;
    width: 1.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }

  &__label-text {
    color: $color-link;
    font-family: monospace;
    font-weight: 500;
    font-size: $text-sm-equivalent;
  }

  &__description {
    color: $color-foreground-dark;
    font-size: $text-sm-equivalent;
    margin-bottom: 0.75rem;
    line-height: 1.5;
  }

  &__location {
    color: $color-foreground-secondary;
    font-size: $text-xs-equivalent;
    font-family: monospace;
    background-color: $color-tile-background-inset;
    padding: 0.5rem;
    border-radius: $border-radius;
    word-break: break-all;
  }
}
</style>
